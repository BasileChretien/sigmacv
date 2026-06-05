import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";

/** The subset of DB User columns the session callback reads off the adapter user. */
interface SessionDbUser {
  id: string;
  orcid?: string | null;
  researchConsent?: boolean;
}

/**
 * Prisma adapter, patched for ORCID. Two reasons:
 *  1. ORCID access tokens expire ~20 years out, so Auth.js's computed
 *     `expires_at` (epoch seconds, ~2.4e9) overflows the 32-bit
 *     `Account.expires_at` Int column.
 *  2. We never use the provider tokens after sign-in — publications come from
 *     the public OpenAlex API via the iD, and sessions are database-backed
 *     (no JWT). So we DROP the access/refresh/id tokens entirely rather than
 *     persist long-lived bearer credentials unencrypted at rest (defence in
 *     depth: a leaked DATABASE_URL / stolen backup then yields no usable token).
 */
const adapter = PrismaAdapter(prisma);
const baseLinkAccount = adapter.linkAccount;
if (baseLinkAccount) {
  adapter.linkAccount = (account) =>
    baseLinkAccount({
      ...account,
      access_token: undefined,
      refresh_token: undefined,
      id_token: undefined,
      expires_at: undefined,
    });
}

/**
 * Full Auth.js setup: edge-safe `authConfig` + Prisma adapter + database
 * sessions. Runs in the Node runtime (route handlers / server components),
 * so it can read the database when validating sessions.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter,
  session: { strategy: "database" },
  trustHost: true,
  events: {
    // The ORCID provider's `providerAccountId` IS the ORCID iD. Persist it onto
    // the user row so it's queryable (and used for OpenAlex resolution).
    async signIn({ user, account }) {
      if (
        account?.provider === "orcid" &&
        user.id &&
        account.providerAccountId
      ) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { orcid: normalizeOrcid(account.providerAccountId) },
          });
        } catch (err) {
          logger.error("auth.persist_orcid_failed", { err });
        }
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    session({ session, user }) {
      // With the database strategy, `user` is the full DB row including our
      // custom columns (orcid, researchConsent).
      if (session.user) {
        const dbUser = user as SessionDbUser;
        session.user.id = dbUser.id;
        session.user.orcid = dbUser.orcid ?? null;
        session.user.researchConsent = dbUser.researchConsent ?? false;
      }
      return session;
    },
  },
});
