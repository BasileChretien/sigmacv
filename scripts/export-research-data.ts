/**
 * Offline researcher export of the consent-gated research dataset (papers #2/#3).
 *
 * ── DISABLED BY DEFAULT — safe to ship ──────────────────────────────────────
 * This refuses to run unless the IRB-approval env triad is set:
 *   RESEARCH_EXPORT_ENABLED=true
 *   RESEARCH_EXPORT_IRB_REF=<approval number>
 *   RESEARCH_EXPORT_PSEUDONYM_SALT=<secret, >=16 chars>
 * Until then it prints why it is off and exits non-zero — it does not even open
 * the database. Do NOT enable until the IRB protocol is approved and the export
 * fields are finalised to match the pre-registration.
 *
 * Properties: there is NO network route; subjects are pseudonymised (keyed HMAC),
 * never the user id; only users whose consent is at the current
 * RESEARCH_CONSENT_VERSION (2 = study 2026-0310 as approved; a version-1 consent
 * was the notice before approval) and only pre-registered event types are read;
 * payloads are the already-minimized signals from `diff.ts`. Each subject
 * carries checkbox ② (future related research) from their latest grant
 * ResearchConsentRecord at that version.
 *
 * Usage (run by the study team, with the real .env):
 *   npm run research:export               # writes JSONL into ./research-export/
 *   npm run research:export -- --dry-run  # counts only; writes nothing
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RESEARCH_CONSENT_VERSION } from "@/lib/research/consent";
import {
  buildKeyTable,
  buildResearchExport,
  exportableSubjects,
  researchExportGate,
  toJsonl,
  type ResearchSubjectInput,
} from "@/lib/research/export";

async function main(): Promise<void> {
  const gate = researchExportGate();
  if (!gate.enabled) {
    console.error("✋ Researcher export is DISABLED — nothing was read or written.");
    console.error(`   Reason: ${gate.reason}`);
    console.error("   This pipeline stays off until the IRB protocol is approved");
    console.error("   and the export fields are finalised to match pre-registration.");
    process.exitCode = 1;
    return;
  }

  const dryRun = process.argv.includes("--dry-run");

  // Load the DB only AFTER the gate passes, so the disabled path is completely
  // inert (no DB connection). `export.ts` and `consent/` are pure (no DB), so
  // they are safe to import statically above.
  const { prisma } = await import("@/lib/db");

  try {
    // Only users consenting under the current version: nothing given under an
    // older notice is even read (`exportableSubjects` applies the same rule
    // again). The identity fields are read solely to build the separate
    // re-identification key table (対照表); the de-identified dataset never
    // sees them.
    const users = await prisma.user.findMany({
      where: { researchConsent: true, researchConsentVersion: RESEARCH_CONSENT_VERSION },
      select: {
        id: true,
        name: true,
        email: true,
        orcid: true,
        researchConsentVersion: true,
        researchConsentAt: true,
        researchEvents: {
          select: { type: true, payload: true, createdAt: true },
        },
        // Checkbox ②, from the latest grant of this consent version.
        researchConsentRecords: {
          where: { action: "grant", version: RESEARCH_CONSENT_VERSION },
          orderBy: { at: "desc" },
          take: 1,
          select: { secondaryUse: true },
        },
      },
    });
    const allConsenting = await prisma.user.count({ where: { researchConsent: true } });

    const subjects = exportableSubjects(
      users.map((u): ResearchSubjectInput => ({
        userId: u.id,
        researchConsent: true,
        researchConsentVersion: u.researchConsentVersion,
        secondaryUse: u.researchConsentRecords[0]?.secondaryUse ?? null,
        identity: {
          name: u.name,
          email: u.email,
          orcid: u.orcid,
          consentAt: u.researchConsentAt,
        },
        events: u.researchEvents,
      })),
    );

    const rows = buildResearchExport(subjects, gate.salt);
    const keyRows = buildKeyTable(subjects, gate.salt);
    const agreedSecondary = subjects.filter((s) => s.secondaryUse === true).length;
    const noGrantRecord = subjects.filter((s) => s.secondaryUse === null).length;

    console.log(`IRB ref:                 ${gate.irbRef}`);
    console.log(`consent version:         ${RESEARCH_CONSENT_VERSION}`);
    console.log(`consenting subjects:     ${subjects.length}`);
    console.log(`  of which agreed to ②:  ${agreedSecondary}`);
    console.log(`older consent, skipped:  ${allConsenting - subjects.length}`);
    console.log(`exported rows:           ${rows.length}`);
    if (noGrantRecord > 0) {
      console.warn(
        `⚠️  ${noGrantRecord} subject(s) have no grant record at version ${RESEARCH_CONSENT_VERSION};`,
      );
      console.warn(
        "    their secondaryUse is null (read it as not agreed). Check the consent records.",
      );
    }

    if (dryRun) {
      console.log("dry run — nothing written.");
      return;
    }

    const outDir = "research-export";
    mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeRef = gate.irbRef.replace(/[^A-Za-z0-9_-]/g, "_");

    // (1) De-identified analysis dataset — given to the analyst.
    const dataPath = join(outDir, `research-dataset_${safeRef}_${stamp}.jsonl`);
    writeFileSync(dataPath, toJsonl(rows), "utf8");
    console.log(`wrote ${dataPath}  (de-identified — for the analyst)`);

    // (2) Re-identification key table (対照表) — IDENTIFYING. Held ONLY by the
    // personal-information manager; do NOT share with the analyst or commit it.
    const keyPath = join(outDir, `KEYTABLE-DO-NOT-SHARE_${safeRef}_${stamp}.jsonl`);
    writeFileSync(keyPath, toJsonl(keyRows), "utf8");
    console.log(`wrote ${keyPath}  (対照表 — IDENTIFYING; personal-information manager only)`);
    console.log(
      "⚠️  The KEYTABLE file re-identifies subjects. Keep it under access control\n" +
        "    (personal-information manager only); never give it to the analyst and\n" +
        "    never commit it. The analyst works from the de-identified dataset alone.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("export failed:", err);
  process.exitCode = 1;
});
