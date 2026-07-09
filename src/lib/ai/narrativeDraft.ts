import { narrativeEvidence, narrativeEvidenceTitles } from "@/lib/canonical/narrativeEvidence";
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
  const titleGroups = narrativeEvidenceTitles(cv, sectionType);
  const headline = cv.owner.headline?.trim();

  const system = [
    'You help a researcher draft ONE module of a funder "narrative CV" (a UKRI Résumé for Research and Innovation / Royal Society Résumé for Researchers).',
    `Write in ${language}.`,
    "Write one or two short, first-person paragraphs of plain, honest prose about the researcher's own contributions.",
    "Ground every statement ONLY in the outputs provided: do NOT invent findings, awards, venues, numbers or collaborators, and do NOT quote citation counts, h-index or any other metric.",
    "Keep it modest, concrete and specific — not promotional.",
    "This is a FIRST DRAFT the researcher will verify and rewrite. Output only the prose: no heading, no preamble, no bullet list.",
  ].join(" ");

  const parts: string[] = [`Narrative module: ${moduleName}.`];
  if (guidance) parts.push(`What belongs here: ${guidance}`);
  if (headline) parts.push(`The researcher describes their field as: ${headline}.`);
  if (counts.length > 0) {
    parts.push(
      `Relevant outputs to draw on: ${counts
        .map((c) => `${c.count} ${sectionTitle(locale, c.type)}`)
        .join(", ")}.`,
    );
  }
  for (const group of titleGroups) {
    parts.push(
      `${sectionTitle(locale, group.type)} (examples):\n${group.titles
        .map((t) => `- ${t}`)
        .join("\n")}`,
    );
  }
  parts.push(`Draft the "${moduleName}" module now.`);

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
  return chatComplete(buildNarrativeMessages(cv, sectionType), config);
}
