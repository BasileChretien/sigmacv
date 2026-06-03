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
 */
function rirekishoCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 760px; }
  .rk-title { text-align: center; font-size: 1.4rem; letter-spacing: 0.5em; margin: 0 0 1rem; }
  table.rk { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  table.rk th, table.rk td { border: 1px solid #333; padding: 0.4rem 0.6rem; vertical-align: top; font-size: 0.9rem; }
  table.rk .rk-label { background: #f3f3f3; white-space: nowrap; width: 7rem; font-weight: 600; }
  table.rk .rk-furigana { font-size: 0.72rem; color: #555; }
  table.rk .rk-name { font-size: 1.25rem; font-weight: 700; }
  td.rk-photo { width: 120px; text-align: center; vertical-align: middle; color: #999; font-size: 0.8rem; }
  td.rk-photo .cv-photo { width: 100px; height: 130px; border-radius: 0; object-fit: cover; }
  table.rk-history td.rk-year { width: 5rem; text-align: center; white-space: nowrap; }
  table.rk-history td.rk-center { text-align: center; font-weight: 600; background: #fafafa; }
  section.cv-section > h2 { font-size: 1rem; border-bottom: 1px solid #333; padding-bottom: 0.2rem; }`;
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
