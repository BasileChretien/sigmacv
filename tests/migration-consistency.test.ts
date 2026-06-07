import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Migration ⇄ schema consistency.
 *
 * The dev DB is push-managed, but production applies the SQL under
 * prisma/migrations via `prisma migrate deploy`. If a model / field / index is
 * added to schema.prisma but no migration is written, dev works yet a fresh
 * prod deploy gets a table that's missing the column/index — the exact drift
 * this guards against (CLAUDE.md: "migration files are kept consistent with the
 * schema by tests").
 *
 * Pure + offline: it parses the Prisma schema and the cumulative migration DDL
 * as text (no database, no Prisma CLI) and asserts every model, scalar column,
 * primary key and declared index is reflected in the migrations.
 */

const ROOT = process.cwd();
const SCHEMA = readFileSync(path.join(ROOT, "prisma", "schema.prisma"), "utf8");
const MIGRATIONS_DIR = path.join(ROOT, "prisma", "migrations");

const PRISMA_SCALARS = new Set([
  "String",
  "Int",
  "BigInt",
  "Boolean",
  "DateTime",
  "Json",
  "Float",
  "Decimal",
  "Bytes",
]);

interface ModelIndex {
  columns: string[];
  unique: boolean;
}
interface ParsedModel {
  name: string;
  columns: string[];
  pk: string[]; // [] when the model has no @id / @@id
  indexes: ModelIndex[]; // @@index / @@unique / field @unique
}

/** Parse schema.prisma → models with their scalar columns, PK and indexes. */
function parseSchema(src: string): ParsedModel[] {
  const blocks = [...src.matchAll(/model\s+(\w+)\s*\{([^}]*)\}/g)];
  const modelNames = new Set(blocks.map((b) => b[1] as string));
  return blocks.map(([, name, body]) => {
    const columns: string[] = [];
    const indexes: ModelIndex[] = [];
    let pk: string[] = [];
    for (const raw of (body as string).split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("//")) continue;
      const cols = (m: RegExpMatchArray | null) =>
        m
          ? (m[1] as string)
              .split(",")
              .map((c) => c.trim().replace(/^"|"$/g, ""))
              .filter(Boolean)
          : [];
      if (line.startsWith("@@")) {
        if (line.startsWith("@@id")) pk = cols(line.match(/@@id\(\[([^\]]*)\]/));
        else if (line.startsWith("@@unique"))
          indexes.push({ columns: cols(line.match(/@@unique\(\[([^\]]*)\]/)), unique: true });
        else if (line.startsWith("@@index"))
          indexes.push({ columns: cols(line.match(/@@index\(\[([^\]]*)\]/)), unique: false });
        continue;
      }
      const field = line.match(/^(\w+)\s+([\w[\]?]+)/);
      if (!field) continue;
      const [, fieldName, fieldType] = field as unknown as [string, string, string];
      const typeBase = fieldType.replace(/[[\]?]/g, "");
      // Relation fields (type is another model) don't become columns.
      if (modelNames.has(typeBase)) continue;
      if (!PRISMA_SCALARS.has(typeBase)) continue; // unknown (e.g. enum) — ignore
      columns.push(fieldName);
      if (/(?<!@)@id\b/.test(line)) pk = [fieldName];
      if (/(?<!@)@unique\b/.test(line)) indexes.push({ columns: [fieldName], unique: true });
    }
    return { name: name as string, columns, pk, indexes };
  });
}

interface ParsedTable {
  columns: Set<string>;
  pk: string[];
}

/** Parse the cumulative migration SQL → tables (cols + PK) and indexes. */
function parseMigrations(): {
  tables: Map<string, ParsedTable>;
  indexes: Array<{ table: string; columns: string[]; unique: boolean }>;
} {
  const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const sql = dirs
    .map((d) => path.join(MIGRATIONS_DIR, d, "migration.sql"))
    .filter((p) => existsSync(p))
    .map((p) => readFileSync(p, "utf8"))
    .join("\n");

  const tables = new Map<string, ParsedTable>();
  const indexes: Array<{ table: string; columns: string[]; unique: boolean }> = [];

  for (const [, table, bodyRaw] of sql.matchAll(
    /CREATE TABLE "(\w+)"\s*\(([\s\S]*?)\);/g,
  )) {
    const columns = new Set<string>();
    let pk: string[] = [];
    for (const line of (bodyRaw as string).split("\n")) {
      const t = line.trim();
      const col = t.match(/^"(\w+)"\s+/);
      if (col) columns.add(col[1] as string);
      const pkm = t.match(/PRIMARY KEY \(([^)]*)\)/);
      if (pkm)
        pk = (pkm[1] as string)
          .split(",")
          .map((c) => c.trim().replace(/^"|"$/g, ""));
    }
    tables.set(table as string, { columns, pk });
  }

  for (const [, table, col] of sql.matchAll(
    /ALTER TABLE "(\w+)" ADD COLUMN "(\w+)"/g,
  )) {
    tables.get(table as string)?.columns.add(col as string);
  }

  for (const [, uniq, table, colList] of sql.matchAll(
    /CREATE (UNIQUE )?INDEX "[^"]+" ON "(\w+)"\s*\(([^)]*)\)/g,
  )) {
    indexes.push({
      table: table as string,
      columns: (colList as string)
        .split(",")
        .map((c) => c.trim().replace(/^"|"$/g, "")),
      unique: Boolean(uniq),
    });
  }

  return { tables, indexes };
}

const models = parseSchema(SCHEMA);
const { tables, indexes } = parseMigrations();

describe("prisma migrations match schema.prisma", () => {
  it("parses a sane number of models", () => {
    // Guards against the regex silently matching nothing (which would make
    // every per-model assertion vacuously pass).
    expect(models.length).toBeGreaterThanOrEqual(6);
    expect(models.map((m) => m.name)).toContain("OepEditorialRole");
  });

  it.each(models.map((m) => [m.name, m] as const))(
    "model %s has a CREATE TABLE with all its columns",
    (name, model) => {
      const table = tables.get(name);
      expect(table, `no CREATE TABLE for model "${name}"`).toBeDefined();
      for (const col of model.columns) {
        expect(
          table!.columns.has(col),
          `column "${col}" of "${name}" is not created by any migration`,
        ).toBe(true);
      }
    },
  );

  it.each(models.filter((m) => m.pk.length > 0).map((m) => [m.name, m] as const))(
    "model %s primary key is migrated",
    (name, model) => {
      expect(
        tables.get(name)!.pk,
        `PRIMARY KEY of "${name}" differs between schema and migration`,
      ).toEqual(model.pk);
    },
  );

  it.each(models.map((m) => [m.name, m] as const))(
    "every index declared on model %s exists in the migrations",
    (name, model) => {
      for (const idx of model.indexes) {
        const match = indexes.find(
          (mi) =>
            mi.table === name &&
            JSON.stringify(mi.columns) === JSON.stringify(idx.columns) &&
            (!idx.unique || mi.unique),
        );
        expect(
          match,
          `${idx.unique ? "unique " : ""}index on ${name}(${idx.columns.join(
            ", ",
          )}) has no matching CREATE INDEX in the migrations`,
        ).toBeDefined();
      }
    },
  );

  it("the OepEditorialRole table + its orcid index are migrated", () => {
    expect(tables.get("OepEditorialRole")?.columns).toContain("orcid");
    expect(
      indexes.some(
        (i) =>
          i.table === "OepEditorialRole" &&
          i.columns.length === 1 &&
          i.columns[0] === "orcid",
      ),
    ).toBe(true);
  });
});
