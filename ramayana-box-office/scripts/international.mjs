import assert from 'node:assert/strict';

const symbols = {GBP:'£', AUD:'A$', NZD:'NZ$', EUR:'€', NGN:'₦', THB:'฿', VND:'₫', MYR:'MYR ', SGD:'S$', HKD:'HK$', HUF:'Ft ', NPR:'NPR ', USD:'US$', BRL:'R$', MXN:'MX$'};
const measures = {weekend:'Weekend', week:'Full week', day:'Day', cumulative:'Cumulative'};
const shortDate = new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', timeZone:'UTC'});
const utc = value => new Date(value + 'T00:00:00Z');

export function amount(row, market) {
  const unit = row.unit ?? market.unit;
  const scaled = row.millions !== undefined;
  const digits = row.millions ?? row.decimals ?? (Number.isInteger(row.amount) ? 0 : 2);
  const number = (scaled ? row.amount / 1e6 : row.amount).toLocaleString('en-US', {
    minimumFractionDigits:digits, maximumFractionDigits:digits
  });
  return (row.qualifier ? row.qualifier + ' ' : '') + (symbols[unit] || '') + number +
    (scaled ? 'm' : '') + (unit === 'admissions' ? ' admissions' : '');
}

function period(row) {
  if (row.chartDate) return 'Chart dated ' + shortDate.format(utc(row.chartDate));
  if (!row.end) return 'Cutoff unstated';
  if (row.start) return shortDate.formatRange(utc(row.start), utc(row.end));
  return (row.kind === 'cumulative' ? 'Through ' : '') + shortDate.format(utc(row.end));
}

export function internationalPanels(data, {byId, html, dateLabel, validDate}) {
  const {checked, markets, reception, weekendEnds} = data;
  const sources = new Map([...byId].map(([id, s]) => [id, {label:s.name, url:s.url}]));
  for (const [id, source] of Object.entries(data.sources)) {
    assert.ok(!sources.has(id) && source.label && new URL(source.url).protocol === 'https:', 'Invalid international source ' + id);
    sources.set(id, source);
  }
  const links = ids => ids.map(id => {
    assert.ok(sources.has(id), 'Unknown international source ' + id);
    const {url, label} = sources.get(id);
    return '<a href="' + html(url) + '">' + html(label) + '</a>';
  }).join(' · ');
  validDate(checked);
  validDate(data.receptionChecked);
  assert.ok(data.receptionChecked <= checked);
  assert.equal(weekendEnds.length, 2);
  weekendEnds.forEach(validDate);
  assert.ok(weekendEnds[0] < weekendEnds[1] && weekendEnds[1] <= checked);
  const groups = ['Weekly charts','Other market reports','USD territory reports','Release watchlist'];
  const ids = new Set();
  for (const m of markets) {
    assert.match(m.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!ids.has(m.id) && m.name && m.method && m.refresh && m.links.length && groups.includes(m.group), 'Invalid market ' + m.id);
    ids.add(m.id);
    assert.ok(m.unit === 'admissions' || Object.hasOwn(symbols,m.unit));
    if (m.release) { validDate(m.release); assert.ok(m.release <= checked); }
    assert.ok(m.observations.length || (m.release && m.group === 'Release watchlist'), 'Missing market data ' + m.name);
    for (const r of m.observations) {
      assert.ok(Object.hasOwn(measures,r.kind) && Number.isFinite(r.amount) && r.amount >= 0 && sources.has(r.source), 'Invalid observation for ' + m.name);
      if (r.unit) assert.ok(r.unit === 'admissions' || Object.hasOwn(symbols,r.unit));
      if (r.unit === 'admissions' || m.unit === 'admissions') assert.ok(Number.isSafeInteger(r.amount));
      for (const d of [r.start,r.end,r.chartDate].filter(Boolean)) { validDate(d); assert.ok(d <= checked); }
      assert.ok(r.end || (r.end === null && r.kind === 'cumulative'), 'Missing reporting period for ' + m.name);
      if (['weekend','week'].includes(r.kind)) assert.ok(r.start && r.end && r.start < r.end);
      if (r.chartDate) assert.equal(r.end, null);
    }
  }
  function weekRow(m) {
    const primary = m.observations.filter(r => !r.parallel && (r.unit ?? m.unit) === m.unit);
    const comparison = m.comparisonSource ? m.observations.filter(r => r.source === m.comparisonSource && (r.unit ?? m.unit) === m.unit) : primary;
    const weekends = weekendEnds.map(end => comparison.find(r => r.kind === 'weekend' && r.end === end));
    const cumulative = primary.filter(r => r.kind === 'cumulative' && r.end).sort((a,b) => b.end.localeCompare(a.end))[0];
    const cell = (r,label) => '<td data-label="' + label + '">' + (r
      ? '<b>' + html(amount(r,m)) + '</b><small>' + html(period(r)) + (r.status ? ' · ' + html(r.status.toLowerCase()) : '') + '</small>'
      : '<small>Unavailable</small>') + '</td>';
    let change = 'Unavailable';
    let bar = '';
    if (weekends[0]?.amount > 0 && weekends[1]) {
      const delta = (weekends[1].amount / weekends[0].amount - 1) * 100;
      change = (delta > 0 ? '+' : '') + delta.toFixed(1).replace('-', '−') + '%';
      bar = '<span class="change-track" aria-hidden="true"><i style="width:' + Math.min(100,Math.abs(delta)).toFixed(1) + '%"></i></span>';
    }
    return '<tr><th scope="row"><a href="#market-' + m.id + '">' + html(m.name) + '</a></th>' +
      cell(weekends[0],'Earlier weekend') + cell(weekends[1],'Later weekend') +
      '<td data-label="Change" class="intl-change">' + change + bar + '</td>' + cell(cumulative,'Cumulative') + '</tr>';
  }
  function record(m) {
    const primary = m.observations.filter(r => !r.parallel && (r.unit ?? m.unit) === m.unit);
    const recent = primary.at(-1);
    let headline = 'Local gross pending';
    if (recent) headline = amount(recent,m) + ' · ' + (recent.kind === 'cumulative' ? '' : measures[recent.kind] + ' · ') + period(recent);
    if (m.cuts) {
      const cuts = m.cuts.map(source => primary.filter(r => r.source === source).at(-1));
      assert.ok(cuts.length > 1 && cuts.every(r => r && r.kind === 'cumulative' && r.end === cuts[0].end));
      headline = amount({amount:cuts.reduce((sum,r) => sum + r.amount, 0),decimals:2},m) + ' · Both cuts · ' + period(cuts[0]);
    }
    const entries = m.observations.map(r => {
      const basis = [r.note, r.preview && 'Previews ' + r.preview.toLowerCase(), r.status, r.parallel && 'Parallel publisher series'].filter(Boolean);
      return '<li><div><strong>' + html(amount(r,m)) + '</strong> <span>' + measures[r.kind] + ' · ' + html(period(r)) +
        '</span></div><small>' + (basis.length ? html(basis.join(' · ')) + ' · ' : '') + links([r.source]) + '</small></li>';
    });
    return '<details class="market-record" id="market-' + m.id + '"><summary>' + html(m.name) + '<small>' + html(headline) + '</small></summary><div class="market-body">' +
      '<p class="market-method">' + html(m.method) + '</p>' + (entries.length ? '<ul>' + entries.join('') + '</ul>' :
        '<p><strong>Local gross pending</strong> · Released ' + html(dateLabel(m.release)) + '</p>') +
      '<p>' + html(m.refresh) + '</p><p class="refs">' + links(m.links) + '</p>' +
      (reception.some(r => r.market === m.id) ? '<p><a href="#reception-' + m.id + '">Read local reception</a></p>' : '') + '</div></details>';
  }
  const featured = markets.filter(m => m.group === groups[0]);
  const watch = markets.filter(m => m.group === groups[3]).length;
  const directory = groups.map(group => {
    const members = markets.filter(m => m.group === group).sort((a,b) => a.name.localeCompare(b.name,'en'));
    return '<section class="market-group" data-category="' + html(group) + '"><h4>' + html(group) + '</h4><div class="market-records">' + members.map(record).join('') + '</div></section>';
  }).join('\n');
  for (const r of reception) assert.ok(ids.has(r.market) && r.type && r.text && r.sources.length, 'Invalid reception entry');
  return {
    international: '<div class="section-head"><div><p class="intl-kicker">International box office</p><h2 id="international-heading">The weekend by market</h2></div><p class="caption">Reviewed ' + dateLabel(checked) + '</p></div>' +
      '<p class="intl-lead">' + html(data.weekendReading) + '</p>' +
      '<table class="intl-weekly"><caption>Weekend change in each market’s own currency. Dates follow the local chart.</caption><thead><tr><th scope="col">Market</th>' +
      weekendEnds.map(d => '<th scope="col">Weekend to ' + shortDate.format(utc(d)) + '</th>').join('') +
      '<th scope="col">Change</th><th scope="col">Cumulative gross</th></tr></thead><tbody>' + featured.map(weekRow).join('') + '</tbody></table>' +
      '<p class="intl-foot">' + html(data.weekendNotes) + '</p>' +
      '<div class="directory-head"><div><h3 id="market-directory">Market directory</h3><p class="sub">' + (markets.length-watch) +
      ' markets with figures and ' + watch + ' release watchlists. The <a href="#release-map">worldwide release map</a> also shows openings awaiting a first gross.</p></div>' +
      '<label class="market-filter js-only">Show <select id="market-filter"><option value="">All markets</option>' +
      groups.map(g => '<option>' + html(g) + '</option>').join('') + '</select></label></div><p id="market-count" class="sr" aria-live="polite"></p>' + directory +
      '<p class="intl-foot">Mojo groups Malta with the UK and Ireland, and Fiji with New Zealand. Geographic coverage and cutoffs vary. Adding these rows to the worldwide total would count receipts twice. Unless qualified in the entry, figures follow the publisher’s stated precision and preview treatment is unspecified. ' + links(['rollout','numbers','geos']) + '</p>',
    'international-reception':'<div class="intl-reception-head"><h3 id="international-reception">International reception</h3><p class="sub">Local criticism, audience reporting and ticket-buyer responses · ' + dateLabel(data.receptionChecked) + '</p></div><div class="intl-reviews">' +
      reception.map(r => '<article id="reception-' + r.market + '"><p class="intl-kicker">' + html(r.type) + '</p><h4>' + html(r.label) + '</h4><p>' + html(r.text) + '</p><p class="refs">' + links(r.sources) + '</p></article>').join('\n') + '</div>'
  };
}
