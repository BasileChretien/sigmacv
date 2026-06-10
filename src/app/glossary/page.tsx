import type { Metadata } from "next";
import GlossaryIndex, {
  GLOSSARY_INDEX_DESCRIPTION,
  GLOSSARY_INDEX_TITLE,
} from "@/components/GlossaryIndex";

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: GLOSSARY_INDEX_TITLE,
  description: GLOSSARY_INDEX_DESCRIPTION,
  alternates: { canonical: "/glossary" },
};

export default function GlossaryPage() {
  return <GlossaryIndex />;
}
