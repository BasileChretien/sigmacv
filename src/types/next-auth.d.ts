import type { DefaultSession } from "next-auth";

// Extend the Auth.js session user with SigmaCV's custom fields.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Bare ORCID iD, e.g. 0000-0002-7483-2489. */
      orcid?: string | null;
      researchConsent?: boolean;
    } & DefaultSession["user"];
  }
}
