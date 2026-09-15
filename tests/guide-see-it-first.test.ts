import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { previewStrings } from "@/lib/i18n/preview";

/**
 * The guides carry the reach (Bing's AI report of 2026-09-15: three guides drew
 * three quarters of ~9,000 Copilot citations, against ~5 site visits a day), so
 * every guide ends with the "see it first" box — after the body and FAQ, before
 * the related-links list — under a prompt of its own, in every locale.
 */
describe("guide pages lead to the product", () => {
  it("render the see-it-first box between the FAQ and the related links", () => {
    const src = readFileSync("src/components/GuidePage.tsx", "utf8");
    const form = src.indexOf("<SeeItFirstForm locale={locale} prompt={chrome.tryPrompt} />");
    expect(form).toBeGreaterThan(-1);
    expect(form).toBeGreaterThan(src.indexOf('className="guide-faq"'));
    expect(form).toBeLessThan(src.indexOf('className="landing-related"'));
  });

  it("have a prompt in every locale that differs from the homepage's and promises no score", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const prompt = guidesChrome(loc).tryPrompt;
      expect(prompt.trim().length, loc).toBeGreaterThan(0);
      expect(prompt, loc).not.toBe(previewStrings(loc).formPrompt);
      expect(prompt, loc).not.toMatch(/h-index|score|rank|citation|引用|Zitation|인용|цитир/i);
    }
  });
});
