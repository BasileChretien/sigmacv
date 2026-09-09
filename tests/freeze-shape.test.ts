import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { CV_MODELS } from "@/lib/canonical/cvModels";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  FREEZE_PRESETS,
  freezeRequestModelName,
  freezeRequestQuery,
  isFreezePreset,
  parseFreezeRequest,
  resolveFreezeModelId,
} from "@/lib/cv/freezeRequest";
import { shapeForFreeze } from "@/lib/cv/snapshotShape";
import { SNAPSHOT_LABEL_MAX } from "@/lib/cv/snapshots";
import { applyHiringPreset, HIRING_OFF_KEYS, READER_MODE_KEYS } from "@/lib/render/readerMode";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const CV: CanonicalCv = buildCanonicalCv({
  id: "shape",
  resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
  works,
  now: "2026-06-02T00:00:00.000Z",
});

const q = (s: string) => new URLSearchParams(s);

describe("parseFreezeRequest (the stateless request link)", () => {
  it("needs `freeze` naming a catalog model or `1`; everything else is allow-listed", () => {
    expect(parseFreezeRequest(q(""))).toBeNull();
    expect(parseFreezeRequest(q("preset=reader"))).toBeNull();
    expect(parseFreezeRequest(q("freeze=not-a-model"))).toBeNull();
    // A model NAME (as shown in the picker) resolves too, loosely.
    expect(parseFreezeRequest(q("freeze=US%20tenure%20%2F%20promotion%20dossier"))).toEqual({
      modelId: "tenure-us",
    });
    expect(parseFreezeRequest(q("freeze=us-tenure-promotion-dossier"))).toEqual({
      modelId: "tenure-us",
    });
    expect(resolveFreezeModelId("ERC (Starting / Consolidator / Advanced)")).toBe("erc");
    expect(resolveFreezeModelId("   ")).toBeUndefined();
    expect(parseFreezeRequest(q("freeze=erc"))).toEqual({ modelId: "erc" });
    expect(parseFreezeRequest(q("freeze=1&preset=hiring"))).toEqual({ preset: "hiring" });
    expect(
      parseFreezeRequest(
        q("freeze=institutional-assessment&preset=reader&label=HCERES%202027&by=2026-10-01"),
      ),
    ).toEqual({
      modelId: "institutional-assessment",
      preset: "reader",
      label: "HCERES 2027",
      by: "2026-10-01",
    });
  });

  it("drops malformed optional fields without rejecting the request", () => {
    expect(parseFreezeRequest(q("freeze=erc&preset=metrics&by=2026-13-45&label=%20%20"))).toEqual({
      modelId: "erc",
    });
    expect(parseFreezeRequest(q("freeze=erc&by=2026-02-30"))).toEqual({ modelId: "erc" });
    expect(parseFreezeRequest(q("freeze=erc&by=26-1-1"))).toEqual({ modelId: "erc" });
    const long = "x".repeat(SNAPSHOT_LABEL_MAX + 20);
    expect(parseFreezeRequest(q(`freeze=erc&label=${long}`))!.label).toHaveLength(
      SNAPSHOT_LABEL_MAX,
    );
    // Whitespace is collapsed; nothing else is interpreted.
    expect(parseFreezeRequest(q("freeze=erc&label=a%20%20%0Ab"))!.label).toBe("a b");
  });

  it("a request can never ask for metrics, career context or supervisee names", () => {
    const r = parseFreezeRequest(
      q("freeze=erc&showMetrics=1&showCareerContext=true&hideSuperviseeNames=false&preset=reader"),
    )!;
    expect(Object.keys(r).sort()).toEqual(["modelId", "preset"]);
    expect(FREEZE_PRESETS).toEqual(["reader", "hiring"]);
    expect(isFreezePreset("reader")).toBe(true);
    expect(isFreezePreset("metrics")).toBe(false);
  });

  it("round-trips through the query builder and resolves the model's catalog name", () => {
    const req = {
      modelId: "erc",
      preset: "hiring" as const,
      label: "Pharma R&D",
      by: "2026-10-01",
    };
    expect(freezeRequestQuery(req)).toBe(
      "?freeze=erc&preset=hiring&label=Pharma+R%26D&by=2026-10-01",
    );
    expect(parseFreezeRequest(q(freezeRequestQuery(req)))).toEqual(req);
    expect(freezeRequestQuery({})).toBe("?freeze=1");
    expect(freezeRequestQuery({ modelId: "nope", by: "bad" })).toBe("?freeze=1");
    expect(freezeRequestModelName({ modelId: "erc" })).toBe(
      CV_MODELS.find((m) => m.id === "erc")!.name,
    );
    expect(freezeRequestModelName({})).toBeUndefined();
    expect(freezeRequestModelName({ modelId: "zzz" })).toBeUndefined();
  });
});

describe("applyHiringPreset", () => {
  it("switches contact on and every reader-mode signal + evaluative aggregate off, on a new object", () => {
    const on = updateDisplay(CV, {
      showMetrics: true,
      showCharts: true,
      showProvenance: true,
      showOpenAccess: true,
      showOpenAccessShare: true,
    }).display;
    const out = applyHiringPreset(on);
    expect(out).not.toBe(on);
    expect(on.showMetrics).toBe(true);
    expect(out.publicContact).toEqual({ email: true, phone: true, location: true });
    for (const k of HIRING_OFF_KEYS) expect(out[k], k).toBe(false);
    // The aggregates and the reader-view door are named explicitly (not only via the list).
    expect(out.showMetrics).toBe(false);
    expect(out.showCharts).toBe(false);
    expect(out.showAuthorshipTable).toBe(false);
    expect(out.showOpenAccessShare).toBe(false);
    expect(out.allowReaderMode).toBe(false);
    // Per-work indicators are no longer a reader-mode key, so pin them by name:
    // a hiring-panel version must switch them off even when the owner had them on.
    expect(
      applyHiringPreset(updateDisplay(CV, { showWorkIndicators: true }).display).showWorkIndicators,
    ).toBe(false);
    expect(
      applyHiringPreset(updateDisplay(CV, { allowReaderMode: true }).display).allowReaderMode,
    ).toBe(false);
    for (const k of READER_MODE_KEYS)
      expect((HIRING_OFF_KEYS as readonly string[]).includes(k)).toBe(true);
    // Untouched: template, locale, retracted-works choice, metric selection.
    expect(out.template).toBe(on.template);
    expect(out.locale).toBe(on.locale);
    expect(out.hideRetracted).toBe(on.hideRetracted);
  });
});

describe("shapeForFreeze", () => {
  it("applies a model on a copy (the input is untouched) and ignores unknown ids", () => {
    const before = JSON.stringify(CV);
    const shaped = shapeForFreeze(CV, { modelId: "institutional-assessment" });
    expect(JSON.stringify(CV)).toBe(before);
    expect(shaped).not.toBe(CV);
    const visible = [...shaped.sections]
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.type);
    expect(visible[0]).toBe("education");
    expect(visible).toContain("software");
    expect(visible).toContain("peer-review");
    expect(visible).not.toContain("skills");
    expect(shapeForFreeze(CV, { modelId: "zzz" })).toBe(CV);
    expect(shapeForFreeze(CV, {})).toBe(CV);
  });

  it("a model freeze starts from the model's own list settings, not the live layout's narrowing", () => {
    const narrowed = updateDisplay(CV, { publicationsLimit: 10, peerReviewedOnly: true });
    // A "full record" model has no overrides → limit and peer-reviewed filter are reset.
    const full = shapeForFreeze(narrowed, { modelId: "institutional-assessment" });
    expect(full.display.publicationsLimit).toBeUndefined();
    expect(full.display.peerReviewedOnly).toBe(false);
    // A model with its own overrides applies them.
    const erc = shapeForFreeze(narrowed, { modelId: "erc" });
    expect(erc.display.publicationsLimit).toBe(10);
    expect(erc.display.peerReviewedOnly).toBe(true);
    // No model → the live settings are kept as they are.
    expect(shapeForFreeze(narrowed, { preset: "reader" }).display.publicationsLimit).toBe(10);
  });

  it("materialises the reader preset (so the ledger's retracted line matches the page) and the hiring preset", () => {
    const hidden = updateDisplay(CV, { hideRetracted: true, showProvenance: false });
    const reader = shapeForFreeze(hidden, { preset: "reader" });
    expect(reader.display.hideRetracted).toBe(false);
    expect(reader.display.showProvenance).toBe(true);
    expect(reader.display.publicContact).toEqual(hidden.display.publicContact);
    const hiring = shapeForFreeze(hidden, { modelId: "pharma-rd", preset: "hiring" });
    expect(hiring.display.publicContact.email).toBe(true);
    expect(hiring.display.showProvenance).toBe(false);
    expect(hiring.sections.filter((s) => s.visible).map((s) => s.type)).toContain("skills");
  });
});
