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

## Weekend earnings and four-day briefing

When refreshing the news, set `briefing.start` and `briefing.end` in the daily ledger to four inclusive calendar dates ending on the review date. A figures-only correction may retain the separately dated briefing. Keep each news item short, date the event or attributed report, and link the source IDs. Check the source text for the reporting territory, period and gross or net basis. The weekend summary uses the last completed Friday in `theaterWeekends`. Its running totals stop on that Sunday even if a later reporting day is available. Update the editorial text beside the theater tables when estimates change.

When The Numbers rounds its provisional US/Canada cumulative to the nearest thousand, record its printed control and set `naControlRoundedTo` to `1000` for that review. Keep the component daily receipts as printed. Omit the precision field for exact-dollar controls. Record material differences from Mojo, and check whether its weekend table includes Sunday. A separately reported international weekend rank belongs in the briefing with its own source and currency.

Keep the international financial review date separate from `receptionChecked`. Update the latter only after checking the local reviews and audience samples.

## Regional reception

For a reception update, open the sources linked in the [regional sections](../../ramayana-box-office-snapshot-v2.html#reception). Record the BookMyShow score and vote count together, retain the date and scope of the PostTrak poll, and check both Rotten Tomatoes percentages and counts. Edit the visible reception date when the evidence is reviewed, then run the offline publisher and check the desktop and stacked mobile sections.

## Weekend theater comparison

When checking the North American theater comparison, use each publisher’s weekend report. Update the matching Friday in `theaterWeekends` with the Friday–Sunday gross in whole dollars, each source’s theater count, and its published average. Recheck the sentence above the tables if a count or average changes. The offline check compares the weekend total with the daily series and allows less than one dollar of difference for the reported average.

## Verification for R-002

The three-market charts and tables reconcile across 17 dates through 20 November 2026. At 1440 and 375 pixels the last daily and cumulative chart readings matched the tables, and the exchange-rate reset, market and period controls, keyboard navigation and review-record link worked. Chromium reported no console or page errors. The static edition retained its data with JavaScript disabled. At 1440, 375 and 320 pixels the theater tables fit the page, showed both publishers’ figures, kept the source links in keyboard order and remained visible in print styling.

## Verification for R-001

The 22 November 2026 edition passed the offline check for all 17 rows. In Chromium at 1440 and 375 pixels, the final daily and cumulative chart readouts matched the tables. The exchange-rate control and reset, period and market selectors, keyboard date inspection, refresh-record disclosures and fragment reload worked. The JavaScript-disabled page retained the charts, tables and review history. The browser reported no page or console errors.

On an isolated working copy, a no-change review advanced the checked date without moving coverage. Appending through 5 December preserved the original November period comparisons. A provisional daily value carried through later cumulative rows until confirmed. The publisher rejected missing dates, invalid inputs, unresolved source references, mismatched totals and an undocumented status change before writing the page.

## Refresh the international edition

1. Start from the [market directory](../../ramayana-box-office-snapshot-v2.html#market-directory). Its source links and refresh notes give both the issue used and the recurring archive where available. For Brazil, follow ANCINE’s admissions and BRL schedules. For Mexico, revisit CANACINE or a dated local distributor report.
2. In [international.json](../international.json), keep each market’s existing ID. Append observations in reporting order. Give each a measure, numeric amount, source ID, native unit and end date. Include the start for weekends and full weeks. Use a null end and a separate chart date if the source gives only a chart label. Keep release-only observations empty until a figure is available. Spell out estimates, lower bounds, rounded millions, previews and partial online-ticket coverage when applicable.
3. For the six weekly markets, update the two comparison end dates, the short reading and the notes together. Check each change against the two weekend amounts. Keep the BFI/FDA £1 discrepancy and each publisher’s coverage. Use the latest comparable cumulative gross even when it closes later than the weekend. Keep admissions in separate rows. Recheck the last primary observation, which supplies each directory summary.
4. Review reception by market. Record a rating, scale, sample size, platform and inspection date together. Identify the version seen if a critic describes a particular cut or dub. Keep each source with the specific observation or attributed reading.
5. Set the international review date after checking the evidence. Log the edition in the daily ledger’s review history with its own common daily cutoff. Run the existing publisher and offline check. Open the weekly and directory sections on desktop and mobile, test the category filter, keyboard disclosure, bookmarked market fragment, printing and JavaScript-disabled fallback. Compare the summary figures to the linked market records. Confirm that the daily exchange-rate control affects only the daily comparison.

## Verification for R-003

At 320, 375, 550, 768 and 1440 CSS pixels, Chromium displayed the six weekend rows, 32 market records and five international reception entries. The market filter, keyboard disclosures, saved selection and Nigeria deep link survived reload. Changing the daily exchange rate preserved native market values. The offline check reconciled all 17 daily rows. Desktop and mobile checks covered chart/table agreement, print styling and standalone use with JavaScript disabled.

## Verification for R-004

The offline check reconciled 19 dates through Sunday 22 November. Chromium checks at 320, 375, 768 and 1440 pixels covered the weekend amounts, five dated briefing bullets, Italy’s market fragment, saved directory filters, navigation, keyboard controls, print visibility and horizontal fit. On desktop and phone, the final daily and cumulative chart readings matched the data tables, and the exchange-rate change and reset worked. The earnings and news were readable with JavaScript disabled. The browser reported no console or page errors. The opening fortnight uses the 14 rows dated 5–18 November. Check that the worldwide and India figures agree with the day-14 source, and that the US/Canada subtotal excludes the separately allocated previews.
