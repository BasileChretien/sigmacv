import type { Metadata } from "next";
import GuidesIndex, {
  GUIDES_INDEX_DESCRIPTION,
  GUIDES_INDEX_TITLE,
} from "@/components/GuidesIndex";

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: GUIDES_INDEX_TITLE,
  description: GUIDES_INDEX_DESCRIPTION,
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return <GuidesIndex />;
}
