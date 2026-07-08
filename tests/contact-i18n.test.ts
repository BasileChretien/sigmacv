import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { CONTACT_EMAIL, contactStrings } from "@/lib/i18n/contact";

describe("contactStrings", () => {
  it("localizes the contact page and falls back to English", () => {
    expect(contactStrings("en-US").heading).toBe("Contact");
    expect(contactStrings("fr-FR").metaTitle).toBe("Contact — assistance, retours et questions");
    expect(contactStrings("ja-JP").heading).toBe("お問い合わせ");
    expect(contactStrings("xx-XX").heading).toBe(contactStrings("en-US").heading);
  });

  it("has every field non-empty for all 10 locales and names the controller", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = contactStrings(loc);
      for (const value of Object.values(s)) {
        expect(value.length).toBeGreaterThan(0);
      }
      // The data controller must be named on the contact page in every locale.
      expect(s.intro).toContain("Basile Chrétien");
    }
  });

  it("publishes the project data-controller contact address", () => {
    expect(CONTACT_EMAIL).toBe("privacy@sigmacv.org");
  });
});
