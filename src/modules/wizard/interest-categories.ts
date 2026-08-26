import { INTEREST_CATEGORY_OPTIONS } from "@/modules/wizard/field-options";

export type InterestCategory = {
  fullValue: string;
  category: string;
  examples: string;
};

export function parseInterestOption(option: string): InterestCategory {
  const colonIndex = option.indexOf(":");
  if (colonIndex === -1) {
    return { fullValue: option, category: option, examples: "" };
  }

  return {
    fullValue: option,
    category: option.slice(0, colonIndex).trim(),
    examples: option.slice(colonIndex + 1).trim(),
  };
}

export const INTEREST_CATEGORIES: InterestCategory[] = INTEREST_CATEGORY_OPTIONS.map(
  parseInterestOption,
);

export function filterInterestCategories(query: string): InterestCategory[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return INTEREST_CATEGORIES;
  }

  return INTEREST_CATEGORIES.filter(
    (item) =>
      item.category.toLowerCase().includes(normalized) ||
      item.examples.toLowerCase().includes(normalized) ||
      item.fullValue.toLowerCase().includes(normalized),
  );
}
