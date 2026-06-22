import data from "@/data/career-lineage.json";

export type CategoryKey = "DE" | "DA" | "CHG" | "OPS" | "LS";

export interface Skill {
  /** name */
  n: string;
  /** start year */
  s: number;
  /** end year, omit while active */
  e?: number;
  /** certification: render the year only, no running count */
  cert?: boolean;
}

export interface CareerNode {
  ref: string;
  kind?: "role" | "personal";
  current?: boolean;
  personal?: boolean;
  title: string;
  company: string;
  meta: string;
  summary: string;
  brief?: boolean;
  cats: Partial<Record<CategoryKey, string[]>>;
  skills: Skill[];
}

export interface CategoryDef {
  label: string;
  colour: string;
}

export interface CareerLineageData {
  meta: { title: string; range: string; owner: string; headline: string; profile?: string };
  categoryOrder: CategoryKey[];
  categories: Record<CategoryKey, CategoryDef>;
  skillColour: string;
  nodes: CareerNode[];
}

export const careerLineage = data as unknown as CareerLineageData;
