import type { DiffItemRef, SnapshotDiff } from "@/lib/cv/snapshots";
import { snapshotStrings } from "@/lib/i18n/snapshots";
import { escapeHtml, escapeMarkdown, safeHref } from "./escape";

/**
 * Renderers for a {@link SnapshotDiff} — the "what changed since this frozen
 * version" report. Two outputs from the same structured diff (HTML page and
 * Markdown), neutral wording throughout: a change is listed, never judged
 * ("added" / "removed" / "hidden", no "improved" / "lost"). Pure; no IO.
 *
 * The HTML is a self-contained document (inline styles only, no scripts) so it
 * can be served under the public page's strict `default-src 'none'` CSP.
 */

/** Context about the two sides being compared (the frozen snapshot vs live). */
export interface DiffRenderContext {
  /** The frozen snapshot's version number. */
  version: number;
  /** ISO timestamp the snapshot was frozen at. */
  frozenAt: string;
  ownerName: string;
  /** Href of the frozen-version page (a "back" link). Optional. */
  frozenHref?: string;
  /** Href of the live page. Optional. */
  liveHref?: string;
}

/** Locale-formatted calendar date for an ISO timestamp (date part only). */
export function formatSnapshotDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(d);
  } catch {
    /* v8 ignore next 2 -- Intl rejects only malformed locale tags; ours are validated */
    return d.toISOString().slice(0, 10);
  }
}

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), template);
}

function refText(r: DiffItemRef): string {
  const label = r.label || r.id;
  return r.year === undefined ? label : `${label} (${r.year})`;
}

function metricText(from: number | null, to: number | null): string {
  const f = from === null ? "—" : String(from);
  const t = to === null ? "—" : String(to);
  return `${f} → ${t}`;
}

const DIFF_CSS =
  "body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:46rem;margin:3rem auto 4rem;padding:0 1.25rem;color:#1f2430;line-height:1.55}" +
  "h1{font-size:1.5rem;margin:0 0 .35rem}h2{font-size:1.05rem;margin:1.75rem 0 .5rem}h3{font-size:.95rem;margin:1rem 0 .25rem;color:#3d4451}" +
  "p{margin:0 0 .75rem}.meta{color:#5d646f}ul{margin:0 0 .5rem 1.2rem;padding:0}li{margin:.15rem 0}" +
  ".brand{font-size:.8rem;letter-spacing:.05em;text-transform:uppercase;color:#6b7280;margin:0 0 1.5rem}" +
  "a{color:#1f4fd8;text-decoration:underline;text-underline-offset:.15em}" +
  ".keys{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em}" +
  "nav{display:flex;gap:1rem;margin:.5rem 0 1.5rem;font-size:.95rem}";

function htmlList(refs: DiffItemRef[]): string {
  return `<ul>${refs.map((r) => `<li>${escapeHtml(refText(r))}</li>`).join("")}</ul>`;
}

/** The diff as a self-contained HTML page (no scripts; inline CSS only). */
export function renderDiffHtml(diff: SnapshotDiff, locale: string, ctx: DiffRenderContext): string {
  const s = snapshotStrings(locale);
  const date = formatSnapshotDate(ctx.frozenAt, locale);
  const title = fill(s.diffTitle, { n: ctx.version });
  const parts: string[] = [];

  parts.push(`<p class="brand">SigmaCV</p>`);
  parts.push(`<h1>${escapeHtml(ctx.ownerName)} — ${escapeHtml(title)}</h1>`);
  parts.push(`<p class="meta">${escapeHtml(fill(s.diffIntro, { n: ctx.version, date }))}</p>`);
  const nav: string[] = [];
  if (ctx.frozenHref) {
    nav.push(
      `<a href="${escapeHtml(safeHref(ctx.frozenHref))}">${escapeHtml(s.diffFrozenLink)}</a>`,
    );
  }
  if (ctx.liveHref) {
    nav.push(`<a href="${escapeHtml(safeHref(ctx.liveHref))}">${escapeHtml(s.bannerLive)}</a>`);
  }
  if (nav.length) parts.push(`<nav>${nav.join("")}</nav>`);

  if (!diff.hasChanges) {
    parts.push(`<p>${escapeHtml(s.diffNoChanges)}</p>`);
  }

  for (const sec of diff.sections) {
    parts.push(`<h2>${escapeHtml(sec.title)}</h2>`);
    const groups: Array<[string, DiffItemRef[]]> = [
      [s.diffAdded, sec.added],
      [s.diffRemoved, sec.removed],
      [s.diffHidden, sec.hidden],
      [s.diffUnhidden, sec.unhidden],
    ];
    for (const [heading, refs] of groups) {
      if (refs.length) parts.push(`<h3>${escapeHtml(heading)}</h3>${htmlList(refs)}`);
    }
  }

  if (diff.sectionsAdded.length) {
    parts.push(
      `<h2>${escapeHtml(s.diffSectionsAdded)}</h2><ul>${diff.sectionsAdded
        .map((x) => `<li>${escapeHtml(x.title)}</li>`)
        .join("")}</ul>`,
    );
  }
  if (diff.sectionsRemoved.length) {
    parts.push(
      `<h2>${escapeHtml(s.diffSectionsRemoved)}</h2><ul>${diff.sectionsRemoved
        .map((x) => `<li>${escapeHtml(x.title)}</li>`)
        .join("")}</ul>`,
    );
  }
  if (diff.narrativeChanged.length) {
    parts.push(
      `<h2>${escapeHtml(s.diffNarrative)}</h2><ul>${diff.narrativeChanged
        .map(
          (n) =>
            `<li>${escapeHtml(n.title)}: ${escapeHtml(
              fill(s.diffWords, { before: n.wordsBefore, after: n.wordsAfter }),
            )}</li>`,
        )
        .join("")}</ul>`,
    );
  }
  if (diff.metricsChanged.length) {
    parts.push(
      `<h2>${escapeHtml(s.diffMetrics)}</h2><ul>${diff.metricsChanged
        .map(
          (m) =>
            `<li><span class="keys">${escapeHtml(m.key)}</span>: ${escapeHtml(metricText(m.from, m.to))}</li>`,
        )
        .join("")}</ul>`,
    );
  }
  if (diff.ownerChanged.length) {
    parts.push(
      `<h2>${escapeHtml(s.diffOwner)}</h2><p class="keys">${diff.ownerChanged.map(escapeHtml).join(", ")}</p>`,
    );
  }
  if (diff.displayChanged.length) {
    parts.push(
      `<h2>${escapeHtml(s.diffDisplay)}</h2><p class="keys">${diff.displayChanged.map(escapeHtml).join(", ")}</p>`,
    );
  }

  const lang = escapeHtml(locale.split("-")[0] ?? "en");
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(
    ctx.ownerName,
  )} — ${escapeHtml(title)}</title><style>${DIFF_CSS}</style></head><body>${parts.join("\n")}</body></html>`;
}

function mdList(refs: DiffItemRef[]): string {
  return refs.map((r) => `- ${escapeMarkdown(refText(r))}`).join("\n");
}

/** The diff as Markdown (same content + order as the HTML). */
export function renderDiffMarkdown(
  diff: SnapshotDiff,
  locale: string,
  ctx: DiffRenderContext,
): string {
  const s = snapshotStrings(locale);
  const date = formatSnapshotDate(ctx.frozenAt, locale);
  const out: string[] = [];
  out.push(
    `# ${escapeMarkdown(ctx.ownerName)} — ${escapeMarkdown(fill(s.diffTitle, { n: ctx.version }))}`,
  );
  out.push("");
  out.push(escapeMarkdown(fill(s.diffIntro, { n: ctx.version, date })));
  if (ctx.frozenHref || ctx.liveHref) {
    const links: string[] = [];
    if (ctx.frozenHref)
      links.push(`[${escapeMarkdown(s.diffFrozenLink)}](${safeHref(ctx.frozenHref)})`);
    if (ctx.liveHref) links.push(`[${escapeMarkdown(s.bannerLive)}](${safeHref(ctx.liveHref)})`);
    out.push("");
    out.push(links.join(" · "));
  }
  out.push("");

  if (!diff.hasChanges) out.push(escapeMarkdown(s.diffNoChanges));

  for (const sec of diff.sections) {
    out.push(`## ${escapeMarkdown(sec.title)}`);
    out.push("");
    const groups: Array<[string, DiffItemRef[]]> = [
      [s.diffAdded, sec.added],
      [s.diffRemoved, sec.removed],
      [s.diffHidden, sec.hidden],
      [s.diffUnhidden, sec.unhidden],
    ];
    for (const [heading, refs] of groups) {
      if (!refs.length) continue;
      out.push(`### ${escapeMarkdown(heading)}`);
      out.push("");
      out.push(mdList(refs));
      out.push("");
    }
  }
  if (diff.sectionsAdded.length) {
    out.push(`## ${escapeMarkdown(s.diffSectionsAdded)}`, "");
    out.push(diff.sectionsAdded.map((x) => `- ${escapeMarkdown(x.title)}`).join("\n"), "");
  }
  if (diff.sectionsRemoved.length) {
    out.push(`## ${escapeMarkdown(s.diffSectionsRemoved)}`, "");
    out.push(diff.sectionsRemoved.map((x) => `- ${escapeMarkdown(x.title)}`).join("\n"), "");
  }
  if (diff.narrativeChanged.length) {
    out.push(`## ${escapeMarkdown(s.diffNarrative)}`, "");
    out.push(
      diff.narrativeChanged
        .map(
          (n) =>
            `- ${escapeMarkdown(n.title)}: ${escapeMarkdown(
              fill(s.diffWords, { before: n.wordsBefore, after: n.wordsAfter }),
            )}`,
        )
        .join("\n"),
      "",
    );
  }
  if (diff.metricsChanged.length) {
    out.push(`## ${escapeMarkdown(s.diffMetrics)}`, "");
    out.push(
      diff.metricsChanged
        .map((m) => `- \`${m.key}\`: ${escapeMarkdown(metricText(m.from, m.to))}`)
        .join("\n"),
      "",
    );
  }
  if (diff.ownerChanged.length) {
    out.push(`## ${escapeMarkdown(s.diffOwner)}`, "");
    out.push(diff.ownerChanged.map((k) => `\`${k}\``).join(", "), "");
  }
  if (diff.displayChanged.length) {
    out.push(`## ${escapeMarkdown(s.diffDisplay)}`, "");
    out.push(diff.displayChanged.map((k) => `\`${k}\``).join(", "), "");
  }
  return `${out.join("\n").trimEnd()}\n`;
}
