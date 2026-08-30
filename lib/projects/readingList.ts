/**
 * The Unflattening reading list: the six foundational texts (Suvin, Dunne &
 * Raby, Willis, Fry, Escobar, Banerjee) plus the four anthology covers behind
 * the corpus decision — the selected Gollancz volumes and the two rejected
 * collections (Blaft, Multispecies Cities).
 *
 * Text for the six foundational entries is copied verbatim from the thesis
 * site's own reading-list slide (`drp-graph/src/present/components/slides/
 * ReadingListSlide.jsx`) rather than paraphrased, so it stays in the author's
 * voice. The four corpus entries are drawn from the "Choosing the Stories"
 * section of `content/projects/unflattening.md`.
 */

export type SpineStyle = {
  bg: string;
  fg: string;
  font: "serif" | "sans" | "mono";
  weight?: number;
  italic?: boolean;
  tracking?: string;
  caseStyle?: "upper" | "normal";
  fontSize?: string;
  /** Accent stripe at the spine's foot — an imprint band, hand-picked per book. */
  band?: string;
  /** Short glyph at the foot (a volume numeral, a status mark) — 1–3 characters. */
  mark?: string;
};

export type ReadingListEntry = {
  id: string;
  kind: "text" | "corpus-selected" | "corpus-rejected";
  author: string;
  title: string;
  /** Shorter stand-in for the spine label, when `title` is too long to fit. */
  spineLabel?: string;
  year?: string;
  cover: string;
  /** Foundational texts: three-field read. */
  says?: string;
  saysCite?: string;
  why?: string;
  took?: string;
  /** Corpus entries: a single note in place of the three-field read. */
  blurb?: string;
  spine: SpineStyle;
};

export const READING_LIST: ReadingListEntry[] = [
  {
    id: "suvin",
    kind: "text",
    author: "Darko Suvin",
    title: "Metamorphoses of Science Fiction",
    year: "1979",
    cover: "/projects/books/metamorphoses.png",
    says: "SF is defined by the novum and cognitive estrangement — the presence of a totalising deviation from reality that necessitates critical reflection.",
    why: "It is the foundational academic definition of SF as a critical, not just entertainment, genre.",
    took: "The novum became the primary diagnostic unit for story analysis — every world in this research is read through what its nova produce and foreclose.",
    spine: {
      bg: "#1c1c1e",
      fg: "#d8d5cc",
      font: "serif",
      weight: 600,
      italic: true,
      tracking: "0.02em",
      caseStyle: "normal",
      // First of the three positions the thesis stands on — see the
      // POSITIONS card row above this shelf in Foundation.tsx.
      mark: "01",
    },
  },
  {
    id: "dunne-raby",
    kind: "text",
    author: "Anthony Dunne & Fiona Raby",
    title: "Speculative Everything",
    year: "2013",
    cover: "/projects/books/speculative-everything.png",
    says: "Design can operate as a medium for critique, provocation and imagination — not only problem-solving.",
    why: "It is the field-defining text for SCD practice, and provides the A/B manifesto that frames this research's opposition to conventional design.",
    took: "The fictional world as a site for design is their idea — this research extends it by treating Indian SF as the primary source of those worlds.",
    spine: {
      bg: "#dbe7e3",
      fg: "#0d4d34",
      font: "mono",
      weight: 500,
      tracking: "0.06em",
      caseStyle: "upper",
      fontSize: "0.78rem",
      mark: "02",
    },
  },
  {
    id: "willis",
    kind: "text",
    author: "Anne-Marie Willis",
    title: "Ontological Designing",
    year: "2006",
    cover: "/projects/books/ontological-designing.png",
    says: "Designing is not just something we do — it is something that designs us in return. Designer and designed are mutually constitutive.",
    why: "It establishes the ontological feedback loop that is the theoretical spine of the designer profile instrument.",
    took: "The L1/L2 designer distinction is only legible if you accept Willis's premise: a designer is an artefact of the world they design within.",
    spine: {
      bg: "#eeece3",
      fg: "#232220",
      font: "mono",
      weight: 500,
      tracking: "0.08em",
      caseStyle: "upper",
      fontSize: "0.72rem",
      mark: "03",
    },
  },
  {
    id: "fry",
    kind: "text",
    author: "Tony Fry",
    title: "Design Futuring",
    year: "2009",
    cover: "/projects/books/design-futuring.png",
    says: "Design, as it is dominantly practiced, is defuturing — it is taking futures away from ourselves and other living species.",
    saysCite: "Fry, 2009, p.1",
    why: "It provides the concept of defuturing, which is the scoring criterion that catches the most ideologically loaded briefs.",
    took: "Every brief produced in this framework is evaluated on whether it is defuturing the world — sometimes deliberately, as a design argument.",
    spine: {
      bg: "#4a7fc4",
      fg: "#f5f8fc",
      font: "sans",
      weight: 700,
      tracking: "0.01em",
      caseStyle: "upper",
      fontSize: "0.95rem",
      band: "#1c3a5e",
    },
  },
  {
    id: "escobar",
    kind: "text",
    author: "Arturo Escobar",
    title: "Designs for the Pluriverse",
    year: "2018",
    cover: "/projects/books/pluriverse.png",
    says: "Design has operated as an ontologically colonial practice, assuming the Western canon as universal and marginalising non-Western knowledge systems.",
    why: "It is the most direct academic articulation of the problem this research responds to — sparse non-Western design epistemology.",
    took: "The phrase “epistemic relocation” — used throughout this thesis — is drawn from this lineage of thinking.",
    spine: {
      bg: "#efe9de",
      fg: "#3f6b35",
      font: "serif",
      weight: 500,
      tracking: "0.03em",
      caseStyle: "normal",
      fontSize: "0.85rem",
      band: "#3f6b35",
    },
  },
  {
    id: "banerjee",
    kind: "text",
    author: "Suparno Banerjee",
    title: "Indian Science Fiction",
    year: "2020",
    cover: "/projects/books/indian-science-fiction.png",
    says: "Indian SF operates at the intersection of inherited Western futures and locally rooted imaginaries — “an evolving relationship between Indian culture and modernity and science will inevitably alter the way that SF is conceived in India.”",
    saysCite: "Banerjee, 2020, p.07",
    why: "It is the only rigorous academic mapping of the Indian SF canon, and it grounds this research's corpus selection and cultural claims.",
    took: "The observation that Indian SF scores high on social architecture and low on designed systems directly shaped the framework's weighting criteria.",
    spine: {
      bg: "#3a1f3a",
      fg: "#f0a95c",
      font: "sans",
      weight: 600,
      tracking: "0.02em",
      caseStyle: "normal",
      fontSize: "0.85rem",
    },
  },
  {
    id: "gollancz-i",
    kind: "corpus-selected",
    author: "ed. Tarun K. Saint",
    title: "The Gollancz Book of South Asian Science Fiction, Vol. 1",
    spineLabel: "Gollancz Vol. 1",
    cover: "/projects/books/gollancz-i.png",
    blurb: "Half of the primary corpus — 60+ short stories across both volumes, genre-faithful, with no thematic restriction inside SF. Saint frames the anthology explicitly as a mapping exercise for a field only recently being seriously catalogued.",
    spine: {
      bg: "#8a2f1f",
      fg: "#f6ece4",
      font: "sans",
      weight: 700,
      tracking: "0.04em",
      caseStyle: "upper",
      fontSize: "0.85rem",
      // Gold band ties the two volumes together as one series.
      band: "#c9a227",
      mark: "I",
    },
  },
  {
    id: "gollancz-ii",
    kind: "corpus-selected",
    author: "ed. Tarun K. Saint",
    title: "The Gollancz Book of South Asian Science Fiction, Vol. 2",
    spineLabel: "Gollancz Vol. 2",
    cover: "/projects/books/gollancz-ii.png",
    blurb: "The second half of the corpus. All three selected story-worlds — The Ministry of Relevance, Shit Flower, The Diamond Library — were scored and chosen from across these two volumes, not pre-filtered by theme.",
    spine: {
      bg: "#0b0b0f",
      fg: "#e7e5e2",
      font: "sans",
      weight: 700,
      tracking: "0.04em",
      caseStyle: "upper",
      fontSize: "0.85rem",
      band: "#c9a227",
      mark: "II",
    },
  },
  {
    id: "blaft",
    kind: "corpus-rejected",
    author: "Blaft Publications",
    title: "The Blaft Book of Anti-Caste SF",
    year: "2024",
    cover: "/projects/books/blaft.png",
    blurb: "Rejected. Explicitly pre-filters on works that address caste and anti-caste voice “as an act of political correction.” The selection criteria is ideological rather than formal — incompatible with the thematic variance this framework requires.",
    spine: {
      bg: "#123c40",
      fg: "#8fd8d0",
      font: "mono",
      weight: 500,
      tracking: "0.03em",
      caseStyle: "upper",
      fontSize: "0.72rem",
      // Rejected from the corpus — shared with Multispecies Cities below.
      mark: "✕",
    },
  },
  {
    id: "multispecies",
    kind: "corpus-rejected",
    author: "eds. Rupprecht, Cleland, Tamura, Chaudhuri, Ulibarri",
    title: "Multispecies Cities: Solarpunk Urban Futures",
    year: "2021",
    cover: "/projects/books/multispecies-cities.png",
    blurb: "Rejected. A specific editorial focus on more-than-human kinship in solarpunk urban settings makes the collection niche rather than representative — the same objection as Blaft, applied to theme instead of politics.",
    spine: {
      bg: "#f2ead9",
      fg: "#2b2b26",
      font: "serif",
      weight: 500,
      italic: true,
      tracking: "0.01em",
      caseStyle: "normal",
      fontSize: "0.82rem",
      mark: "✕",
    },
  },
];
