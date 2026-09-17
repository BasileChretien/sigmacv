// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import CvPreview from "@/components/CvPreview";
import { CanonicalCvSchema, type CanonicalCv } from "@/lib/canonical/schema";
import { renderCvHtml } from "@/lib/render/html";

/**
 * A bracketed placeholder line in a prose section ("[to complete]", a starter
 * prompt) is a `cv-prose-prompt` paragraph everywhere, and in the EDITOR preview
 * only, a link back to its section (`#cv-edit=<id>`, target _top) — the sandbox
 * of the editor's preview allows that fragment change on a user click; every
 * other preview keeps the production sandbox.
 */

function makeCv(body: string): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "prompt",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      {
        id: "narrative-knowledge",
        type: "narrative-knowledge",
        title: "Contributions",
        visible: true,
        order: 0,
        items: [],
        body,
      },
    ],
    provenance: { generatedAt: "2026-09-17T00:00:00.000Z", sources: ["manual"] },
  });
}

afterEach(cleanup);

describe("placeholder lines in prose", () => {
  const body =
    "[Pick your publications in the Content panel.]\n\nA real paragraph [with brackets] inside.\n\n[to complete]";

  it("are marked in every render, and linked to the section only in the editor preview", () => {
    const plain = renderCvHtml(makeCv(body));
    expect(plain).toContain(
      '<p class="cv-prose-prompt">[Pick your publications in the Content panel.]</p>',
    );
    expect(plain).toContain('<p class="cv-prose-prompt">[to complete]</p>');
    expect(plain).toContain("<p>A real paragraph [with brackets] inside.</p>");
    // The link element is absent (its CSS rule ships in the base styles, inert).
    expect(plain).not.toContain('<a class="cv-prose-prompt-link"');
    expect(plain).not.toContain("#cv-edit=");

    const preview = renderCvHtml(makeCv(body), { editorPreview: true });
    expect(preview).toContain(
      '<p class="cv-prose-prompt"><a class="cv-prose-prompt-link" href="#cv-edit=narrative-knowledge" target="_top">[Pick your publications in the Content panel.]</a></p>',
    );
    expect(preview).toContain("<p>A real paragraph [with brackets] inside.</p>");
    // The style for the link ships in the base CSS (inert without the link).
    expect(preview).toContain("a.cv-prose-prompt-link {");
  });

  it("the editor's preview frame allows top navigation on a user click; any other preview does not", () => {
    render(<CvPreview html="<p>x</p>" locale="en-US" editable />);
    const editable = document.querySelector("iframe")!.getAttribute("sandbox");
    expect(editable).toBe(
      "allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation",
    );
    expect(editable).not.toMatch(/allow-scripts|allow-same-origin/);
    cleanup();
    render(<CvPreview html="<p>x</p>" locale="en-US" />);
    expect(document.querySelector("iframe")!.getAttribute("sandbox")).toBe(
      "allow-popups allow-popups-to-escape-sandbox",
    );
  });
});
