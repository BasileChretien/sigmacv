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
 * never the user id; only consenting users and only pre-registered event types
 * are read; payloads are the already-minimized signals from `diff.ts`.
 *
 * Usage (run by the study team, with the real .env):
 *   npm run research:export               # writes JSONL into ./research-export/
 *   npm run research:export -- --dry-run  # counts only; writes nothing
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildKeyTable,
  buildResearchExport,
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
  // inert (no DB connection). `export.ts` itself is pure (node:crypto only), so
  // it is safe to import statically above.
  const { prisma } = await import("@/lib/db");

  try {
    // Only consenting users. The identity fields are read solely to build the
    // separate re-identification key table (対照表); the de-identified dataset
    // never sees them.
    const users = await prisma.user.findMany({
      where: { researchConsent: true },
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
      },
    });

    const subjects: ResearchSubjectInput[] = users.map((u) => ({
      userId: u.id,
      researchConsent: true,
      researchConsentVersion: u.researchConsentVersion,
      identity: { name: u.name, email: u.email, orcid: u.orcid, consentAt: u.researchConsentAt },
      events: u.researchEvents,
    }));

    const rows = buildResearchExport(subjects, gate.salt);
    const keyRows = buildKeyTable(subjects, gate.salt);

    console.log(`IRB ref:                 ${gate.irbRef}`);
    console.log(`consenting subjects:     ${subjects.length}`);
    console.log(`exported rows:           ${rows.length}`);

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
