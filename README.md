# Labor Payment Modular Build

This folder is a modularized copy of the original single-file `index.html`.

The browser-global function style is intentionally preserved so the existing
inline `onclick` handlers keep working. The refactor separates the code by
responsibility without changing the app behavior.

## Structure

- `index.html`: App markup and external stylesheet/script references.
- `assets/app.css`: Main app CSS moved out of the original inline `<style>`.
- `js/state.js`: Initial state, demo data, and shared state variables.
- `js/utils.js`: Age, alert, formatter, and input helper utilities.
- `js/storage.js`: App initialization and localStorage persistence.
- `js/github-sync.js`: GitHub Personal Access Token based data save/load.
- `js/layout.js`: Zoom, density, dropdown, and project selection UI.
- `js/render.js`: Main table rendering and detail modal entry.
- `js/labor-detail.js`: Worker detail editing, duplication, and related helpers.
- `js/exports.js`: Excel-copy, CSV export, reset, and early data actions.
- `js/attendance.js`: Attendance editing, drag range input, summaries, and stats.
- `js/print-table.js`: Print-table rendering and total rows.
- `js/documents.js`: Contract, receipt, safety document printing.
- `js/labor-actions.js`: Worker add/delete, bulk attendance, bulk import, and pricing.
- `js/calculations.js`: Wage, tax, and insurance deduction calculation.
- `js/projects.js`: Project edit modal behavior.
- `js/roster-photos.js`: Roster form printing and attached photo handling.
- `js/project-create.js`: New project creation.
- `js/xls-backup-insurance.js`: XLS export, JSON backup/restore, insurance report.
- `js/carry-over.js`: Worker carry-over between projects.
- `js/ai-scan.js`: Gemini document/image scan workflow.

## Verification

- All 18 JavaScript files pass `node --check`.
- The original app script exposes 122 named functions; the modularized scripts
  expose the same 122 named functions.

## GitHub Save/Load

Use the `GitHub` button in the top toolbar.

Required settings:

- `Owner`: GitHub account or organization name.
- `Repository`: Repository name.
- `Branch`: Usually `main`.
- `Data Path`: Default is `data/labor-payment-data.json`.
- `Personal Access Token`: A GitHub token with permission to read/write contents
  in the target repository.

The token is only saved in this browser when `이 브라우저에 토큰 저장` is checked.
For safer use, create a fine-grained token scoped only to the target repository
with Contents read/write permission.
