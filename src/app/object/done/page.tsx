import type { Metadata } from "next";
import ObjectionDone from "@/components/ObjectionDone";
import { parseObjectionOutcome } from "@/lib/auth/objectionOutcome";
import { objectionStrings } from "@/lib/i18n/objection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: objectionStrings("en-US").metaTitle,
  // The landing of a personal round trip: never indexed.
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ObjectDonePage({ searchParams }: Props) {
  const q = await searchParams;
  return <ObjectionDone locale="en-US" outcome={parseObjectionOutcome(q.outcome)} />;
}
