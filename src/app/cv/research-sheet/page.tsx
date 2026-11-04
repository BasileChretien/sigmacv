import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import InformationSheet from "@/components/InformationSheet";
import PrintButton from "@/components/PrintButton";
import { prisma } from "@/lib/db";
import { researchPanelStrings } from "@/lib/i18n/researchPanel";
import { consentText } from "@/lib/research/consent";
import { isResearchLoggingEnabled } from "@/lib/research/enabled";
import { sheetPageModel } from "@/lib/research/consent/sheetPage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Information sheet · SigmaCV",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ lang?: string | string[]; ui?: string | string[] }> };

/**
 * The approved information sheet of study 2026-0310 with the signed-in
 * user's consent record beneath it, laid out for printing or saving as PDF
 * (別添1 §5). Opened from the research panel; owner-only, never indexed.
 * While the study is closed it exists only for someone with a record, who can
 * still re-read and print what they agreed to.
 */
export default async function ResearchSheetPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const records = await prisma.researchConsentRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { at: "asc" },
    take: 1_000,
    select: {
      action: true,
      at: true,
      version: true,
      locale: true,
      agreeRequired: true,
      secondaryUse: true,
    },
  });
  if (records.length === 0 && !isResearchLoggingEnabled()) notFound();
  const model = sheetPageModel(await searchParams, records);
  const s = researchPanelStrings(model.uiLocale);
  return (
    <main className="research-sheet-page">
      <div className="research-sheet-actions" lang={model.uiLocale}>
        <PrintButton label={s.print} />
      </div>
      <article lang={model.textLocale}>
        <InformationSheet sheet={consentText(model.textLocale).sheet} level={1} />
      </article>
      <section className="research-sheet-record" lang={model.uiLocale}>
        <h2>{s.recordHeading}</h2>
        {model.rows.length === 0 ? (
          <p>{s.recordNone}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">{s.recordDate}</th>
                <th scope="col">{s.recordAction}</th>
                <th scope="col">{s.recordDocument}</th>
                <th scope="col">{s.recordLanguage}</th>
                <th scope="col">{s.recordSecondary}</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.at}</td>
                  <td>{row.action}</td>
                  <td>{row.document}</td>
                  <td>{row.language}</td>
                  <td>{row.secondaryUse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
