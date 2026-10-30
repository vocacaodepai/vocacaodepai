// Categorias das histórias de pai = `check` de stories.category (0006 / doc 09 §3.2).
export type StoryCategory = "paternidade" | "casamento" | "trabalho" | "fe" | "superacao" | "humor";

export const STORY_CATEGORIES: { value: StoryCategory; label: string }[] = [
  { value: "paternidade", label: "Paternidade" },
  { value: "casamento", label: "Casamento" },
  { value: "trabalho", label: "Trabalho e provisão" },
  { value: "fe", label: "Fé" },
  { value: "superacao", label: "Superação" },
  { value: "humor", label: "Humor de pai" },
];

export const STORY_CATEGORY_VALUES = STORY_CATEGORIES.map((c) => c.value) as [
  StoryCategory,
  ...StoryCategory[],
];

export function storyCategoryLabel(value: string): string {
  return STORY_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
