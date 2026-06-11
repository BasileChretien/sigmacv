import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { getCvForUser, getLastSyncReport, getPublishState, syncCvForUser } from "@/lib/cv/sync";
import type { SyncReport } from "@/lib/cv/syncReport";
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
    }
  } else {
    // Returning visit: show what the last (manual or scheduled) sync changed.
    syncReport = await getLastSyncReport(session.user.id);
  }

  const availableStyles = listAvailableStyles();
  const publish = await getPublishState(session.user.id);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <CvWorkspace
      initialCv={cv}
      initialSyncReport={syncReport}
      availableStyles={availableStyles}
      userName={session.user.name ?? session.user.orcid ?? "Researcher"}
      researchConsent={session.user.researchConsent ?? false}
      researchEnabled={isResearchLoggingEnabled()}
      published={publish.published}
      publicSlug={publish.publicSlug}
      publicIndexable={publish.indexable}
      signOutAction={handleSignOut}
    />
  );
}
