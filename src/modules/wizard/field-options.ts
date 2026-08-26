/** Display labels match the legacy Clever / UI Builder SIS controls. */

export const GENDER_OPTIONS = [
  "Female",
  "Male",
  "Transgender",
  "Gender Variant/Non-Conforming",
  "Prefer not to say",
] as const;

export const ETHNICITY_OPTIONS = [
  "African-American",
  "Asian",
  "Caucasian",
  "Latino or Hispanic",
  "Native American",
  "Native Hawaiian",
  "Other/Unknown",
  "Prefer not to say",
] as const;

export const PARENT_RELATION_OPTIONS = [
  "Parent",
  "Grandparent",
  "Legal Guardian",
  "Other",
  "I'd rather not say",
] as const;

export const INTEREST_CATEGORY_OPTIONS = [
  "Sports: Soccer, Basketball, Swimming, Tennis, Gymnastics, etc.",
  "Music: Playing an instrument, Singing, Listening to music, Music composition, etc.",
  "Arts and Crafts: Drawing, Painting, Sculpting, Pottery, Knitting, DIY projects, etc.",
  "Science and Nature: Astronomy, Biology, Chemistry, Environmental conservation, Gardening, etc.",
  "Reading and Writing: Fiction, Non-fiction, Poetry, Creative writing, Comics, etc.",
  "Technology and Computing: Video games, Coding, Robotics, Web design, etc.",
  "Performing Arts: Theater, Dance, Magic, Circus arts, etc.",
  "History and Geography: World history, Archaeology, Cultural studies, Map reading, etc.",
  "Languages and Linguistics: Learning foreign languages, Sign language, Linguistics, etc.",
  "Mathematics: Solving puzzles, Math competitions, etc.",
  "Cooking and Baking: Trying new recipes, Cake decorating, etc.",
  "Board Games and Puzzles: Chess, Card games, Jigsaw puzzles, etc.",
  "Movies and Television: Watching films, Animation, Documentary, etc.",
  "Outdoor Activities: Hiking, Camping, Birdwatching, Fishing, etc.",
  "Animals and Pets: Learning about animals, Pet care, Horseback riding, etc.",
  "Volunteering and Community Service: Charity work, Community clean-up, Helping at animal shelters, etc.",
  "Photography and Videography: Taking photos, Making videos, Editing, etc.",
  "Fashion and Design: Clothing design, Fashion blogging, Interior design, etc.",
  "Collecting: Stamps, Coins, Figurines, etc.",
  "Health and Fitness: Yoga, Meditation, Running, Weightlifting, etc.",
  "Astronomy and Space Exploration: Stargazing, Learning about space missions, etc.",
  "Mind and Brain Games: Sudoku, Crossword puzzles, Brain teasers, etc.",
  "Vehicles and Mechanics: Cars, Bikes, Model building, etc.",
] as const;

export const COMPUTER_SYSTEM_OPTIONS = [
  "Windows Computer",
  "MacOS Computer",
  "Chromebook (not recommended)",
  "Android tablet (not recommended)",
] as const;

export const LENGTH_OF_STAYING_OPTIONS = [
  "One academic year",
  "More than one academic year",
  "Part of an academic year",
] as const;

export const US_STATE_OPTIONS = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "District of Columbia",
] as const;

const GENDER_BOOLEAN_KEYS = [
  "male",
  "female",
  "transgender",
  "gender_variant_non_conforming",
  "prefer_not_to_say_gender",
] as const;

const ETHNICITY_BOOLEAN_KEYS = [
  "African_American",
  "Asian",
  "Caucasian",
  "Latino_Hispanic",
  "Native_American",
  "Native_Hawaiian",
  "other_unknown_ethnicity",
  "prefer_not_to_say_ethnicity",
] as const;

const GENDER_LABEL_TO_KEY: Record<string, typeof GENDER_BOOLEAN_KEYS[number]> = {
  Male: "male",
  Female: "female",
  Transgender: "transgender",
  "Gender Variant/Non-Conforming": "gender_variant_non_conforming",
  "Prefer not to say": "prefer_not_to_say_gender",
};

const GENDER_KEY_TO_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
  transgender: "Transgender",
  gender_variant_non_conforming: "Gender Variant/Non-Conforming",
  prefer_not_to_say_gender: "Prefer not to say",
};

const ETHNICITY_LABEL_TO_KEY: Record<string, typeof ETHNICITY_BOOLEAN_KEYS[number]> = {
  "African-American": "African_American",
  Asian: "Asian",
  Caucasian: "Caucasian",
  "Latino or Hispanic": "Latino_Hispanic",
  "Native American": "Native_American",
  "Native Hawaiian": "Native_Hawaiian",
  "Other/Unknown": "other_unknown_ethnicity",
  "Prefer not to say": "prefer_not_to_say_ethnicity",
};

const ETHNICITY_KEY_TO_LABEL: Record<string, string> = {
  African_American: "African-American",
  Asian: "Asian",
  Caucasian: "Caucasian",
  Latino_Hispanic: "Latino or Hispanic",
  Native_American: "Native American",
  Native_Hawaiian: "Native Hawaiian",
  other_unknown_ethnicity: "Other/Unknown",
  prefer_not_to_say_ethnicity: "Prefer not to say",
};

export function readGenderSelection(student: Record<string, unknown>): string {
  for (const key of GENDER_BOOLEAN_KEYS) {
    if (student[key] === true) {
      return GENDER_KEY_TO_LABEL[key] ?? "";
    }
  }

  return "";
}

export function readEthnicitySelection(student: Record<string, unknown>): string {
  for (const key of ETHNICITY_BOOLEAN_KEYS) {
    if (student[key] === true) {
      return ETHNICITY_KEY_TO_LABEL[key] ?? "";
    }
  }

  return "";
}

export function applyGenderSelection(
  fields: Record<string, unknown>,
  selection: string,
): void {
  for (const key of GENDER_BOOLEAN_KEYS) {
    fields[key] = false;
  }

  const key = GENDER_LABEL_TO_KEY[selection];
  if (key) {
    fields[key] = true;
    fields.other_gender = "";
  }
}

export function applyEthnicitySelection(
  fields: Record<string, unknown>,
  selection: string,
): void {
  for (const key of ETHNICITY_BOOLEAN_KEYS) {
    fields[key] = false;
  }

  const key = ETHNICITY_LABEL_TO_KEY[selection];
  if (key) {
    fields[key] = true;
  }
}

export function readInterestsSelection(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeInterestCategory(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const exact = INTEREST_CATEGORY_OPTIONS.find((option) => option === trimmed);
  if (exact) {
    return exact;
  }

  const fromShortLabel = INTEREST_CATEGORY_OPTIONS.find((option) => {
    const category = option.split(":")[0];
    return category === trimmed || trimmed.startsWith(`${category}:`);
  });
  return fromShortLabel ?? null;
}
