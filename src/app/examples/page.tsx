import type { Metadata } from "next";
import ExamplesIndex, {
  EXAMPLES_INDEX_DESCRIPTION,
  EXAMPLES_INDEX_TITLE,
} from "@/components/ExamplesIndex";

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: EXAMPLES_INDEX_TITLE,
  description: EXAMPLES_INDEX_DESCRIPTION,
  alternates: { canonical: "/examples" },
};

export default function ExamplesPage() {
  return <ExamplesIndex />;
}
