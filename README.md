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
