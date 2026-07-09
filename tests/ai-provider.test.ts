import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mutable env mock so each test can flip the AI config.
const env: Record<string, unknown> = {};
vi.mock("@/lib/env", () => ({ getEnv: () => env }));

import {
  AiDisabledError,
  AiRequestError,
  aiConfig,
  chatComplete,
  isNarrativeAiEnabled,
} from "@/lib/ai/provider";

function setEnv(overrides: Record<string, unknown>) {
  for (const k of Object.keys(env)) delete env[k];
  Object.assign(
    env,
    {
      AI_NARRATIVE_ENABLED: false,
      AI_BASE_URL: "https://api.mistral.ai/v1",
      AI_MODEL: "open-mistral-nemo",
      AI_API_KEY: undefined,
    },
    overrides,
  );
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  setEnv({});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const completion = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

describe("aiConfig / isNarrativeAiEnabled", () => {
  it("is enabled only when the flag is on AND a key is present", () => {
    setEnv({ AI_NARRATIVE_ENABLED: false, AI_API_KEY: "k" });
    expect(isNarrativeAiEnabled()).toBe(false);
    setEnv({ AI_NARRATIVE_ENABLED: true, AI_API_KEY: undefined });
    expect(isNarrativeAiEnabled()).toBe(false);
    setEnv({ AI_NARRATIVE_ENABLED: true, AI_API_KEY: "k" });
    expect(isNarrativeAiEnabled()).toBe(true);
  });

  it("carries the configured base URL + model through", () => {
    setEnv({ AI_BASE_URL: "https://api.scaleway.ai/v1", AI_MODEL: "mistral-nemo" });
    expect(aiConfig()).toMatchObject({
      baseUrl: "https://api.scaleway.ai/v1",
      model: "mistral-nemo",
    });
  });
});

describe("chatComplete", () => {
  it("throws AiDisabledError WITHOUT any network call when disabled", async () => {
    setEnv({ AI_NARRATIVE_ENABLED: false, AI_API_KEY: "k" });
    await expect(chatComplete([{ role: "user", content: "hi" }])).rejects.toBeInstanceOf(
      AiDisabledError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts an OpenAI-compatible body with a bearer key and returns the content", async () => {
    setEnv({ AI_NARRATIVE_ENABLED: true, AI_API_KEY: "sk-test", AI_MODEL: "open-mistral-nemo" });
    fetchMock.mockResolvedValue(completion("  A grounded draft.  "));
    const out = await chatComplete([{ role: "user", content: "draft" }]);
    expect(out).toBe("A grounded draft."); // trimmed
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer sk-test");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("open-mistral-nemo");
    expect(body.messages).toEqual([{ role: "user", content: "draft" }]);
  });

  it("throws AiRequestError on a non-OK response", async () => {
    setEnv({ AI_NARRATIVE_ENABLED: true, AI_API_KEY: "k" });
    fetchMock.mockResolvedValue(new Response("nope", { status: 401 }));
    await expect(chatComplete([{ role: "user", content: "x" }])).rejects.toBeInstanceOf(
      AiRequestError,
    );
  });

  it("throws AiRequestError on an empty / malformed completion", async () => {
    setEnv({ AI_NARRATIVE_ENABLED: true, AI_API_KEY: "k" });
    fetchMock.mockResolvedValue(completion("   "));
    await expect(chatComplete([{ role: "user", content: "x" }])).rejects.toBeInstanceOf(
      AiRequestError,
    );
    fetchMock.mockResolvedValue(new Response("{not json", { status: 200 }));
    await expect(chatComplete([{ role: "user", content: "x" }])).rejects.toBeInstanceOf(
      AiRequestError,
    );
  });

  it("throws AiRequestError when the transport fails", async () => {
    setEnv({ AI_NARRATIVE_ENABLED: true, AI_API_KEY: "k" });
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(chatComplete([{ role: "user", content: "x" }])).rejects.toBeInstanceOf(
      AiRequestError,
    );
  });
});
