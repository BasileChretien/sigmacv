/**
 * A curated catalog of common CSL citation styles for the "add a style"
 * autocomplete. The `id` is the canonical CSL/Zotero style id (what resolves);
 * the `title` is the friendly label shown in the dropdown.
 *
 * This is intentionally a SUBSET (the repository has ~2,600 styles) — it covers
 * the styles most researchers reach for. Anything not listed still works: the
 * input is normalised (e.g. "Nature Medicine" → nature-medicine) and resolved
 * live from the Zotero/CSL repository.
 */
export interface CslStyleOption {
  id: string;
  title: string;
}

export const CSL_STYLE_CATALOG: CslStyleOption[] = [
  // General / multidisciplinary
  { id: "apa", title: "APA (7th edition)" },
  { id: "modern-language-association", title: "MLA (9th edition)" },
  { id: "chicago-author-date", title: "Chicago (author–date)" },
  { id: "chicago-note-bibliography", title: "Chicago (notes & bibliography)" },
  { id: "chicago-fullnote-bibliography", title: "Chicago (full note)" },
  { id: "turabian-author-date", title: "Turabian (author–date)" },
  { id: "harvard-cite-them-right", title: "Harvard (Cite Them Right)" },
  { id: "elsevier-harvard", title: "Elsevier (Harvard)" },
  { id: "elsevier-vancouver", title: "Elsevier (Vancouver)" },
  { id: "elsevier-with-titles", title: "Elsevier (numeric, with titles)" },
  { id: "springer-basic-author-date", title: "Springer (author–date)" },
  { id: "springer-vancouver", title: "Springer (Vancouver)" },
  { id: "sage-vancouver", title: "SAGE (Vancouver)" },
  { id: "sage-harvard", title: "SAGE (Harvard)" },
  { id: "taylor-and-francis-national-library-of-medicine", title: "Taylor & Francis (NLM)" },
  { id: "ieee", title: "IEEE" },
  { id: "vancouver", title: "Vancouver" },
  { id: "vancouver-superscript", title: "Vancouver (superscript)" },
  { id: "council-of-science-editors-author-date", title: "Council of Science Editors (author–date)" },
  { id: "american-medical-association", title: "AMA (American Medical Association)" },

  // Multidisciplinary flagship journals
  { id: "nature", title: "Nature" },
  { id: "nature-medicine", title: "Nature Medicine" },
  { id: "nature-genetics", title: "Nature Genetics" },
  { id: "nature-biotechnology", title: "Nature Biotechnology" },
  { id: "nature-communications", title: "Nature Communications" },
  { id: "science", title: "Science" },
  { id: "science-advances", title: "Science Advances" },
  { id: "cell", title: "Cell" },
  { id: "cell-press", title: "Cell Press" },
  { id: "proceedings-of-the-national-academy-of-sciences", title: "PNAS" },
  { id: "plos-one", title: "PLOS ONE" },
  { id: "plos", title: "PLOS (combined)" },
  { id: "elife", title: "eLife" },
  { id: "the-lancet", title: "The Lancet" },

  // Medicine / clinical / pharmacology
  { id: "bmj", title: "BMJ" },
  { id: "new-england-journal-of-medicine", title: "New England Journal of Medicine" },
  { id: "the-journal-of-the-american-medical-association", title: "JAMA" },
  { id: "jama", title: "JAMA (dependent)" },
  { id: "annals-of-internal-medicine", title: "Annals of Internal Medicine" },
  { id: "plos-medicine", title: "PLOS Medicine" },
  { id: "british-journal-of-pharmacology", title: "British Journal of Pharmacology" },
  { id: "clinical-pharmacology-and-therapeutics", title: "Clinical Pharmacology & Therapeutics" },
  { id: "british-journal-of-clinical-pharmacology", title: "British Journal of Clinical Pharmacology" },
  { id: "european-journal-of-clinical-pharmacology", title: "European Journal of Clinical Pharmacology" },
  { id: "pharmacoepidemiology-and-drug-safety", title: "Pharmacoepidemiology & Drug Safety" },
  { id: "drug-safety", title: "Drug Safety" },
  { id: "fundamental-and-clinical-pharmacology", title: "Fundamental & Clinical Pharmacology" },
  { id: "national-library-of-medicine", title: "National Library of Medicine (NLM)" },

  // Life sciences / biology
  { id: "molecular-biology-and-evolution", title: "Molecular Biology and Evolution" },
  { id: "bioinformatics", title: "Bioinformatics" },
  { id: "genetics", title: "Genetics" },
  { id: "journal-of-biological-chemistry", title: "Journal of Biological Chemistry" },
  { id: "embo-journal", title: "The EMBO Journal" },
  { id: "frontiers", title: "Frontiers" },
  { id: "frontiers-in-immunology", title: "Frontiers in Immunology" },
  { id: "mdpi", title: "MDPI" },
  { id: "bmc-bioinformatics", title: "BMC (BioMed Central)" },

  // Chemistry
  { id: "american-chemical-society", title: "American Chemical Society (ACS)" },
  { id: "royal-society-of-chemistry", title: "Royal Society of Chemistry (RSC)" },
  { id: "angewandte-chemie", title: "Angewandte Chemie" },

  // Physics / engineering / CS
  { id: "american-physics-society", title: "American Physical Society (APS)" },
  { id: "american-institute-of-physics", title: "American Institute of Physics (AIP)" },
  { id: "aps-physical-review", title: "Physical Review" },
  { id: "institute-of-physics-numeric", title: "Institute of Physics (numeric)" },
  { id: "association-for-computing-machinery", title: "ACM" },
  { id: "springer-lecture-notes-in-computer-science", title: "Springer LNCS" },

  // Social sciences / humanities / economics
  { id: "american-sociological-association", title: "American Sociological Association (ASA)" },
  { id: "american-political-science-association", title: "American Political Science Association (APSA)" },
  { id: "american-psychological-association", title: "APA (American Psychological Association)" },
  { id: "chicago-annotated-bibliography", title: "Chicago (annotated bibliography)" },
  { id: "american-economic-association", title: "American Economic Association" },
  { id: "the-american-economic-review", title: "American Economic Review" },
  { id: "harvard-educational-review", title: "Harvard Educational Review" },
];
