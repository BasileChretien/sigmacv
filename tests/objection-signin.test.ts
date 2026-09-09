import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ set: vi.fn() }));
vi.mock("@/lib/cv/previewSuppression", () => ({ setOrcidPreviewSuppressed: mocks.set }));
vi.mock("@/lib/log", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import {
  OBJECTION_PROVIDER_ID,
  handleObjectionSignIn,
  objectionDonePath,
} from "@/lib/auth/objection";
import { parseObjectionOutcome } from "@/lib/auth/objectionOutcome";

beforeEach(() => {
  mocks.set.mockClear();
  mocks.set.mockResolvedValue("set");
});

describe("handleObjectionSignIn", () => {
  it("lets every ordinary sign-in through untouched (login provider, google, email, none)", async () => {
    for (const account of [
      { provider: "orcid", providerAccountId: "0000-0002-1825-0097" },
      { provider: "google", providerAccountId: "g1" },
      { provider: "email" },
      null,
    ]) {
      await expect(handleObjectionSignIn(account)).resolves.toBe(true);
    }
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("records the objection for the objection provider and aborts the sign-in with a redirect", async () => {
    mocks.set.mockResolvedValue("set");
    const out = await handleObjectionSignIn({
      provider: OBJECTION_PROVIDER_ID,
      providerAccountId: "0000-0002-1825-0097",
    });
    expect(out).toBe(objectionDonePath("suppressed"));
    expect(mocks.set).toHaveBeenCalledWith("0000-0002-1825-0097", true, "orcid-oauth");
  });

  it("normalises the iD ORCID hands back (URL form, lowercase check digit)", async () => {
    mocks.set.mockResolvedValue("set");
    await handleObjectionSignIn({
      provider: OBJECTION_PROVIDER_ID,
      providerAccountId: "https://orcid.org/0000-0002-9079-593x",
    });
    expect(mocks.set).toHaveBeenCalledWith("0000-0002-9079-593X", true, "orcid-oauth");
  });

  it("reports 'failed' for an unreadable iD, and never writes", async () => {
    const out = await handleObjectionSignIn({
      provider: OBJECTION_PROVIDER_ID,
      providerAccountId: "nope",
    });
    expect(out).toBe(objectionDonePath("failed"));
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("reports 'unavailable' when no suppression key is configured", async () => {
    mocks.set.mockResolvedValue("unavailable");
    const out = await handleObjectionSignIn({
      provider: OBJECTION_PROVIDER_ID,
      providerAccountId: "0000-0002-1825-0097",
    });
    expect(out).toBe(objectionDonePath("unavailable"));
  });

  it("reports 'failed' on a write error, without letting it escape", async () => {
    mocks.set.mockImplementation(async () => {
      throw new Error("db down");
    });
    const out = await handleObjectionSignIn({
      provider: OBJECTION_PROVIDER_ID,
      providerAccountId: "0000-0002-1825-0097",
    });
    expect(out).toBe(objectionDonePath("failed"));
  });

  it("the redirect carries the outcome only — never the iD", () => {
    for (const o of ["suppressed", "failed", "unavailable"] as const) {
      expect(objectionDonePath(o)).toBe(`/object/done?outcome=${o}`);
      expect(objectionDonePath(o)).not.toMatch(/\d{4}-\d{4}/);
    }
  });
});

describe("parseObjectionOutcome", () => {
  it("accepts the three outcomes and defaults everything else to 'failed'", () => {
    expect(parseObjectionOutcome("suppressed")).toBe("suppressed");
    expect(parseObjectionOutcome("unavailable")).toBe("unavailable");
    expect(parseObjectionOutcome(["suppressed"])).toBe("suppressed");
    expect(parseObjectionOutcome("failed")).toBe("failed");
    expect(parseObjectionOutcome("anything")).toBe("failed");
    expect(parseObjectionOutcome(undefined)).toBe("failed");
  });
});
