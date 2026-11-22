# Architecture

The reader opens `ramayana-box-office-snapshot-v2.html` directly. The report includes the printed figures, accessible SVG charts, daily and cumulative tables, HTML source notes, CSS, JavaScript and the daily observations. No server, external script, account or connection is needed to read it.

## Editing map

| Location | Responsibility |
| --- | --- |
| `snapshot.json → theaterWeekends` | A Friday date and weekend gross in whole USD, with each publisher’s theater count and average gross per theater. The publisher reconciles the weekend to three daily North American rows and each average to its own count. |
| `snapshot.json → days` | One calendar row per published date in ascending order. The keys are `date`, `naUsd`, `naStatus`, `indiaCrore` and `worldCrore`. Only the two Indian-currency preview fields are null. |
| `snapshot.json → sources` | Stable source ID, URL, market and use, procedure and last actual inspection date. Each series uses the source assignment in the decisions file. A review lists the sources used for that edition. |
| `snapshot.json → reviews` | Append-only review IDs, checked date, published-through date, outcome, source IDs, independently transcribed cumulative controls, revisions, decision and next check. Several reviews can have the same cutoff. |
| `snapshot.json → opportunities` | Stable idea ID, title, priority, status, evidence sources and the next acceptance test. Update the same item as work progresses. |
| HTML outside snapshot markers | Editorial text, citations, styles, accessibility and chart interaction. The opening-period essay and comparisons refer to their named dates. |
| `scripts/refresh.mjs` | Offline Node.js publisher. Validates the ledger and regenerates the marked HTML fragments, embedded daily rows and project status. |

The browser and publisher use the same chart and table functions in the HTML. The publisher renders the default ₹94 view in advance. A reader changing the exchange rate recalculates their view in memory. Daily USD millions for Indian-currency series equal rupee crore × 10 ÷ rate. North American inputs are whole US dollars. “Other markets” subtracts India and North America from worldwide.

The latest review’s controls come from the publishers’ through-date totals. The check compares them to the sum of the daily rows in their original units. It also checks calendar continuity, source references, the preview boundary and the presence of before/after entries for edits to published rows. It cannot establish whether a source has issued newer figures. That requires the source review in the runbook.
