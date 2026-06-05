import type { NextAuthConfig } from "next-auth";
import type { OIDCConfig, Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";

/**
 * Edge-safe Auth.js config (no database adapter, no Node-only imports). The
 * full config in `auth.ts` extends this with the Prisma adapter + DB sessions.
 *
 * MVP ships ORCID only. Google + email/password are deliberately deferred; they
 * drop into the `providers` array later without touching anything else.
 */

const ORCID_ENV =
  process.env.ORCID_ENVIRONMENT === "production" ? "production" : "sandbox";

const ORCID_BASE =
  ORCID_ENV === "production"
    ? "https://orcid.org"
    : "https://sandbox.orcid.org";

interface OrcidProfile {
  sub: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  email?: string;
}

/**
 * ORCID is an OpenID Connect provider. Its `.well-known/openid-configuration`
 * supplies the authorization/token/userinfo/jwks endpoints. The `sub` claim is
 * the user's ORCID iD.
 *
 * Security note: this flow runs with `checks: ["state"]` ONLY. ORCID's OIDC
 * discovery advertises neither PKCE (no `code_challenge_methods_supported`) nor
 * a reliable nonce, and Auth.js refuses to request a check the IdP doesn't
 * advertise. Residual risk is constrained: it is a confidential client
 * exchanging the code server-side with the secret (client_secret_post), the
 * callback is strictly same-site, and there is no open redirect to leak the
 * code. If ORCID later advertises PKCE/S256, switch to `["state","pkce"]`.
 */
const orcidProvider: OIDCConfig<OrcidProfile> = {
  id: "orcid",
  name: "ORCID",
  type: "oidc",
  issuer: ORCID_BASE,
  clientId: process.env.ORCID_CLIENT_ID,
  clientSecret: process.env.ORCID_CLIENT_SECRET,
  wellKnown: `${ORCID_BASE}/.well-known/openid-configuration`,
  authorization: { params: { scope: "openid" } },
  // ORCID's token endpoint advertises ONLY client_secret_post (Auth.js defaults
  // to client_secret_basic, which ORCID rejects).
  client: { token_endpoint_auth_method: "client_secret_post" },
  // ORCID's OIDC discovery advertises neither PKCE (no
  // code_challenge_methods_supported) nor a reliable nonce. Auth.js refuses to
  // start the flow when asked for an unsupported check, so verify with state only.
  checks: ["state"],
  profile(profile) {
    const composed = [profile.given_name, profile.family_name]
      .filter(Boolean)
      .join(" ");
    return {
      id: profile.sub,
      name: composed || profile.name || profile.sub,
      email: profile.email ?? null,
      image: null,
    };
  },
};

// Optional providers, enabled only when their env vars are present, so the app
// runs with just ORCID out of the box. ORCID stays the primary (data-bearing)
// login; Google/email are alternate sign-ins.
const googleEnabled =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const emailEnabled =
  !!process.env.EMAIL_SERVER && !!process.env.EMAIL_FROM;

/** Which optional providers are active (used by the sign-in UI). */
export const enabledProviders = {
  orcid: true,
  google: googleEnabled,
  email: emailEnabled,
};

const providers: Provider[] = [orcidProvider];
if (googleEnabled) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}
if (emailEnabled) {
  providers.push(
    Nodemailer({
      id: "email", // stable callback path /api/auth/callback/email
      server: process.env.EMAIL_SERVER as string,
      from: process.env.EMAIL_FROM as string,
    }),
  );
}

export const authConfig = {
  providers,
  pages: {
    signIn: "/",
  },
  callbacks: {
    // Used by the (optional) middleware/`auth` wrapper for quick checks.
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
