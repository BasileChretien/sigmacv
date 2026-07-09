import { narrativeEvidence, narrativeEvidenceEntries } from "@/lib/canonical/narrativeEvidence";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { asLocale, sectionTitle, type Locale } from "@/lib/i18n";
import { narrativeGuidance } from "@/lib/i18n/narrativeGuidance";
import { NARRATIVE_AI_SECTIONS, isNarrativeAiSection, type NarrativeAiSection } from "./sections";
import { AiRequestError, chatComplete, type AiProviderConfig, type ChatMessage } from "./provider";

// Re-export the client-safe section helpers so existing importers of this module
// keep working (the definitions live in ./sections to avoid pulling the provider
// relay — node:net/node:dns — into client bundles).
export { NARRATIVE_AI_SECTIONS, isNarrativeAiSection, type NarrativeAiSection };

/**
 * Assembles the AI first-draft for a funder "narrative CV" module from the user's
 * OWN curated, VISIBLE research outputs. The prompt is deliberately MINIMAL and
 * public-only — the module framing, the counts of relevant outputs, a handful of
 * representative TITLES, and the researcher's self-described field. It never
 * includes contact details, identifiers (ORCID / email / phone), abstracts or
 * co-authors, so the minimum personal data reaches the (opt-in, EU) processor.
 *
 * The draft is a starting point only: the system prompt forbids inventing
 * findings or quoting metrics, and the UI labels the result "AI draft — verify
 * and rewrite" and never auto-inserts it.
 */

/** Human language names so the model writes the draft in the CV's own language. */
const LANGUAGE_NAMES: Record<Locale, string> = {
  "en-US": "English",
  "zh-CN": "Simplified Chinese",
  "es-ES": "Spanish",
  "fr-FR": "French",
  "de-DE": "German",
  "ja-JP": "Japanese",
  "pt-BR": "Brazilian Portuguese",
  "it-IT": "Italian",
  "ko-KR": "Korean",
  "ru-RU": "Russian",
};

/**
 * Build the chat messages for a narrative module. Pure — no env, no network — so
 * the exact payload sent to the provider is unit-testable. Uses `cv.display.locale`
 * (the CV's own language) so the draft matches the rest of the document.
 */
export function buildNarrativeMessages(
  cv: CanonicalCv,
  sectionType: NarrativeAiSection,
): [ChatMessage, ChatMessage] {
  const locale = asLocale(cv.display.locale);
  const language = LANGUAGE_NAMES[locale];
  const moduleName = sectionTitle(locale, sectionType);
  const guidance = narrativeGuidance(locale, sectionType) ?? "";
  const counts = narrativeEvidence(cv, sectionType);
  const groups = narrativeEvidenceEntries(cv, sectionType);
  const headline = cv.owner.headline?.trim();
  const summary = cv.owner.summary?.trim();
  const areas = (cv.owner.researchAreas ?? [])
    .map((a) => a.field?.trim())
    .filter((f): f is string => Boolean(f))
    .slice(0, 8);

  const system = [
    'You are helping a researcher draft ONE module of a funder "narrative CV" — a UKRI Résumé for Research and Innovation (R4RI) or Royal Society Résumé for Researchers.',
    `Write in ${language}.`,
    "Write a substantive, reflective FIRST-PERSON narrative of two to four short paragraphs that weaves the researcher's SPECIFIC listed outputs into an account of their contributions in this area — name concrete themes and pieces of work from the evidence, explain what they contributed and why it matters, and show a through-line rather than listing items.",
    "This is a NARRATIVE, not a publication list: refer to the actual work by its topic and, where useful, its venue and year, but do not just enumerate titles.",
    "Ground EVERYTHING only in the material provided. Do NOT invent findings, awards, roles, venues, collaborators, dates or numbers, and do NOT quote citation counts, h-index, journal impact factors or any other metric (these funders forbid it).",
    "Be concrete and specific, honest and measured — avoid generic filler, buzzwords and clichés ('cutting-edge', 'world-class', 'passionate'). Prefer plain, precise language.",
    "This is a FIRST DRAFT the researcher will verify and rewrite; where a detail is genuinely missing, leave a natural gap rather than inventing one. Output ONLY the prose: no heading, no preamble, no bullet points, no markdown.",
  ].join(" ");

  const parts: string[] = [
    `Draft the "${moduleName}" module of the researcher's narrative CV.`,
    `What this module should cover: ${guidance}`,
  ];
  if (headline) parts.push(`The researcher summarises their field as: ${headline}.`);
  if (summary) parts.push(`The researcher's own summary of their work:\n${summary}`);
  if (areas.length > 0) parts.push(`Their main research areas: ${areas.join(", ")}.`);
  if (counts.length > 0) {
    parts.push(
      `Overall relevant output in this area: ${counts
        .map((c) => `${c.count} ${sectionTitle(locale, c.type)}`)
        .join(", ")}.`,
    );
  }
  for (const group of groups) {
    const lines = group.entries.map((e) => {
      const tail = [e.venue, e.year].filter(Boolean).join(", ");
      return tail ? `- ${e.title} (${tail})` : `- ${e.title}`;
    });
    parts.push(
      `Representative ${sectionTitle(locale, group.type)} to draw on:\n${lines.join("\n")}`,
    );
  }
  parts.push(
    `Now write the "${moduleName}" module as flowing first-person prose, drawing on the specifics above.`,
  );

  return [
    { role: "system", content: system },
    { role: "user", content: parts.join("\n\n") },
  ];
}

/**
 * Generate an AI first-draft for a narrative module. Throws {@link AiRequestError}
 * for a non-narrative type (defence in depth — the route also validates), and
 * propagates the provider's disabled/request errors for the caller to translate.
 */
export async function generateNarrativeDraft(
  cv: CanonicalCv,
  sectionType: string,
  config: AiProviderConfig,
): Promise<string> {
  if (!isNarrativeAiSection(sectionType)) {
    throw new AiRequestError("AI drafting is only available for narrative modules");
  }
  // A reflective multi-paragraph module needs room; a slightly higher temperature
  // reads less templated than the terse default.
  return chatComplete(buildNarrativeMessages(cv, sectionType), config, {
    maxTokens: 1400,
    temperature: 0.6,
  });
}
