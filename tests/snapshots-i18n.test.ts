import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { privacyStrings } from "@/lib/i18n/privacy";
import { snapshotStrings, type SnapshotStrings } from "@/lib/i18n/snapshots";

const KEYS = Object.keys(snapshotStrings("en-US")) as (keyof SnapshotStrings)[];

describe("snapshot i18n", () => {
  it("defines complete copy for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    expect(KEYS.length).toBeGreaterThan(30);
    for (const loc of SUPPORTED_LOCALES) {
      const s = snapshotStrings(loc);
      for (const k of KEYS) expect(s[k].length, `${loc}.${k}`).toBeGreaterThan(0);
    }
  });

  it("keeps the placeholders in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = snapshotStrings(loc);
      expect(s.limitReached).toContain("{n}");
      expect(s.versionTag).toContain("{n}");
      expect(s.bannerFrozen).toContain("{n}");
      expect(s.bannerFrozen).toContain("{date}");
      expect(s.diffTitle).toContain("{n}");
      expect(s.diffIntro).toContain("{n}");
      expect(s.diffIntro).toContain("{date}");
      expect(s.diffWords).toContain("{before}");
      expect(s.diffWords).toContain("{after}");
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(snapshotStrings("xx-XX")).toEqual(snapshotStrings("en-US"));
  });

  it("actually translates non-English locales", () => {
    const en = snapshotStrings("en-US");
    for (const loc of SUPPORTED_LOCALES.filter((l) => l !== "en-US")) {
      const s = snapshotStrings(loc);
      expect(s.panelIntro, loc).not.toBe(en.panelIntro);
      expect(s.diffTitle, loc).not.toBe(en.diffTitle);
    }
  });

  it("carries the per-mint consent copy, naming DataCite as the independent controller, in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = snapshotStrings(loc);
      expect(s.mintConsentText, loc).toContain("DataCite");
      expect(s.mintConsentText, loc).toContain("ORCID");
      expect(s.mintConsentLabel.length, loc).toBeGreaterThan(0);
      expect(s.mintNeedsConsent.length, loc).toBeGreaterThan(0);
    }
  });

  it("names what the DataCite record actually holds (affiliation, work DOIs, funder / award ids) in the consent text AND both privacy sentences, in every locale", () => {
    // The payload sends the creator's affiliation, the shown works' DOIs and the
    // grants' funder / award identifiers — the consent and the notice must say
    // so, not just "name, ORCID iD and link". Per-locale marker for "affiliation".
    const affiliation: Record<string, string> = {
      "en-US": "affiliation",
      "zh-CN": "所属机构",
      "es-ES": "afiliación",
      "fr-FR": "affiliation",
      "de-DE": "Zugehörigkeit",
      "ja-JP": "所属",
      "pt-BR": "afiliação",
      "it-IT": "affiliazione",
      "ko-KR": "소속",
      "ru-RU": "аффилиаци",
    };
    for (const loc of SUPPORTED_LOCALES) {
      const s = snapshotStrings(loc);
      const p = privacyStrings(loc);
      for (const [name, text] of [
        ["mintConsentText", s.mintConsentText],
        ["privacy.data", p.data],
        ["privacy.sharing", p.sharing],
      ] as const) {
        expect(text, `${loc}.${name}`).toContain(affiliation[loc]);
        // The works' DOIs are named alongside the record's own DOI: at least two mentions.
        expect(text.split("DOI").length - 1, `${loc}.${name}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("carries the 'cannot delete a minted version' hint in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = snapshotStrings(loc);
      expect(s.deleteLockedHint, loc).toContain("DOI");
      expect(s.deleteLockedHint, loc).not.toBe(s.actionFailed);
    }
  });

  it("the privacy notice describes minted DOI records as withdrawn (not deleted), with DataCite as controller, in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const p = privacyStrings(loc);
      // The "deleted with the rest of your data" sentence now carves out minted DOI records.
      expect(p.data, loc).toContain("DOI");
      // The recipients section names DataCite as an independent controller of the DOI record.
      expect(p.sharing, loc).toContain("DataCite");
      expect(p.sharing, loc).toContain("DOI");
      expect(p.sharing.indexOf("DOI"), loc).toBeGreaterThan(p.sharing.indexOf("SMTP2GO"));
    }
  });

  it("the privacy notice mentions frozen versions (and that private notes stay out) in every locale", () => {
    // Per-locale marker from the appended sentence ("private notes" in each language).
    const marker: Record<string, string> = {
      "en-US": "private notes",
      "zh-CN": "私人笔记",
      "es-ES": "notas privadas",
      "fr-FR": "notes privées",
      "de-DE": "privaten Notizen",
      "ja-JP": "非公開メモ",
      "pt-BR": "notas privadas",
      "it-IT": "note private",
      "ko-KR": "비공개 메모",
      "ru-RU": "приватных заметок",
    };
    for (const loc of SUPPORTED_LOCALES) {
      expect(privacyStrings(loc).data, loc).toContain(marker[loc]);
    }
  });
});

describe("CvSnapshot lifecycle (schema + migration)", () => {
  const root = process.cwd();
  const schema = readFileSync(path.join(root, "prisma", "schema.prisma"), "utf8");
  const migration = readFileSync(
    path.join(root, "prisma", "migrations", "20260904120000_cv_snapshots", "migration.sql"),
    "utf8",
  );

  it("cascade-deletes with the CV (and so with the account) in both the schema and the SQL", () => {
    const model = /model CvSnapshot \{([\s\S]*?)\n\}/.exec(schema)![1]!;
    expect(model).toMatch(
      /cv\s+Cv\s+@relation\(fields: \[cvId\], references: \[id\], onDelete: Cascade\)/,
    );
    expect(migration).toContain('REFERENCES "Cv"("id") ON DELETE CASCADE');
    // And the Cv → User edge is itself a cascade, so account deletion reaches snapshots.
    const cv = /model Cv \{([\s\S]*?)\n\}/.exec(schema)![1]!;
    expect(cv).toMatch(/onDelete: Cascade/);
    expect(cv).toContain("snapshots CvSnapshot[]");
  });

  it("adds the assessment-grade columns (ledger, content hash, reader choice) in schema + SQL", () => {
    const model = /model CvSnapshot \{([\s\S]*?)\n\}/.exec(schema)![1]!;
    expect(model).toMatch(/ledger\s+Json\?/);
    expect(model).toMatch(/contentHash\s+String\?/);
    expect(model).toMatch(/readerMode\s+Boolean\s+@default\(false\)/);
    const alter = readFileSync(
      path.join(
        root,
        "prisma",
        "migrations",
        "20260907120000_cv_snapshot_assessment",
        "migration.sql",
      ),
      "utf8",
    );
    expect(alter).toContain('ALTER TABLE "CvSnapshot" ADD COLUMN "ledger" JSONB;');
    expect(alter).toContain('ALTER TABLE "CvSnapshot" ADD COLUMN "contentHash" TEXT;');
    expect(alter).toContain(
      'ALTER TABLE "CvSnapshot" ADD COLUMN "readerMode" BOOLEAN NOT NULL DEFAULT false;',
    );
  });

  it("gives the capability token a unique index and versions a per-CV unique index", () => {
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "CvSnapshot_token_key" ON "CvSnapshot"("token")',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "CvSnapshot_cvId_version_key" ON "CvSnapshot"("cvId", "version")',
    );
  });
});
