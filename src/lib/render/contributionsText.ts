import type { CanonicalCv } from "@/lib/canonical/schema";
import { proseStarterStrings, type ProseStarterStrings } from "@/lib/i18n/proseStarter";
import { wrapSelf } from "./emphasize";
import { escapeMarkdown, escapeMarkdownEntry, markdownHref, safeHref } from "./escape";
import type { PreparedContribution } from "./prepare";

/**
 * The structured contributions of a contributions section in the TEXT formats
 * (Markdown, LaTeX). Every format derives from the same prepared list
 * (`prepare.ts` `PreparedContribution`): the title, the period and audience, the
 * role, the impact, where the work is cited, and the linked entry's reference as
 * the citation style prints it. Labels are the CV's language (the same words the
 * starter drafts use). Empty fields are simply not printed.
 */

/** "2020 · Audience : A (academic community), B (practice community)" — whatever is set. */
export function contributionMeta(p: PreparedContribution, s: ProseStarterStrings): string {
  const names = { A: s.audienceA, B: s.audienceB, C: s.audienceC } as const;
  const audience = (p.contribution.audience ?? []).map((a) => `${a} (${names[a]})`).join(", ");
  return [p.contribution.period?.trim(), audience ? `${s.audience} : ${audience}` : ""]
    .filter(Boolean)
    .join(" · ");
}

/** Markdown: a numbered list, one item per contribution, its facts as a nested list. */
export function contributionsMarkdown(
  cv: CanonicalCv,
  list: readonly PreparedContribution[],
): string {
  const s = proseStarterStrings(cv.display.locale);
  return list
    .map((p) => {
      const meta = contributionMeta(p, s);
      const lines = [
        `${p.n}. **${escapeMarkdown(p.title)}**${meta ? ` (${escapeMarkdown(meta)})` : ""}`,
      ];
      const fact = (label: string, text: string | undefined) => {
        const value = text?.trim();
        if (value)
          lines.push(
            `   - **${escapeMarkdown(label)} :** ${escapeMarkdown(value).replace(/\n+/g, " ")}`,
          );
      };
      fact(s.role, p.contribution.role);
      fact(s.impact, p.contribution.impact);
      const cited = (p.contribution.citedIn ?? []).filter((c) => c.text.trim());
      if (cited.length > 0) {
        lines.push(`   - **${escapeMarkdown(s.citedIn)} :**`);
        for (const c of cited) {
          const href = safeHref(c.url);
          const text = escapeMarkdown(c.text.trim());
          lines.push(`     - ${href ? `[${text}](<${markdownHref(href)}>)` : text}`);
        }
      }
      if (p.reference) {
        let ref = escapeMarkdownEntry(p.reference);
        if (cv.display.highlightSelf && p.item && p.item.selfNameVariants.length > 0) {
          ref = wrapSelf(ref, p.item.selfNameVariants.map(escapeMarkdown), (x) => `**${x}**`);
        }
        lines.push(`   - **${escapeMarkdown(s.reference)} :** ${ref}`);
      }
      return lines.join("\n");
    })
    .join("\n");
}

/** LaTeX: an `enumerate`, the facts as labelled lines under each title. */
export function contributionsLatex(
  cv: CanonicalCv,
  list: readonly PreparedContribution[],
  escapeLatex: (text: string) => string,
  sanitizeUrl: (href: string) => string,
): string {
  const s = proseStarterStrings(cv.display.locale);
  const items = list.map((p) => {
    const meta = contributionMeta(p, s);
    const lines = [
      `\\item \\textbf{${escapeLatex(p.title)}}${meta ? ` (${escapeLatex(meta)})` : ""}`,
    ];
    const fact = (label: string, text: string | undefined) => {
      const value = text?.trim();
      if (value)
        lines.push(
          `\\textit{${escapeLatex(label)}} : ${escapeLatex(value.replace(/\s*\n+\s*/g, " "))}`,
        );
    };
    fact(s.role, p.contribution.role);
    fact(s.impact, p.contribution.impact);
    for (const c of (p.contribution.citedIn ?? []).filter((x) => x.text.trim())) {
      const href = safeHref(c.url);
      const text = escapeLatex(c.text.trim());
      lines.push(
        `\\textit{${escapeLatex(s.citedIn)}} : ${href ? `\\href{${sanitizeUrl(href)}}{${text}}` : text}`,
      );
    }
    if (p.reference) {
      let ref = escapeLatex(p.reference);
      if (cv.display.highlightSelf && p.item && p.item.selfNameVariants.length > 0) {
        ref = wrapSelf(ref, p.item.selfNameVariants.map(escapeLatex), (x) => `\\textbf{${x}}`);
      }
      lines.push(`{\\small ${ref}}`);
    }
    return lines.join(" \\\\\n");
  });
  return `\\begin{enumerate}[leftmargin=1.6em,itemsep=0.6em]\n${items.join("\n")}\n\\end{enumerate}`;
}
