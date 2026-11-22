# Ramayana: Part 1 (2026) — Box-office snapshot

[Open the interactive dashboard](https://lamcnamara.github.io/ramayana-box-office/ramayana-box-office-snapshot-v2.html) · [Download the standalone HTML](https://raw.githubusercontent.com/lamcnamara/ramayana-box-office/main/ramayana-box-office-snapshot-v2.html)

Edition 3 adds a [weekly international comparison](https://lamcnamara.github.io/ramayana-box-office/ramayana-box-office-snapshot-v2.html#international), a source-linked directory of 32 markets outside India and US/Canada, and [regional reception](https://lamcnamara.github.io/ramayana-box-office/ramayana-box-office-snapshot-v2.html#reception). The six recurring charts follow the UK and Ireland, Australia, New Zealand, the Netherlands, Portugal and Nigeria. Brazil and Mexico have release records awaiting a local gross.

The international review is dated **22 November 2026**. Each market shows its own reporting window. The daily India, US/Canada and worldwide series spans **4–20 November 2026**, including North American previews. The refresh record identifies provisional figures and the next source check.

## Reading the figures

- **North America** covers the US and Canada. The daily series uses whole US dollars from The Numbers, cross-checked against Box Office Mojo. Opening-night previews are allocated once.
- **India and worldwide** use Sacnilk’s gross estimates in rupee crore. Worldwide includes India and overseas revenue. The default conversion is ₹94 per US dollar. Changing the rate updates the charts and tables together.
- **Reception** has its own review date. Ticket-platform votes, opening-weekend exit polling, and published criticism each describe a different group of people. The dashboard links the sources next to the findings.

## Open it offline

Download `ramayana-box-office-snapshot-v2.html` and open it in a browser. The data, styles, and scripts are embedded. Use the chart controls to select a market or period. With the chart focused, use the arrow keys to inspect dates, or open **Daily data** for the tables.

## Verify or refresh an edition

The [international ledger](ramayana-box-office/international.json) records local figures, issue dates, units, preview notes, watchlists and reception sources. The editable [daily source ledger](ramayana-box-office/snapshot.json) records daily observations, publisher URLs, estimates, and dated revisions. From the repository root, verify the saved edition with Node.js 18 or later:

```sh
node ramayana-box-office/scripts/refresh.mjs --check
```

For a data update, review the evidence first, follow the manual runbook, and commit the ledger, regenerated HTML, and project status together. The publisher works offline. [Manual runbook](ramayana-box-office/docs/RUNBOOK.md) · [Reporting decisions](ramayana-box-office/docs/DECISIONS.md) · [Project status](ramayana-box-office/docs/PROJECT_STATUS.md)

## Attribution and corrections

Lauren McNamara maintains this independent dashboard. The source register identifies the publishers behind the figures, and the reception sections link each review and audience measure. To report a correction, include the market, reporting date, figure or passage, and a link to the original evidence. [Open an issue](https://github.com/lamcnamara/ramayana-box-office/issues)
