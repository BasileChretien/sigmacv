import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock DNS so hostname SSRF checks are deterministic + offline.
const lookupMock = vi.fn();
vi.mock("node:dns/promises", () => ({ lookup: (...a: unknown[]) => lookupMock(...a) }));

import { AiConfigError, AiRequestError, chatComplete } from "@/lib/ai/provider";

const KEY = "sk-user-byok";
const MSGS = [{ role: "user" as const, content: "draft" }];
const cfg = (over: Partial<{ baseUrl: string; model: string; apiKey: string }> = {}) => ({
  baseUrl: "https://93.184.216.34/v1", // public IP literal → no DNS lookup needed
  model: "some-model",
  apiKey: KEY,
  ...over,
});

const completion = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  lookupMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("chatComplete — config validation", () => {
  it("throws AiConfigError (no network) for a missing key or model", async () => {
    await expect(chatComplete(MSGS, cfg({ apiKey: "" }))).rejects.toBeInstanceOf(AiConfigError);
    await expect(chatComplete(MSGS, cfg({ model: "" }))).rejects.toBeInstanceOf(AiConfigError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("chatComplete — SSRF hardening on the user endpoint", () => {
  const rejects = async (baseUrl: string) => {
    await expect(chatComplete(MSGS, cfg({ baseUrl }))).rejects.toBeInstanceOf(AiConfigError);
    expect(fetchMock).not.toHaveBeenCalled();
  };

  it("refuses non-https", () => rejects("http://api.example.com/v1"));
  it("refuses localhost + bare internal names", async () => {
    await rejects("https://localhost/v1");
    await rejects("https://intranet/v1");
    await rejects("https://api.internal/v1");
  });
  it("refuses IP-literal loopback / private / link-local(metadata)", async () => {
    await rejects("https://127.0.0.1/v1");
    await rejects("https://10.0.0.1/v1");
    await rejects("https://192.168.1.10/v1");
    await rejects("https://169.254.169.254/v1"); // cloud metadata
    await rejects("https://[::1]/v1");
  });
  it("refuses a hostname that RESOLVES to a private address", async () => {
    lookupMock.mockResolvedValue([{ address: "10.1.2.3", family: 4 }]);
    await rejects("https://sneaky.example.com/v1");
  });
});

describe("chatComplete — request", () => {
  it("posts an OpenAI-compatible body with the USER's bearer key + model", async () => {
    fetchMock.mockResolvedValue(completion("  A grounded draft.  "));
    const out = await chatComplete(MSGS, cfg({ model: "open-mistral-nemo" }));
    expect(out).toBe("A grounded draft."); // trimmed
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://93.184.216.34/v1/chat/completions");
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    // Fails closed on redirects so a 302 can't slip past the SSRF check.
    expect(init.redirect).toBe("error");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("open-mistral-nemo");
    expect(body.messages).toEqual(MSGS);
  });

  it("works with a hostname that resolves to a public address", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    fetchMock.mockResolvedValue(completion("ok"));
    await expect(chatComplete(MSGS, cfg({ baseUrl: "https://api.mistral.ai/v1" }))).resolves.toBe(
      "ok",
    );
  });

  it("throws AiRequestError on a non-OK response", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 401 }));
    await expect(chatComplete(MSGS, cfg())).rejects.toBeInstanceOf(AiRequestError);
  });

  it("throws AiRequestError on an empty / malformed completion", async () => {
    fetchMock.mockResolvedValue(completion("   "));
    await expect(chatComplete(MSGS, cfg())).rejects.toBeInstanceOf(AiRequestError);
    fetchMock.mockResolvedValue(new Response("{not json", { status: 200 }));
    await expect(chatComplete(MSGS, cfg())).rejects.toBeInstanceOf(AiRequestError);
  });

  it("throws AiRequestError when the transport fails", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(chatComplete(MSGS, cfg())).rejects.toBeInstanceOf(AiRequestError);
  });
});
