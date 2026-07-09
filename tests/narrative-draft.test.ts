import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const env: Record<string, unknown> = {};
vi.mock("@/lib/env", () => ({ getEnv: () => env }));

import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { sectionTitle } from "@/lib/i18n";
import { narrativeGuidance } from "@/lib/i18n/narrativeGuidance";
import {
  buildNarrativeMessages,
  generateNarrativeDraft,
  isNarrativeAiSection,
} from "@/lib/ai/narrativeDraft";
import { AiRequestError } from "@/lib/ai/provider";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const work = (id: string, title: string): OpenAlexWork =>
  ({
    id: `https://openalex.org/${id}`,
    title,
    display_name: title,
    type: "article",
    publication_year: 2024,
    cited_by_count: 10,
    authorships: [{ author: { id: SELF, display_name: "Basile Chrétien" } }],
    primary_location: { source: { display_name: "J. Pharmacovigilance", type: "journal" } },
  }) as unknown as OpenAlexWork;

function makeCv(): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "n",
    resolved,
    works: [
      work("W1", "Adverse drug reactions in oncology"),
      work("W2", "A disproportionality signal-detection method"),
    ],
    now: "2026-06-02T00:00:00.000Z",
  });
  return {
    ...cv,
    owner: {
      ...cv.owner,
      headline: "Pharmacovigilance researcher",
      contact: { email: "secret@example.org", phone: "+33 000" },
    },
  };
}

describe("isNarrativeAiSection", () => {
  it("is true only for the four narrative modules", () => {
    expect(isNarrativeAiSection("narrative-knowledge")).toBe(true);
    expect(isNarrativeAiSection("narrative-society")).toBe(true);
    expect(isNarrativeAiSection("statement")).toBe(false);
    expect(isNarrativeAiSection("publications")).toBe(false);
  });
});

describe("buildNarrativeMessages", () => {
  it("assembles a grounded, honesty-constrained prompt in the CV's language", () => {
    const [system, user] = buildNarrativeMessages(makeCv(), "narrative-knowledge");
    expect(system.role).toBe("system");
    expect(system.content).toContain("English"); // default locale en-US
    expect(system.content).toMatch(/do NOT invent/i);
    expect(system.content).toMatch(/do NOT quote citation counts/i);
    // The user message carries the module framing + guidance + real evidence.
    expect(user.content).toContain(sectionTitle("en-US", "narrative-knowledge"));
    expect(user.content).toContain(narrativeGuidance("en-US", "narrative-knowledge")!);
    expect(user.content).toContain(sectionTitle("en-US", "publications")); // the count label
    expect(user.content).toContain("Adverse drug reactions in oncology"); // a real title
    expect(user.content).toContain("Pharmacovigilance researcher"); // the (public) headline
  });

  it("MINIMISES data: never sends contact details / identifiers to the provider", () => {
    const payload = JSON.stringify(buildNarrativeMessages(makeCv(), "narrative-knowledge"));
    expect(payload).not.toContain("secret@example.org");
    expect(payload).not.toContain("+33 000");
    expect(payload).not.toContain("0000-0002-7483-2489"); // no ORCID
  });

  it("writes the draft in the CV's chosen language", () => {
    const cv = makeCv();
    const fr = { ...cv, display: { ...cv.display, locale: "fr-FR" as const } };
    expect(buildNarrativeMessages(fr, "narrative-knowledge")[0].content).toContain("French");
  });

  it("still builds a valid prompt with no outputs or headline", () => {
    const empty = buildCanonicalCv({
      id: "empty",
      resolved,
      works: [],
      now: "2026-06-02T00:00:00.000Z",
    });
    const [, user] = buildNarrativeMessages(empty, "narrative-community");
    expect(user.content).toContain(sectionTitle("en-US", "narrative-community"));
    expect(user.content).toContain("Draft the"); // still asks for the draft
    expect(user.content).not.toContain("describes their field as"); // no headline line
  });
});

describe("generateNarrativeDraft", () => {
  // BYOK: the caller passes their own provider config. A public IP-literal base
  // URL keeps the SSRF check offline (no DNS lookup).
  const CONFIG = { baseUrl: "https://93.184.216.34/v1", model: "open-mistral-nemo", apiKey: "sk" };
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the provider's completion for a narrative module", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "My key contributions…" } }] }),
        { status: 200 },
      ),
    );
    const draft = await generateNarrativeDraft(makeCv(), "narrative-knowledge", CONFIG);
    expect(draft).toBe("My key contributions…");
    // The posted messages are exactly the built ones.
    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(init.body as string);
    expect(body.messages).toEqual(buildNarrativeMessages(makeCv(), "narrative-knowledge"));
  });

  it("rejects a non-narrative section type before any network call", async () => {
    await expect(generateNarrativeDraft(makeCv(), "publications", CONFIG)).rejects.toBeInstanceOf(
      AiRequestError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
