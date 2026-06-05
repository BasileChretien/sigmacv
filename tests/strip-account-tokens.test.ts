import { describe, expect, it } from "vitest";
import { stripAccountTokens } from "@/lib/auth/stripAccountTokens";

describe("stripAccountTokens", () => {
  it("nulls all provider bearer tokens + expires_at before persistence", () => {
    const account = {
      provider: "orcid",
      providerAccountId: "0000-0002-7483-2489",
      type: "oidc",
      userId: "u_1",
      access_token: "AT-secret",
      refresh_token: "RT-secret",
      id_token: "ID-secret",
      expires_at: 2_400_000_000,
      scope: "openid",
    };
    const stripped = stripAccountTokens(account);
    expect(stripped.access_token).toBeUndefined();
    expect(stripped.refresh_token).toBeUndefined();
    expect(stripped.id_token).toBeUndefined();
    expect(stripped.expires_at).toBeUndefined();
  });

  it("preserves the non-secret linkage fields", () => {
    const stripped = stripAccountTokens({
      provider: "orcid",
      providerAccountId: "abc",
      type: "oidc",
      userId: "u_1",
      access_token: "x",
    });
    expect(stripped.provider).toBe("orcid");
    expect(stripped.providerAccountId).toBe("abc");
    expect(stripped.type).toBe("oidc");
    expect(stripped.userId).toBe("u_1");
  });

  it("does not mutate the input", () => {
    const account = { provider: "orcid", access_token: "x" };
    stripAccountTokens(account);
    expect(account.access_token).toBe("x");
  });
});
