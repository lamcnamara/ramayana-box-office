# Ramayana: Part 1 (2026) — Box-office snapshot

[Open the interactive dashboard](https://lamcnamara.github.io/ramayana-box-office/ramayana-box-office-snapshot-v2.html) · [Download the standalone HTML](https://raw.githubusercontent.com/lamcnamara/ramayana-box-office/main/ramayana-box-office-snapshot-v2.html)

The 27 November 2026 edition covers the [three daily box-office series](ramayana-box-office-snapshot-v2.html#trends) through **Thursday, 26 November**. The Numbers reports $30,086,625 in the US and Canada through Thanksgiving. Sacnilk estimates ₹1,185 crore gross in India and ₹1,775 crore worldwide. The [weekend panel](ramayana-box-office-snapshot-v2.html#weekend-earnings) closes on Sunday, 22 November. [The First Two Weeks](ramayana-box-office-snapshot-v2.html#reading-title) covers 5–18 November from the worldwide theatrical release.

The [24–27 November briefing](ramayana-box-office-snapshot-v2.html#news) includes Friday’s provisional ₹1,000.55 crore India net, the holiday receipts in North America and the producers’ international record announcement. The [release map](ramayana-box-office-snapshot-v2.html#release-map) shows 13 openings on 26 November, Iceland’s first reported weekend and a future Taiwan booking. The [international directory](ramayana-box-office-snapshot-v2.html#international) includes the Dutch chart through Wednesday, the French admissions report and dated local or US-dollar observations for the latest completed weekend. Each market carries its own reporting date.

## Reading the figures

- **North America** covers the US and Canada. The daily series uses whole US dollars from The Numbers, cross-checked against Box Office Mojo. Opening-night previews are allocated once.
- **India and worldwide** use Sacnilk’s gross estimates in rupee crore. Worldwide includes India and overseas revenue. The default conversion is ₹94 per US dollar. Changing the rate updates the charts and tables together.
- **Reception** has its own review date. Ticket-platform votes, opening-weekend exit polling, and published criticism each describe a different group of people. The dashboard links the sources next to the findings.

## Open it offline

Select **Release map** for the November 4–27 replay. The US and Canada share one daily bar, including the November 4 preview. India, Australia, Germany, Malaysia, New Zealand, Singapore and the UK also have daily series. Other reporting markets update from dated totals. Where a publisher gives both a period gross and its cumulative closing balance, subtraction establishes the balance immediately before that period. Market details link the evidence and identify estimates or reconstructions.

The map labels the largest available grosses on each date. Select a territory or zoom to inspect a smaller market. **Market grosses** ranks all available reports, shows each reporting date and displays daily receipts when established. The **US$ / ₹ crore** switch uses the dashboard’s exchange rate.

Download `ramayana-box-office-snapshot-v2.html` and open it in a browser. The data, styles, and scripts are embedded. Use the chart controls to select a market or period. With the chart focused, use the arrow keys to inspect dates, or open **Daily data** for the tables.

## Verify or refresh an edition

The [international ledger](ramayana-box-office/international.json) records local figures, issue dates, units, preview notes, watchlists and reception sources. The editable [daily source ledger](ramayana-box-office/snapshot.json) records daily observations, publisher URLs, estimates, and dated revisions. From the repository root, verify the saved edition with Node.js 18 or later:

```sh
node ramayana-box-office/scripts/refresh.mjs --check
```

For a data update, review the evidence first, follow the manual runbook, and commit the ledger, regenerated HTML, and project status together. The publisher works offline. [Manual runbook](ramayana-box-office/docs/RUNBOOK.md) · [Reporting decisions](ramayana-box-office/docs/DECISIONS.md) · [Project status](ramayana-box-office/docs/PROJECT_STATUS.md)

## Attribution and corrections

Lauren McNamara maintains this independent dashboard. The source register identifies the publishers behind the figures, and the reception sections link each review and audience measure. To report a correction, include the market, reporting date, figure or passage, and a link to the original evidence. [Open an issue](https://github.com/lamcnamara/ramayana-box-office/issues)
