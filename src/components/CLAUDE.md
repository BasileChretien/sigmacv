# components

React **client** components. The CV editor is fully client-side and talks to the server only through `app/api/cv/*` (load/save/preview/sync) — it never imports server-only `lib/` modules directly.

## The editor

- **`CvWorkspace.tsx`** — top-level orchestrator: holds the working `CanonicalCv`, the export-format dropdown, and the mobile Editor/Preview tab toggle.
- **`CvEditor.tsx`** + **`ItemRow.tsx`** — curation UI: "not mine" toggle, drag-and-drop reorder, section show/hide/rename, add-section menu. All edits go through the pure `lib/canonical/curate` ops (immutable).
- **`ProfilePanel.tsx`** — editable header/profile fields; **`CvPreview.tsx`** — debounced live HTML preview via `api/cv/preview`.
- **`PublishControls`**, **`AccountControls`**, **`DisambiguationCoachmark`**, **`LanguageSwitcher`** — publish/account/onboarding/locale.
- **`ResearchParticipationPanel`** — the one place to take part in, or stop taking part in, research study 2026-0310. It opens only when the person opens it (the account menu item, the editor's foot link), never by itself, and neither entry exists while `RESEARCH_LOGGING_ENABLED` is off. Its consent text comes from `lib/research/consent` (approved languages only); its own text from `lib/i18n/researchPanel.ts`. **`InformationSheet`** renders the approved sheet for the panel and for the printable `/cv/research-sheet`.

Static content components (`Landing`, `About`, `Privacy`, `Faq`, `Accessibility`) and JSON-LD emitters (`StructuredData`, `DocJsonLd`, `SiteLinks`) are presentational. All user-facing strings come from `lib/i18n` — don't hard-code copy.
