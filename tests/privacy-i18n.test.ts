import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { privacyStrings } from "@/lib/i18n/privacy";

describe("privacyStrings", () => {
  it("localizes the privacy notice and falls back to English", () => {
    expect(privacyStrings("en-US").heading).toBe("Privacy & Data Protection");
    expect(privacyStrings("fr-FR").heading).toBe("Confidentialité et protection des données");
    expect(privacyStrings("ja-JP").metaTitle).toBe("プライバシー");
    expect(privacyStrings("xx-XX").heading).toBe(privacyStrings("en-US").heading);
  });

  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(privacyStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("preserves brand/legal proper nouns in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = privacyStrings(loc);
      // Identity/legal anchors must survive translation.
      expect(s.controller).toContain("Basile Chrétien");
      expect(s.intro).toContain("GDPR");
      expect(s.intro).toContain("APPI");
      expect(s.data).toContain("OpenAlex");
      // The data list must name the registries queried by NAME + organisation.
      expect(s.data).toContain("ClinicalTrials.gov");
      expect(s.data).toContain("NIH RePORTER");
      // The preview paragraph: Art. 14(5)(b) (notice in lieu of individual
      // information), the legitimate-interest basis, and the objection address.
      expect(s.preview).toContain("Art. 14(5)(b)");
      expect(s.preview).toContain("Art. 6(1)(f)");
      expect(s.preview).toContain("privacy@sigmacv.org");
      // The lookup is disclosed where the preview is.
      expect(s.preview).toContain("/search");
      // The lookup's cache is disclosed as memory-only and short-lived, never as "nothing".
      expect(s.preview).not.toMatch(
        /stores nothing|no almacena nada|ne conserve rien|speichert nichts/,
      );
      // Non-users: the Art. 21 objection route with a 30-day promise.
      expect(s.nonUserRights).toContain("Art. 21");
      expect(s.nonUserRights).toContain("privacy@sigmacv.org");
      expect(s.nonUserRights).toContain("30");
      // The self-service route is named in every locale.
      expect(s.nonUserRights).toContain("/object");
      // The opt-in research clause must cite the consent legal basis.
      expect(s.research).toContain("Art. 6(1)(a)");
      // The AI-drafting disclosure must name the EU processor in every locale.
      expect(s.ai).toContain("Mistral AI");
      // The recipients paragraph must name OAI-PMH harvesters (repositories,
      // CRIS systems, aggregators) as recipients of an indexable page's
      // metadata, and the ROR affiliation listing as a separate opt-in —
      // appended AFTER the DataCite sentence it must not rewrite.
      expect(s.sharing).toContain("OAI-PMH");
      expect(s.sharing).toContain("CRIS");
      expect(s.sharing).toContain("ROR");
      expect(s.sharing.indexOf("DataCite")).toBeLessThan(s.sharing.indexOf("OAI-PMH"));
      // The institution page (/i/<ROR id>) is a further, separate opt-in —
      // appended AFTER the OAI-PMH sentence, naming ORCID iD among what appears.
      expect(s.sharing).toContain("/i/<ROR id>");
      expect(s.sharing.indexOf("/i/<ROR id>")).toBeGreaterThan(s.sharing.indexOf("OAI-PMH"));
      expect(s.sharing.slice(s.sharing.indexOf("/i/<ROR id>"))).toContain("ORCID iD");
    }
  });
});

describe("the OAI-PMH deleted records in the retention notice", () => {
  // A harvest of an institution set names that set on each deleted record, so
  // the notice must say so, in every locale, and never claim "nothing else"
  // (review of #561).
  const NAMES_THE_SET: Record<string, string> = {
    "en-US": "in a harvest of an institution set it has left, that set",
    "zh-CN": "回应该集合",
    "es-ES": "ese conjunto",
    "fr-FR": "cet ensemble",
    "de-DE": "diesem Set",
    "ja-JP": "そのセットも返します",
    "pt-BR": "esse conjunto",
    "it-IT": "quel set",
    "ko-KR": "그 세트도",
    "ru-RU": "этим набором",
  };

  it("states the 30 days, and that a set harvest names the set, in every locale", () => {
    for (const [loc, phrase] of Object.entries(NAMES_THE_SET)) {
      const retention = privacyStrings(loc).retention;
      expect(retention, loc).toContain("OAI-PMH");
      expect(retention, loc).toMatch(/30/);
      expect(retention, loc).toContain(phrase);
    }
    expect(privacyStrings("en-US").retention).not.toContain("nothing else");
  });
});
