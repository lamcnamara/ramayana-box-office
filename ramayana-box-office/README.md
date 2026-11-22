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

## Edition 3 · International markets

The [international panel](../ramayana-box-office-snapshot-v2.html#international) compares six weekly local-currency charts. The [directory](../ramayana-box-office-snapshot-v2.html#market-directory) covers 32 markets outside India and US/Canada, including the Brazil and Mexico watchlists. Each market links its reports and the next place to check. The [international reception section](../ramayana-box-office-snapshot-v2.html#international-reception) covers the UK, Australia, France, Vietnam and Brazil.

Edit [international.json](international.json) for the market observations, reporting windows, sources and reception. Publish and check it with the same commands as the daily ledger.
