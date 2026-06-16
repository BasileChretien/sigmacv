import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import {
  getCvForUser,
  getLastSyncReport,
  getLastSyncedAt,
  getPublishState,
  isStaleSince,
  syncCvForUser,
} from "@/lib/cv/sync";
import type { SyncReport } from "@/lib/cv/syncReport";
import { getDigestPrefs } from "@/lib/email/digest";
import { logger } from "@/lib/log";
import { isResearchLoggingEnabled } from "@/lib/research/enabled";
import CvWorkspace from "@/components/CvWorkspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CvPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  let cv = await getCvForUser(session.user.id);
  let syncReport: SyncReport | null = null;
  // Distinguishes "the first auto-sync failed" from "you legitimately have no CV
  // yet" so the client can show a retryable error state, not the empty state.
  let initialSyncFailed = false;
  // When true, the client refreshes from the sources in the BACKGROUND after the
  // (cached) CV renders — a freshness-gated "sync on connect". The first-visit
  // path below already synced fresh, so it stays false there.
  let autoSync = false;

  // First visit: auto-populate from OpenAlex so the user sees a CV immediately.
  if (!cv && session.user.orcid) {
    try {
      const result = await syncCvForUser({
        userId: session.user.id,
        orcid: session.user.orcid,
        fallbackName: session.user.name ?? "",
      });
      cv = result.cv;
      syncReport = result.report;
    } catch (err) {
      logger.error("cv.initial_sync_failed", { err });
      initialSyncFailed = true;
    }
  } else {
    // Returning visit: show what the last (manual or scheduled) sync changed, and
    // auto-refresh in the background if the CV has gone stale (> ~12h).
    syncReport = await getLastSyncReport(session.user.id);
    autoSync = isStaleSince(await getLastSyncedAt(session.user.id), Date.now());
  }

  const availableStyles = listAvailableStyles();
  const publish = await getPublishState(session.user.id);
  const digestPrefs = await getDigestPrefs(session.user.id);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <CvWorkspace
      initialCv={cv}
      initialSyncReport={syncReport}
      initialSyncFailed={initialSyncFailed}
      autoSyncOnLoad={autoSync}
      availableStyles={availableStyles}
      userName={session.user.name ?? session.user.orcid ?? "Researcher"}
      researchConsent={session.user.researchConsent ?? false}
      digestOptIn={digestPrefs.optIn}
      digestContactEmail={digestPrefs.contactEmail}
      digestContactEmailVerified={digestPrefs.contactEmailVerified}
      accountEmail={digestPrefs.accountEmail}
      researchEnabled={isResearchLoggingEnabled()}
      published={publish.published}
      publicSlug={publish.publicSlug}
      publicIndexable={publish.indexable}
      signOutAction={handleSignOut}
    />
  );
}
