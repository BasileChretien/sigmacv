import type { Metadata } from "next";
import Link from "next/link";
import SiteLinks from "@/components/SiteLinks";

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: "About",
  description:
    "SigmaCV is open infrastructure for responsible research assessment — academic CVs auto-generated from open research data.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="doc-page">
      <h1>About SigmaCV</h1>

      <p>
        SigmaCV is open infrastructure for{" "}
        <strong>responsible research assessment</strong>. It auto-generates
        clean, customizable academic CVs from open research data — OpenAlex,
        ORCID, Crossref, DataCite and Open Editors Plus — so your CV stays in
        sync with the open record. Free for individuals and open source
        (Apache-2.0).
      </p>

      <p>
        Your data stays yours: SigmaCV reads only public research metadata,
        matches your work by identifier (never by name), and never logs your
        choices without explicit consent.
      </p>

      <h2>Who&apos;s behind it</h2>
      <p>
        SigmaCV is built and maintained by <strong>Basile Chrétien</strong>{" "}
        (PharmD, MSc, MPH), a pharmacist and researcher in pharmacovigilance and
        clinical pharmacology. Contributions and feedback are welcome on GitHub.
      </p>

      <SiteLinks className="site-links about-links" />

      <p className="doc-back muted">
        <Link href="/">← Back to SigmaCV</Link>
      </p>
    </main>
  );
}
