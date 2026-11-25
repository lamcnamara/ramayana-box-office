import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { amount } from './international.mjs';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const json = name => JSON.parse(read(name));
const input = name => '../atlas/' + name;
const linkIsSafe = url => assert.equal(new URL(url).protocol, 'https:');

// The UK and Ireland ledger is explicitly a combined territory. Keep it in the directory.
const directoryCodes = {
  australia:'AU', 'new-zealand':'NZ', netherlands:'NL', portugal:'PT', nigeria:'NG',
  thailand:'TH', hungary:'HU', vietnam:'VN', germany:'DE', malaysia:'MY', singapore:'SG',
  'hong-kong':'HK', uae:'AE', 'south-africa':'ZA', nepal:'NP', france:'FR', spain:'ES',
  italy:'IT', bulgaria:'BG', cambodia:'KH', croatia:'HR', egypt:'EG', finland:'FI',
  indonesia:'ID', lithuania:'LT', norway:'NO', romania:'RO', slovakia:'SK',
  slovenia:'SI', turkiye:'TR', brazil:'BR', mexico:'MX'
};

export function atlasPanels({days, international, byId, html, dateLabel, validDate}) {
  const {asOf, markets} = json(input('grosses.json'));
  const releases = json(input('releases.json'));
  const world = json('../world-map.json');
  validDate(asOf);
  for (const [code, release] of Object.entries(releases)) {
    const {date, status, dateType, source} = release;
    assert.ok(world.countries[code]?.point?.length === 2, 'Missing map position for ' + code);
    linkIsSafe(source);
    assert.ok(['released','scheduled','unconfirmed'].includes(status));
    assert.ok(['exact','by','unknown'].includes(dateType));
    if (date === null) assert.ok(status === 'unconfirmed' && dateType === 'unknown');
    else {
      validDate(date);
      assert.ok((status === 'released' && date <= asOf) || (status === 'scheduled' && date > asOf));
    }
  }
  const india = markets.IN;
  let total = 0;
  const indiaSource = byId.get('sacnilk');
  const ledger = days.filter(r => r.indiaCrore !== null && r.date <= asOf).map(r => {
    total = Math.round((total + r.indiaCrore) * 100) / 100;
    return {date:r.date, daily:r.indiaCrore, cumulative:total, sourceUrl:indiaSource.url};
  });
  india.rows = [...ledger, ...india.rows.filter(r => r.date > ledger.at(-1).date)];
  const directory = {};
  for (const m of international.markets) {
    const code = directoryCodes[m.id];
    if (!code) continue;
    directory[code] = {id:m.id, rows:m.observations.filter(r => r.end && !r.parallel && r.end <= asOf).map(r => {
      const source = international.sources[r.source] ?? byId.get(r.source);
      return {date:r.end, kind:r.kind, start:r.start, unit:r.unit ?? m.unit, value:amount(r,m),
        status:r.status, note:r.note, sourceUrl:source.url, sourceName:source.label ?? source.name};
    }).sort((a,b) => a.date.localeCompare(b.date))};
  }
  for (const [code, m] of Object.entries(markets)) {
    assert.ok(releases[code]?.status === 'released' && m.rows.length);
    assert.ok(['USD','INR_CR'].includes(m.unit) && ['daily','weekend'].includes(m.cadence));
    linkIsSafe(m.sourceUrl);
    let previous;
    for (const r of m.rows) {
      validDate(r.date);
      assert.ok(r.date >= releases[code].date && r.date <= asOf && (!previous || previous.date < r.date), 'Bad reporting date in ' + code);
      assert.ok(Number.isFinite(r.cumulative) && r.cumulative >= 0);
      if (m.cadence === 'daily') {
        assert.ok(Number.isFinite(r.daily) && r.daily >= 0);
        if (previous) assert.equal(Date.parse(r.date) - Date.parse(previous.date), 86400000);
        assert.ok(Math.abs((previous?.cumulative ?? 0) + r.daily - r.cumulative) < 0.005, 'Daily sum mismatch in ' + code);
      } else {
        validDate(r.periodStart);
        assert.ok(r.periodStart < r.date && Number.isFinite(r.weekend) && r.weekend >= 0);
      }
      previous = r;
    }
  }
  const entries = Object.entries(releases).sort((a,b) => a[1].name.localeCompare(b[1].name,'en'));
  const register = entries.map(([,r]) => {
    const prefix = r.status === 'scheduled' ? 'Scheduled ' : r.dateType === 'by' ? 'In cinemas by ' : '';
    return '<tr><th scope="row">' + html(r.name) + '</th><td>' + (r.date ? prefix + dateLabel(r.date) : 'Date unconfirmed') +
      '</td><td><a href="' + html(r.source) + '">' + html(r.basis) + '</a> · ' + html(r.note) + '</td></tr>';
  }).join('');
  const lastFigures = Object.values(markets).map(m => {
    const r = m.rows.at(-1);
    return html(m.name) + ' · ' + (m.unit === 'USD' ? 'US$' : '₹') +
      r.cumulative.toLocaleString('en-US') + (m.unit === 'INR_CR' ? ' crore' : '') +
      ' through ' + dateLabel(r.date) + ' (<a href="' + html(m.sourceUrl) + '">' + html(m.sourceName) + '</a>)';
  });
  const registerHtml = '<details class="atlas-register"><summary>Release dates, figures and sources</summary>' +
    '<p>Evidence checked ' + dateLabel(asOf) + '. A dated screening establishes that a market was open by that day. Future bookings and undated announcements are listed separately from releases in the replay.</p>' +
    '<p>' + lastFigures.join(' · ') + '.</p><p>India uses Sacnilk trade estimates. Values are placed on the reporting period’s closing date, using the latest reviewed version. Converted amounts use the dashboard’s rupees-per-dollar setting. Pilot markets are a subset of the worldwide gross.</p>' +
    '<div class="atlas-list" tabindex="0" aria-label="Release register"><table><thead><tr><th>Market</th><th>Theatrical date</th><th>Evidence</th></tr></thead><tbody>' + register +
    '</tbody></table></div><p>Map geography: <a href="https://www.naturalearthdata.com/">Natural Earth</a>. Small territories are represented by points.</p></details>';
  const payload = JSON.stringify({asOf, markets, releases, world, directory}).replace(/</g,'\\u003c');
  return {
    'atlas-style':'<style>\n' + read(input('map.css')) + '</style>',
    'atlas-panel':read(input('panel.html')) + registerHtml,
    'atlas-runtime': '<script type="application/json" id="atlas-data">' + payload +
      '</script>\n<script id="atlas-runtime">\n' + read(input('map.js')) + '\n</script>'
  };
}
