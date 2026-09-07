import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { withdrawnStrings } from "@/lib/i18n/withdrawn";
import { WITHDRAWN_PATH } from "@/lib/datacite/mint";

// The shared chrome pulls in client islands (router hooks); the page under test
// is the tombstone body, so stub the header/footer.
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/components/SiteFooter", () => ({ default: () => null }));

import Withdrawn from "@/components/Withdrawn";
import { metadata } from "@/app/withdrawn/page";
import WithdrawnPage from "@/app/withdrawn/page";
import LocaleWithdrawnPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/[locale]/withdrawn/page";

describe("withdrawnStrings", () => {
  it("localizes the tombstone page and falls back to English", () => {
    expect(withdrawnStrings("en-US").heading).toBe("This version was withdrawn by its owner");
    expect(withdrawnStrings("fr-FR").heading).not.toBe(withdrawnStrings("en-US").heading);
    expect(withdrawnStrings("xx-XX")).toEqual(withdrawnStrings("en-US"));
  });

  it("has every field non-empty, and explains the DOI state, for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = withdrawnStrings(loc);
      for (const value of Object.values(s)) expect(value.length, loc).toBeGreaterThan(0);
      expect(s.body, loc).toContain("DOI");
      expect(s.body, loc).toContain("DataCite");
    }
  });

  it("says only that the version was withdrawn by its owner — never why (no 'deleted their account')", () => {
    // Per-locale marker for "account": the tombstone must not disclose that the
    // owner deleted their account, only that they withdrew the version.
    const account: Record<string, string> = {
      "en-US": "account",
      "zh-CN": "账户",
      "es-ES": "cuenta",
      "fr-FR": "compte",
      "de-DE": "Konto",
      "ja-JP": "アカウント",
      "pt-BR": "sua conta",
      "it-IT": "account",
      "ko-KR": "계정",
      "ru-RU": "учётную запись",
    };
    for (const loc of SUPPORTED_LOCALES) {
      const s = withdrawnStrings(loc);
      expect(s.body, loc).not.toContain(account[loc]);
    }
    expect(withdrawnStrings("en-US").body).toContain("withdrawn by its owner");
  });

  it("actually translates non-English locales", () => {
    const en = withdrawnStrings("en-US");
    for (const loc of SUPPORTED_LOCALES.filter((l) => l !== "en-US")) {
      expect(withdrawnStrings(loc).body, loc).not.toBe(en.body);
    }
  });
});

describe("the /withdrawn tombstone page", () => {
  it("lives at a stable path that cannot collide with a public CV (/p/[slug])", () => {
    expect(WITHDRAWN_PATH).not.toMatch(/^p\//);
    expect(metadata.alternates?.canonical).toBe(`/${WITHDRAWN_PATH}`);
  });

  it("is noindex (a tombstone is for DOI resolvers, not search)", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.title).toBe(withdrawnStrings("en-US").metaTitle);
  });

  it("renders the localized withdrawal notice with the language on the subtree", () => {
    const html = renderToStaticMarkup(<Withdrawn locale="ja-JP" />);
    expect(html).toContain('lang="ja-JP"');
    expect(html).toContain(withdrawnStrings("ja-JP").heading);
    expect(html).toContain(withdrawnStrings("ja-JP").body);
    expect(html).toContain('href="/ja"');
  });

  it("the default route renders English and the localized route renders its locale", async () => {
    expect(renderToStaticMarkup(WithdrawnPage())).toContain(withdrawnStrings("en-US").heading);
    const params = Promise.resolve({ locale: "fr" });
    const page = await LocaleWithdrawnPage({ params });
    expect(renderToStaticMarkup(page)).toContain(withdrawnStrings("fr-FR").heading);
    const meta = await generateMetadata({ params });
    expect(meta.title).toBe(withdrawnStrings("fr-FR").metaTitle);
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(await generateMetadata({ params: Promise.resolve({ locale: "xx" }) })).toEqual({});
    expect(generateStaticParams().map((p) => p.locale)).toContain("fr");
    expect(generateStaticParams().map((p) => p.locale)).not.toContain("en");
  });

  it("404s an unknown or default-locale slug on the localized route", async () => {
    for (const locale of ["xx", "en"]) {
      await expect(LocaleWithdrawnPage({ params: Promise.resolve({ locale }) })).rejects.toThrow();
    }
  });
});
