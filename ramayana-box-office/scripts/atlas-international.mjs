import { readFileSync } from 'node:fs';

const supplements = JSON.parse(readFileSync(new URL('../atlas/local-reports.json', import.meta.url), 'utf8'));
const codes = {netherlands:'NL', portugal:'PT', nigeria:'NG', thailand:'TH', hungary:'HU',
  italy:'IT', nepal:'NP', vietnam:'VN'};
const ecb = 'https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2026/11/20261106.pdf';
const rates = {
  EUR: {usd:1.1165, basis:'ECB reference rate, €1 = US$1.1165', url:ecb},
  HUF: {usd:1.1165/363.90, basis:'ECB cross-rate, €1 = HUF 363.90 = US$1.1165', url:ecb},
  THB: {usd:1.1165/37.459, basis:'ECB cross-rate, €1 = THB 37.459 = US$1.1165', url:ecb},
  NGN: {usd:1/1349, basis:'Nigerian FX market close, US$1 = NGN 1,349',
    url:'https://nairametrics.com/2026/11/07/naira-weakens-0-22-as-fx-turnover-slows-to-1-45-billion-in-novembers-first-week/'},
  NPR: {usd:1/151.17, basis:'Nepal Rastra Bank midpoint, US$1 = NPR 151.17 (buy 150.87, sell 151.47)',
    url:'https://topnepali.com/tools/forex/archive/2026-11-06'},
  VND: {usd:1/25615, basis:'State Bank of Vietnam reference rate, US$1 = VND 25,615',
    url:'https://en.vietnamplus.vn/reference-exchange-rate-maintains-downward-trend-on-november-6-post354932.vnp'}
};

function previousDate(date) {
  return new Date(Date.parse(date) - 86400000).toISOString().slice(0,10);
}
const cents = n => Math.round(n * 100) / 100;

function datedTotals(records, opening) {
  const totals = new Map(records.filter(r => r.kind === 'cumulative').map(r => [r.end,r]));
  const implied = new Map();
  for (const period of records.filter(r => r.start && ['week','weekend'].includes(r.kind))) {
    const end = totals.get(period.end);
    // A subtraction only works with one publisher, currency, preview treatment and reporting scope.
    if (!end || end.source !== period.source || end.unit !== period.unit ||
        end.preview !== period.preview || end.status !== period.status || end.qualifier || period.qualifier) continue;
    const date = previousDate(period.start);
    const amount = cents(end.amount - period.amount);
    if (amount <= 0 || (opening && date < opening) || totals.has(date)) continue;
    const row = {...end, end:date, amount, note:'Reconstructed from the cumulative gross through ' +
      period.end + ' minus the entire ' + period.start + ' to ' + period.end + ' gross.'};
    // Inconsistent period editions can imply different opening balances for the same date.
    if (implied.has(date) && implied.get(date)?.amount !== amount) implied.set(date,null);
    else if (!implied.has(date)) implied.set(date,row);
  }
  for (const [date,row] of implied) if (row) totals.set(date,row);
  for (const day of records.filter(r => r.kind === 'day').sort((a,b) => a.end.localeCompare(b.end))) {
    const previous = totals.get(previousDate(day.end));
    if (!previous && day.end !== opening) continue;
    if (previous && (previous.unit !== day.unit || previous.qualifier || previous.status === 'Estimate')) continue;
    const amount = cents((previous?.amount ?? 0) + day.amount);
    if (totals.has(day.end) && totals.get(day.end).amount !== amount) continue;
    totals.set(day.end, {...day, amount, daily:day.amount, note:previous
      ? 'Reconstructed from the prior day’s dated cumulative gross plus the reported daily take.'
      : 'Opening-day gross.'});
  }
  for (const [date, row] of totals) {
    const prior = totals.get(previousDate(date));
    if (!row.series || row.series !== prior?.series || row.unit !== prior.unit ||
        row.status !== prior.status || row.qualifier || prior.qualifier || row.daily !== undefined) continue;
    const difference = cents(row.amount - prior.amount);
    if (difference < 0) continue;
    totals.set(date, {...row, daily:difference,
      note:'The daily change is the difference between consecutive rounded estimates from the same trade series.'});
  }
  return [...totals.values()].sort((a,b) => a.end.localeCompare(b.end));
}

export function internationalCheckpoints(international, byId, asOf) {
  const result = {};
  const sources = {...supplements.sources, ...international.sources};
  for (const market of international.markets) {
    const code = codes[market.id];
    if (!code) continue;
    const records = [...market.observations, ...(supplements.markets[code] ?? [])]
      .filter(r => r.end && r.end <= asOf && !r.parallel && (r.unit ?? market.unit) !== 'admissions')
      .map(r => ({...r, unit:r.unit ?? market.unit, series:sources[r.source]?.series}));
    const nativeRows = datedTotals(records, market.release ?? (code === 'IT' ? '2026-11-19' : null));
    if (!nativeRows.length) continue;
    const rate = rates[market.unit];
    const rows = nativeRows.map(r => {
      const source = sources[r.source] ?? byId.get(r.source);
      const factor = r.unit === 'USD' ? 1 : rates[r.unit].usd;
      const native = r.unit + ' ' + r.amount.toLocaleString('en-US',{maximumFractionDigits:2});
      return {
        date:r.end, cumulative:Math.round(r.amount * factor), nativeAmount:r.amount, nativeUnit:r.unit,
        sourceName:source.label ?? source.name, sourceUrl:source.url,
        ...(r.daily !== undefined && {daily:Math.round(r.daily * factor)}),
        ...(r.status && {status:r.status}), ...(r.qualifier && {qualifier:r.qualifier}),
        note:[(r.qualifier ? r.qualifier + ' ' : '') + native + ' cumulative.',
          r.note, r.daily === undefined ? '' : 'Daily gross: ' + r.unit + ' ' + r.daily.toLocaleString('en-US') + '.',
          r.unit === 'USD' ? 'The source reports US dollars.' : 'Converted at the 6 November reference rate.'].filter(Boolean).join(' ')
      };
    });
    const last = rows.at(-1);
    result[code] = {name:market.name, unit:'USD', cadence:'checkpoints',
      sourceName:last.sourceName, sourceUrl:last.sourceUrl,
      notes:'Each observation uses its own dated source. Local grosses use the 6 November 2026 ' + rate.basis +
        '. USD observations use the amount printed by the source.', fxSourceUrl:rate.url, rows};
  }
  return result;
}
