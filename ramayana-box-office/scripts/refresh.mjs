import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { internationalPanels } from './international.mjs';
import { atlasPanels } from './atlas.mjs';

const file = name => fileURLToPath(new URL(name, import.meta.url));
const pageFile = file('../../ramayana-box-office-snapshot-v2.html');
const dataFile = file('../snapshot.json');
const statusFile = file('../docs/PROJECT_STATUS.md');
const read = path => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const project = JSON.parse(read(dataFile));
const international = JSON.parse(read(file('../international.json')));
const { days, reviews, sources, opportunities, theaterWeekends } = project;
const latest = reviews.at(-1);
const byId = new Map(sources.map(s => [s.id, s]));
const fields = ['naUsd', 'indiaCrore', 'worldCrore'];
const html = value => String(value).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);
const dateLabel = date => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
}).format(new Date(date + 'T00:00:00Z'));

function validDate(date) {
  assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Date(date + 'T00:00:00Z').toISOString().slice(0, 10), date, 'Invalid calendar date ' + date);
}
function references(ids) {
  assert.ok(Array.isArray(ids) && ids.length, 'Missing source IDs');
  for (const id of ids) assert.ok(byId.has(id), 'Unknown source ' + id);
}
function textFields(item, keys) {
  for (const key of keys) assert.ok(typeof item[key] === 'string' && item[key].trim(), 'Missing ' + key);
}
function uniqueIds(items) {
  assert.equal(new Set(items.map(x => x.id)).size, items.length, 'Duplicate record ID');
  for (const item of items) assert.match(item.id, /^[a-zA-Z0-9-]+$/);
}
function validateTheaterWeekends() {
  assert.ok(Array.isArray(theaterWeekends) && theaterWeekends.length >= 2, 'Missing the first two weekends');
  let previousFriday = '';
  for (const {friday, grossUsd, reports} of theaterWeekends) {
    validDate(friday);
    const first = days.findIndex(day => day.date === friday);
    assert.ok(friday > previousFriday && new Date(friday).getUTCDay() === 5 &&
      first >= 0 && first + 2 < days.length, 'Expected a complete Friday–Sunday weekend on ' + friday);
    previousFriday = friday;
    const weekendGross = days.slice(first, first + 3).reduce((total, day) => total + day.naUsd, 0);
    assert.equal(grossUsd, weekendGross, 'Weekend gross differs from daily USD on ' + friday);
    const ids = reports.map(report => report.source);
    references(ids);
    assert.equal(new Set(ids).size, ids.length, 'Duplicate theater source on ' + friday);
    for (const {theaters, averageUsd} of reports) {
      assert.ok(Number.isSafeInteger(theaters) && theaters > 0, 'Invalid theater count on ' + friday);
      assert.ok(Number.isSafeInteger(averageUsd) && averageUsd >= 0 && Math.abs(grossUsd / theaters - averageUsd) < 1,
        'Weekend average differs from the source count by at least a dollar on ' + friday);
    }
  }
}
function validate() {
  [sources, opportunities, reviews].forEach(uniqueIds);
  for (const s of sources) {
    textFields(s, ['name', 'role', 'check']);
    assert.equal(new URL(s.url).protocol, 'https:');
    validDate(s.checked);
  }
  assert.ok(days.length >= 17, 'Keep the coverage used by the opening-period analysis');
  const sums = { naUsd: 0, indiaCrore: 0, worldCrore: 0 };
  const start = Date.UTC(2026, 10, 4);
  for (const [index, d] of days.entries()) {
    const expected = new Date(start + index * 86400000).toISOString().slice(0, 10);
    assert.equal(d.date, expected, 'Missing, duplicate or out-of-order date near ' + expected);
    assert.ok(index === 0 ? d.naStatus === 'preview' : index === 1 ? d.naStatus === 'allocated' :
      ['actual', 'estimate'].includes(d.naStatus), 'Invalid North American status on ' + d.date);
    assert.ok(Number.isSafeInteger(d.naUsd) && d.naUsd >= 0, 'Use whole USD on ' + d.date);
    for (const key of fields) {
      if (!index && key !== 'naUsd') {
        assert.equal(d[key], null, 'India and worldwide previews are unreported');
        continue;
      }
      assert.ok(Number.isFinite(d[key]) && d[key] >= 0, 'Missing or invalid ' + key + ' on ' + d.date);
      sums[key] += d[key];
    }
    assert.ok(d.worldCrore >= d.indiaCrore, 'India exceeds worldwide gross on ' + d.date);
  }
  validateTheaterWeekends();
  for (const [index, r] of reviews.entries()) {
    validDate(r.checked); validDate(r.through);
    assert.ok(r.checked >= r.through && (!index || r.checked >= reviews[index - 1].checked), 'Review dates out of order');
    textFields(r, ['summary', 'next', 'outcome']);
    references(r.sources);
    assert.ok(Array.isArray(r.revisions), 'Include a revisions array, even when empty');
    for (const change of r.revisions) {
      validDate(change.date);
      assert.ok([...fields, 'naStatus'].includes(change.field) && change.date <= r.through, 'Invalid revision field or date');
      assert.ok(change.before !== undefined && change.after !== undefined && change.before !== change.after, 'Missing revision values');
    }
  }
  for (const item of opportunities) {
    textFields(item, ['title', 'priority', 'status', 'next']);
    references(item.sources);
  }
  assert.equal(latest.through, days.at(-1).date, 'Last review must reconcile the last published day');
  for (const key of fields) {
    let controlValue = sums[key];
    if (key === 'naUsd' && latest.naControlRoundedTo === 1000) {
      assert.equal(days.at(-1).naStatus, 'estimate', 'Rounded controls require a provisional cutoff');
      controlValue = Math.round(controlValue / 1000) * 1000;
    }
    assert.ok(Number.isFinite(latest.totals[key]) && Math.abs(controlValue - latest.totals[key]) < 0.00001,
      'Daily rows do not match the source control total for ' + key);
  }
}

// Compare edits with the currently published rows, including estimate-to-actual changes.
function checkRevisions(previous) {
  assert.ok(previous.length <= days.length, 'Published dates are missing');
  for (const [index, old] of previous.entries()) {
    assert.equal(old.date, days[index].date);
    for (const field of [...fields, 'naStatus']) {
      if (old[field] === days[index][field]) continue;
      const recorded = latest.revisions.some(r => r.date === old.date && r.field === field &&
        r.before === old[field] && r.after === days[index][field]);
      assert.ok(recorded, 'Record the old and new ' + field + ' for ' + old.date + ' in the latest review');
    }
  }
}
const sourceLinks = ids => ids.map(id => {
  const s = byId.get(id);
  return '<a href="' + html(s.url) + '">' + html(s.name) + '</a>';
}).join(' · ');
function weekendTables() {
  const number = new Intl.NumberFormat('en-US');
  const dates = new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'});
  return theaterWeekends.map(({friday, grossUsd, reports}) => {
    const start = new Date(friday + 'T00:00:00Z');
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 2);
    const rows = reports.map(report => '<tr><th scope="row">' + sourceLinks([report.source]) +
      '</th><td>' + number.format(report.theaters) + '</td><td>$' + number.format(report.averageUsd) + '</td></tr>').join('');
    return '<table><caption>' + dates.formatRange(start, end) +
      '<span>$' + number.format(grossUsd) + (days.some(d => d.date >= friday && d.date <= end.toISOString().slice(0,10) && d.naStatus === 'estimate') ? ' estimated' : '') + ' weekend gross</span></caption>' +
      '<thead><tr><th scope="col">Source</th><th scope="col">Theaters</th><th scope="col">Gross per theater</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>';
  }).join('\n');
}
function weekendSummary() {
  const friday = theaterWeekends.at(-1).friday;
  const start = days.findIndex(d => d.date === friday);
  const weekend = days.slice(start, start + 3);
  const dates = new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
  const format = (amount, key) => key === 'naUsd' ? '$' + (amount / 1e6).toFixed(3) + 'm' :
    '₹' + amount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' crore';
  const figures = [['worldCrore','Worldwide'],['indiaCrore','India'],['naUsd','US and Canada']].map(([key, label]) => {
    const total = weekend.reduce((sum, row) => sum + row[key], 0);
    const running = days.slice(0, start + 3).reduce((sum, row) => sum + (row[key] ?? 0), 0);
    return '<div><dt>' + label + '</dt><dd>' + format(total,key) + '<small>' + format(running,key) + ' through Sunday</small></dd></div>';
  });
  return '<div class="section-head"><h2 id="weekend-heading">Weekend earnings</h2><p class="caption">' +
    dates.formatRange(new Date(friday), new Date(weekend[2].date)) + '</p></div><dl class="weekend-gross">' +
    figures.join('') + '</dl><p class="caption">Sacnilk estimates India and worldwide grosses. Worldwide includes India and the US and Canada. ' +
    sourceLinks(['sacnilk','numbers']) + ' · <a href="#theaters">US/Canada source comparison</a></p>';
}
function briefingPanel() {
  const {start, end, items} = project.briefing;
  validDate(start); validDate(end);
  assert.equal(Date.parse(end) - Date.parse(start), 3 * 86400000, 'Use four inclusive calendar days for the news');
  assert.ok(end <= latest.checked, 'The briefing cannot be dated after the review');
  assert.ok(items.length > 0, 'Include a dated briefing item');
  const itemsHtml = items.map(item => {
    validDate(item.date);
    assert.ok(item.date >= start && item.date <= end, 'Headline outside the briefing window');
    textFields(item, ['topic', 'text']);
    references(item.sources);
    return '<li><strong>' + html(item.topic) + '.</strong> ' + html(item.text) +
      ' <small><time datetime="' + item.date + '">' + dateLabel(item.date).replace(/ \d{4}$/, '') +
      '</time> · ' + sourceLinks(item.sources) + '</small></li>';
  }).join('\n');
  const period = new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  return '<div class="section-head"><h2 id="news-heading">Four-day news briefing</h2><p class="caption">' +
    period.formatRange(new Date(start),new Date(end)) + '</p></div><ul class="news-list">' + itemsHtml + '</ul>';
}
function management() {
  const sourceList = sources.map(s => '<dt>' + sourceLinks([s.id]) + ' · ' + html(s.role) +
    '</dt><dd>' + html(s.check) + ' <small>Checked ' + dateLabel(s.checked) + '.</small></dd>').join('\n');
  const backlog = opportunities.map(item => '<li><strong>' + html(item.title) + '</strong> · ' +
    html(item.priority) + ' priority · ' + html(item.status) + '<p>' + html(item.next) +
    '</p><p class="review-links">' + sourceLinks(item.sources) + '</p></li>').join('\n');
  const log = [...reviews].reverse().map(r => {
    const revisions = r.revisions.map(v => '<li>' + html(v.date) + ' · ' +
      ({naUsd:'North America, USD', indiaCrore:'India, ₹ crore', worldCrore:'Worldwide, ₹ crore', naStatus:'North American status'})[v.field] +
      ' · ' + html(v.before) + ' → ' + html(v.after) + '</li>').join('');
    return '<li><strong>' + html(r.id) + ' · ' + dateLabel(r.checked) + ' · ' + html(r.outcome) +
      '</strong><p>Figures through ' + dateLabel(r.through) + '. ' + html(r.summary) + '</p>' +
      (revisions ? '<ul>' + revisions + '</ul>' : '') + '<p class="review-links">' + sourceLinks(r.sources) + '</p></li>';
  }).join('\n');
  return '<div><h3>Review of ' + dateLabel(latest.checked) + '</h3><p>' + html(latest.summary) + '</p></div>\n' +
    '<div class="review-next"><h3>On the next manual refresh</h3><p>' + html(latest.next) + '</p></div>\n' +
    (latest.sourceNotes ? '<details><summary>Source review for this edition</summary><ul>' +
      latest.sourceNotes.map(n => {
        references(n.sources);
        return '<li>' + html(n.text) + ' ' + sourceLinks(n.sources) + '</li>';
      }).join('') + '</ul></details>\n' : '') +
    '<details><summary>Sources to check (' + sources.length + ')</summary><dl>' + sourceList + '</dl></details>\n' +
    '<details><summary>Content opportunities (' + opportunities.length + ')</summary><ul>' + backlog + '</ul></details>\n' +
    '<details><summary>Review history (' + reviews.length + ')</summary><ol>' + log + '</ol></details>';
}

function renderPage(original) {
  const runtime = original.match(/<script id="snapshot-dashboard">([\s\S]*?)<\/script>/);
  const payload = /(<script id="snapshot-data" type="application\/json">)([\s\S]*?)(<\/script>)/;
  assert.ok(runtime && payload.test(original), 'Missing embedded dashboard or data');
  checkRevisions(JSON.parse(original.match(payload)[2]));
  const context = { module: {exports: {}}, snapshotDays: days };
  runInNewContext(runtime[1], context, {timeout: 5000});
  const through = dateLabel(latest.through);
  const reviewed = dateLabel(latest.checked);
  const parts = { ...context.module.exports, 'date-range': '4 November 2026 – ' + through,
    'estimate-through': 'Tracker estimate through ' + through, 'footer-through': 'Figures through ' + through,
    'review-date': 'Checked ' + reviewed, 'data-count': days.length + ' dates · US$ millions',
    coverage: 'Reviewed ' + reviewed + '. The charts include previews and ' + (days.length - 1) +
      ' release days through ' + through + '. All three markets share this cutoff.',
    management: management(), 'theater-weekends': weekendTables(), 'weekend-summary': weekendSummary(), briefing: briefingPanel(),
    ...internationalPanels(international, {byId, html, dateLabel, validDate}),
    ...atlasPanels({days, international, byId, html, dateLabel, validDate})
  };
  let result = original.replace(payload, (_, open, old, close) =>
    open + '\n' + JSON.stringify(days).replace(/</g, '\\u003c') + '\n' + close);
  result = result.replace(/<title>[^<]*<\/title>/, '<title>Ramayana: Part 1 (2026) · Box office · ' + through + '</title>');
  for (const [key, content] of Object.entries(parts)) {
    const begin = '<!-- snapshot ' + key + ' -->', end = '<!-- end ' + key + ' -->';
    const start = result.indexOf(begin), stop = result.indexOf(end);
    assert.ok(start >= 0 && stop > start && result.lastIndexOf(begin) === start && result.lastIndexOf(end) === stop,
      'Missing or duplicate HTML markers for ' + key);
    result = result.slice(0, start + begin.length) + content + result.slice(stop);
  }
  return result;
}
function statusMarkdown() {
  const rows = opportunities.map(item => '- **' + item.id + ' · ' + item.title + '** (' + item.priority + ', ' + item.status +
    '). ' + item.next + ' Sources: ' + item.sources.join(', ') + '.');
  return ['# Ramayana box-office project status', '', '<!-- Generated from snapshot.json by scripts/refresh.mjs. -->', '',
    'Manual refresh only. Last review **' + latest.id + '** on **' + latest.checked + '**. Comparable figures through **' + latest.through + '**.', '',
    latest.summary, '', '## Next source check', '', latest.next, '', '## Expansion queue', '', ...rows, '',
    '## Resume work', '', 'Read [the runbook](RUNBOOK.md). The dated reviews, native-unit controls, source links and outstanding checks are in [snapshot.json](../snapshot.json). For access and ownership decisions, see [DECISIONS.md](DECISIONS.md).', ''].join('\n');
}
function replaceFile(path, contents) {
  const temp = path + '.' + randomUUID() + '.tmp';
  try {
    writeFileSync(temp, contents, {encoding: 'utf8', flag: 'wx'});
    renameSync(temp, path);
  } finally {
    rmSync(temp, {force: true});
  }
}
function run() {
  const args = process.argv.slice(2);
  assert.ok(args.length <= 1 && (!args.length || ['--check', '--publish'].includes(args[0])),
    'Use node scripts/refresh.mjs --check or --publish');
  validate();
  const original = read(pageFile);
  const rendered = renderPage(original);
  let oldStatus;
  try { oldStatus = read(statusFile); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const status = statusMarkdown();
  const changed = [[pageFile, original, rendered], [statusFile, oldStatus, status]].filter(([, old, next]) => old !== next);
  if (changed.length && args[0] !== '--publish') throw Error('Reviewed ledger is valid. Run --publish to update the page and handoff.');
  for (const [path,, next] of changed) replaceFile(path, next);
  console.log(latest.id + ' | checked ' + latest.checked + ' | through ' + latest.through +
    ' | ' + days.length + ' dated rows | controls match | ' + (changed.length ? 'updated ' + changed.length + ' files' : 'files current'));
}
try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
