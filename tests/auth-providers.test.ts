import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Email LOGIN gating (auth.config.ts): SMTP env alone must power only the
 * digest mailer — the magic-link sign-in provider (a REGISTRATION path) needs
 * the separate, explicit EMAIL_LOGIN_ENABLED opt-in, so sign-up stays
 * ORCID-only by default. auth.config evaluates env at import time, so each
 * case reloads the module with a fresh environment.
 */

const BASE_ENV = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
};

const OPTIONAL_VARS = [
  "EMAIL_SERVER",
  "EMAIL_FROM",
  "EMAIL_LOGIN_ENABLED",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

async function loadEnabledProviders(env: Record<string, string>) {
  vi.resetModules();
  for (const key of OPTIONAL_VARS) delete process.env[key];
  Object.assign(process.env, BASE_ENV, env);
  const mod = await import("@/auth.config");
  return mod.enabledProviders;
}

beforeEach(() => {
  for (const key of OPTIONAL_VARS) delete process.env[key];
});

describe("email-login gating (ORCID-only registration by default)", () => {
  const SMTP = {
    EMAIL_SERVER: "smtp://user:pass@mail.example.org:2525",
    EMAIL_FROM: "SigmaCV <hello@example.org>",
  };

  it("SMTP alone does NOT enable email login (digest mailer only)", async () => {
    const providers = await loadEnabledProviders(SMTP);
    expect(providers.orcid).toBe(true);
    expect(providers.email).toBe(false);
  });

  it("the explicit EMAIL_LOGIN_ENABLED=true opt-in enables it", async () => {
    const providers = await loadEnabledProviders({ ...SMTP, EMAIL_LOGIN_ENABLED: "true" });
    expect(providers.email).toBe(true);
  });

  it('the flag is useless without SMTP, and only the literal "true" counts', async () => {
    expect((await loadEnabledProviders({ EMAIL_LOGIN_ENABLED: "true" })).email).toBe(false);
    expect((await loadEnabledProviders({ ...SMTP, EMAIL_LOGIN_ENABLED: "1" })).email).toBe(false);
    expect((await loadEnabledProviders({ ...SMTP, EMAIL_LOGIN_ENABLED: "TRUE" })).email).toBe(
      false,
    );
  });
});
