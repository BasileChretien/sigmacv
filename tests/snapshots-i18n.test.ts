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

  it("gives the capability token a unique index and versions a per-CV unique index", () => {
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "CvSnapshot_token_key" ON "CvSnapshot"("token")',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "CvSnapshot_cvId_version_key" ON "CvSnapshot"("cvId", "version")',
    );
  });
});
