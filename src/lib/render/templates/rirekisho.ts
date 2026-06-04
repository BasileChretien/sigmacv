import type { CanonicalCv } from "@/lib/canonical/schema";
import { commonCss, escapeHtml, pageShell, photoHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, RenderedSection, TemplateTheme } from "./types";

/**
 * "Rirekisho" (履歴書) — the standard Japanese formal CV form.
 *
 * Renders the bordered personal-details header (furigana, name, date of birth,
 * gender, nationality, address, contact + a 写真 photo box) and a chronological
 * 学歴・職歴 (education / work history) table built from the Education + Positions
 * sections. Any remaining sections (publications, grants, …) follow below using
 * their localized headings, so the document is still a complete academic CV.
 *
 * Labels are intentionally Japanese — this is a Japanese form. Personal fields
 * come from owner.personal (user-entered, optional). The page lang is "ja".
 *
 * This template's whole identity IS the bordered form: it is the only grid/form
 * archetype and the only intrinsically-monochrome one. The user accent is kept
 * OUT of the grid (hairline borders stay #2b2b2b ink) — polish is deliberately
 * invisible: a single consistent hairline rule weight, gentle label/photo tints,
 * a flattened bibliography below, and bold underlined section headings.
 */
function rirekishoCss(_theme: TemplateTheme): string {
  return `
  body { font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Noto Sans CJK JP", sans-serif; }
  .cv { max-width: 760px; padding: 38px 42px; }

  /* Centered title with the wide tracking that reads as a formal form heading.
     The right pad cancels the trailing letter-spacing so the glyphs stay
     optically centered. */
  .rk-title { text-align: center; font-size: 1.5rem; letter-spacing: 0.6em; font-weight: 700; color: var(--cv-ink); margin: 0 0 1.25rem; padding-left: 0.6em; }

  /* One consistent hairline across BOTH the personal table and the history grid:
     a single rule weight (1px / #2b2b2b) and a single padding rhythm make the
     whole form read as one engraved sheet rather than two stacked tables. */
  table.rk { width: 100%; border-collapse: collapse; margin-bottom: 1.1rem; }
  table.rk th, table.rk td { border: 1px solid #2b2b2b; padding: 0.48rem 0.68rem; vertical-align: top; font-size: 0.88rem; line-height: 1.5; }
  table.rk th { font-weight: 600; background: #f1f2f4; color: var(--cv-ink); text-align: left; }

  /* Soft neutral label column — quieter than the old tint, never themed. */
  table.rk .rk-label { background: #f1f2f4; white-space: nowrap; width: 7rem; font-weight: 600; color: var(--cv-ink); }
  table.rk .rk-furigana { font-size: 0.72rem; color: var(--cv-muted); letter-spacing: 0.08em; }
  table.rk .rk-name { font-size: 1.3rem; font-weight: 700; letter-spacing: 0.04em; color: var(--cv-ink); }

  /* Portrait 写真 box on a faint ground, squared corners (official-form look). */
  td.rk-photo { width: 122px; text-align: center; vertical-align: middle; color: var(--cv-faint); font-size: 0.78rem; letter-spacing: 0.3em; background: #fafbfc; }
  td.rk-photo .cv-photo { width: 100px; height: 130px; border-radius: 0; object-fit: cover; }

  /* 学歴・職歴 grid: narrow centered year column, and a centered, tracked,
     faintly-tinted band that introduces each history block (学歴 / 職歴). */
  table.rk-history td.rk-year, table.rk-history th.rk-year { width: 5rem; text-align: center; white-space: nowrap; }
  table.rk-history td.rk-center { text-align: center; font-weight: 600; background: #fafbfc; letter-spacing: 0.2em; }

  /* Below the grid the academic sections flatten the hanging bibliography into a
     plain flush-left list, and headings become bold + underlined to echo the
     form's ruled aesthetic without borrowing the accent colour. */
  section.cv-section ol.cv-bib > li { padding-left: 0; text-indent: 0; }
  section.cv-section > h2 { font-size: 1rem; font-weight: 700; color: var(--cv-ink); border-bottom: 1.5px solid #2b2b2b; padding-bottom: 0.22rem; letter-spacing: 0.08em; }

  @media print {
    /* Keep the faint form tints (label column, 写真 ground, history band) in the
       exported PDF — they are structural, not decorative. */
    td.rk-photo, table.rk th, table.rk .rk-label, table.rk-history td.rk-center {
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
  }`;
}

function cell(value: string | undefined): string {
  return value ? escapeHtml(value) : "";
}

function headerTable(cv: CanonicalCv): string {
  const o = cv.owner;
  const p = o.personal ?? {};
  const c = o.contact ?? {};
  const photo = o.photo ? photoHtml(cv) : "写真";
  const contactBits = [c.email, c.phone].filter(Boolean).map((s) => escapeHtml(String(s))).join(" ／ ");
  return `<table class="rk">
  <tr>
    <td class="rk-label">ふりがな</td>
    <td class="rk-furigana">${cell(p.phoneticName)}</td>
    <td class="rk-photo" rowspan="4">${photo}</td>
  </tr>
  <tr>
    <td class="rk-label">氏名</td>
    <td class="rk-name">${cell(o.displayName)}</td>
  </tr>
  <tr>
    <td class="rk-label">生年月日</td>
    <td>${cell(p.dateOfBirth)}${p.gender ? `　（性別: ${escapeHtml(p.gender)}）` : ""}</td>
  </tr>
  <tr>
    <td class="rk-label">国籍</td>
    <td>${cell(p.nationality)}</td>
  </tr>
  <tr>
    <td class="rk-label">現住所</td>
    <td colspan="2">${cell(p.address)}</td>
  </tr>
  <tr>
    <td class="rk-label">連絡先</td>
    <td colspan="2">${contactBits}</td>
  </tr>
</table>`;
}

/** 学歴・職歴 table from the Education + Positions sections (year | description). */
function historyTable(sections: RenderedSection[]): string {
  const find = (type: string) => sections.find((s) => s.section.type === type);
  const edu = find("education");
  const pos = find("positions");
  if (!edu && !pos) return "";

  const rows: string[] = [];
  const block = (heading: string, rs: RenderedSection | undefined) => {
    if (!rs || rs.items.length === 0) return;
    rows.push(`<tr><td class="rk-year"></td><td class="rk-center">${heading}</td></tr>`);
    for (const ri of rs.items) {
      const year = ri.item.meta.year ? String(ri.item.meta.year) : "";
      rows.push(
        `<tr><td class="rk-year">${escapeHtml(year)}</td><td>${escapeHtml(ri.item.displayText ?? "")}</td></tr>`,
      );
    }
  };
  block("学歴", edu);
  block("職歴", pos);

  return `<table class="rk rk-history">
  <tr><th class="rk-year">年</th><th>学歴・職歴</th></tr>
  ${rows.join("\n  ")}
</table>`;
}

export const rirekishoTemplate: CvTemplate = {
  key: "rirekisho",
  render(cv, sections, theme) {
    const css = commonCss(theme) + rirekishoCss(theme);
    // Education + positions go into the 学歴・職歴 table; everything else below.
    const rest = sections.filter(
      (s) => s.section.type !== "education" && s.section.type !== "positions",
    );
    const body = `<div class="cv">
  <h1 class="rk-title">履歴書</h1>
  ${headerTable(cv)}
  ${historyTable(sections)}
  ${sectionsHtml(rest)}
  ${provenanceFooter(cv)}
</div>`;
    return pageShell(`${cv.owner.displayName || "履歴書"} — 履歴書`, css, body, "ja");
  },
};
