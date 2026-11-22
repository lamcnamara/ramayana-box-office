# Manual refresh

**Trigger:** “Refresh the Ramayana box-office snapshot.” The source review is manual. The local command publishes reviewed inputs and works offline. Running a check never changes the checked date.

1. **Resume.** Read [project status](PROJECT_STATUS.md) and the last entry in `../snapshot.json`. Open the source links listed there or in the HTML’s **Refresh record**. Start with unresolved estimates and the day after the cutoff. Recheck earlier rows for revisions.
2. **Collect.** Read The Numbers’ domestic daily gross **and** cumulative total in USD. Cross-check the same release and date on Box Office Mojo. Read Sacnilk’s day-wise India gross and worldwide gross in ₹ crore and open the dated day report for its cumulative totals. Record the exact URL of a new day report as a source. Check the page itself when a search snippet differs. A second outlet repeating a tracker is evidence of the same underlying report.
3. **Decide the cutoff.** Use the latest consecutive date with full-day coverage across the series. Hold partial territory reads and net-only figures outside the chart. If a source is unavailable or the totals disagree, record the evidence, last usable cutoff and what would resolve the hold. Reconcile dates in each market’s local reporting convention.
4. **Edit the ledger.** Append complete calendar rows in `days`, or correct an existing row in place. Use whole USD for `naUsd`, rupee crore for `indiaCrore` and `worldCrore`, and `actual` or `estimate` for new North American rows. The first two preview-allocation statuses are reserved. Update `sources[].checked` only for pages actually inspected.
5. **Log the outcome.** Append the next unused `R-…` ID to `reviews`. Copy the shape of the last entry. Enter the inspection date, coverage cutoff, source IDs, and the three native-unit cumulative totals read from the publishers. Use `Updated`, `Revised`, `No change` or `Held` as appropriate. Record each modification to a published row with `date`, `field`, `before` and `after`, including status promotions. For no changes or new dates alone, use an empty revisions array. Keep earlier reviews intact. If a publisher is unavailable, identify which retained controls came from the prior review. Include the next check even when coverage stays fixed.
6. **Triage expansion.** Update an existing `EXP-…` item by ID or give a distinct idea the next unused ID. Record a source, priority, status and a test that would make the idea publishable. On implementation, record its completion and evidence. When changing an editorial claim, review the dated prose, sources and benchmark comparisons in the HTML.
7. **Publish.** From the workspace root, run the two commands below. Use Node.js 18 or newer. If validation fails, correct the identified row, control or reference, then retry. If a write is interrupted, rerun the same publication and check. Keep the page and companion folder together for future editions.

```powershell
node ramayana-box-office/scripts/refresh.mjs --publish
node ramayana-box-office/scripts/refresh.mjs --check
```

8. **Verify the edition.** Open the HTML at desktop and phone widths. Compare the headline and the last cumulative table row to the same date’s chart readout at the default rate. Then compare the last daily chart values with the daily table. Test a different FX rate and reset it. Exercise the market, period and chart controls with mouse and keyboard, check the browser console, and reload the refresh-record fragment. Open print preview or disable JavaScript to verify the static edition. Check date transitions, provisional marks, and the sources and opportunities disclosures.
9. **Hand off.** Report the review ID, dates, material revisions, validation outcome and next unresolved check. The check verifies the published HTML and generated status file. External record updates apply only to destinations already authorized for this project.

**No-change example.** If the newest overseas day is published but the US/Canada daily table still ends a day earlier, log a new review with the prior common cutoff, retained or reconfirmed controls and the partial day in `next`. Leave the partial amounts out of `days`. The new review date and unchanged coverage will appear together in the page.

## Regional reception

For a reception update, open the sources linked in the [regional sections](../../ramayana-box-office-snapshot-v2.html#reception). Record the BookMyShow score and vote count together, retain the date and scope of the PostTrak poll, and check both Rotten Tomatoes percentages and counts. Edit the visible reception date when the evidence is reviewed, then run the offline publisher and check the desktop and stacked mobile sections.

## Weekend theater comparison

When checking the North American theater comparison, use each publisher’s weekend report. Update the matching Friday in `theaterWeekends` with the Friday–Sunday gross in whole dollars, each source’s theater count, and its published average. Recheck the sentence above the tables if a count or average changes. The offline check compares the weekend total with the daily series and allows less than one dollar of difference for the reported average.

## Verification for R-002

The three-market charts and tables reconcile across 17 dates through 20 November 2026. At 1440 and 375 pixels the last daily and cumulative chart readings matched the tables, and the exchange-rate reset, market and period controls, keyboard navigation and review-record link worked. Chromium reported no console or page errors. The static edition retained its data with JavaScript disabled. At 1440, 375 and 320 pixels the theater tables fit the page, showed both publishers’ figures, kept the source links in keyboard order and remained visible in print styling.

## Verification for R-001

The 22 November 2026 edition passed the offline check for all 17 rows. In Chromium at 1440 and 375 pixels, the final daily and cumulative chart readouts matched the tables. The exchange-rate control and reset, period and market selectors, keyboard date inspection, refresh-record disclosures and fragment reload worked. The JavaScript-disabled page retained the charts, tables and review history. The browser reported no page or console errors.

On an isolated working copy, a no-change review advanced the checked date without moving coverage. Appending through 5 December preserved the original November period comparisons. A provisional daily value carried through later cumulative rows until confirmed. The publisher rejected missing dates, invalid inputs, unresolved source references, mismatched totals and an undocumented status change before writing the page.
