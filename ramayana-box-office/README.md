# Ramayana box-office snapshot

Open [the standalone snapshot](../ramayana-box-office-snapshot-v2.html) to read the report. Its **Refresh record** gives the last review date, the common market cutoff, source links and the next reporting question.

To start another review, ask **“Refresh the Ramayana box-office snapshot.”** Follow [the manual runbook](docs/RUNBOOK.md) for a new date, a correction or a check that finds no change.

| File | Use |
| --- | --- |
| [Project status](docs/PROJECT_STATUS.md) | Resume at the open source check and expansion queue. |
| [Source and data ledger](snapshot.json) | Edit native-unit daily figures, source records, dated reviews and opportunities. |
| [Architecture](docs/ARCHITECTURE.md) | Understand what is editable and how the standalone page is produced. |
| [Decisions](docs/DECISIONS.md) | Find the market definitions, preview treatment and connected-system assessment. |
| [Runbook](docs/RUNBOOK.md) | Research, reconcile, publish and verify a manual refresh. |

From the workspace root, run `node ramayana-box-office/scripts/refresh.mjs --check` to verify the saved edition offline. The reader only needs the HTML file.

## Thanksgiving figures and Friday briefing · 27 November 2026

The [three-market charts](../ramayana-box-office-snapshot-v2.html#trends) close on Thursday, 26 November. The US and Canada passed $30 million, and Sacnilk’s daily ledger and Thursday report reconcile to ₹1,775 crore worldwide. The [four-day briefing](../ramayana-box-office-snapshot-v2.html#news) includes Friday’s evening estimate and the producers’ international record announcement. The [release map](../ramayana-box-office-snapshot-v2.html#release-map) runs through 27 November. Select 26 November to inspect Thursday’s openings across Latin America and Czechia. [Weekend earnings](../ramayana-box-office-snapshot-v2.html#weekend-earnings) closes on 22 November, and [The First Two Weeks](../ramayana-box-office-snapshot-v2.html#reading-title) covers 5–18 November.

## Edition 3 · International markets

The [international panel](../ramayana-box-office-snapshot-v2.html#international) compares six weekly local-currency charts. The [directory](../ramayana-box-office-snapshot-v2.html#market-directory) includes Iceland’s opening receipts and the Brazil and Mexico watchlists. Each market links its reports and the next place to check. The [international reception section](../ramayana-box-office-snapshot-v2.html#international-reception) covers the UK, Australia, France, Vietnam and Brazil.

Edit [international.json](international.json) for the market observations, reporting windows, sources and reception. Publish and check it with the same commands as the daily ledger.
