import { describe, expect, it } from "vitest";

import { SAVE_HANDLERS } from "@/modules/wizard/save-handlers";
import {
  additionalBehavioralInfoLabel,
  disabilitySelectionPrompt,
  EXPRESSION_SECTION_PROMPT,
  LEARNING_DISABILITY_FIELDS,
  LEARNING_EXPRESSION_FIELDS,
  LEARNING_PROFILE_SAVE3_KEYS,
  learningChallengesGateLabel,
  readLearningOrBehavioralChallenges,
} from "@/modules/wizard/learning-profile";

describe("learning-profile", () => {
  it("uses legacy copy for gate and section prompts", () => {
    expect(learningChallengesGateLabel("Vincenzo")).toBe(
      "Does Vincenzo have any learning or behavioral challenges?",
    );
    expect(disabilitySelectionPrompt("Vincenzo")).toBe(
      "Please choose any challenges Vincenzo is experiencing that may affect Vincenzo's learning or behavioral challenges?",
    );
    expect(EXPRESSION_SECTION_PROMPT).toBe(
      "Please check any challenges, behaviors or emotions your student frequently expresses due to their disability:",
    );
    expect(additionalBehavioralInfoLabel("Charlie")).toBe(
      "Charlie's (learning and/or behavioral) challenges, such as past experiences/events or personal advice to your teacher to avoid any triggers?",
    );
  });

  it("includes disability and expression fields for save3", () => {
    expect(LEARNING_DISABILITY_FIELDS.map((field) => field.key)).toContain("Dyslexia");
    expect(LEARNING_DISABILITY_FIELDS.map((field) => field.label)).toContain(
      "Visual perceptual/visual motor deficit",
    );
    expect(LEARNING_DISABILITY_FIELDS.map((field) => field.key)).not.toContain(
      "other_behavioral_challenges",
    );
    expect(LEARNING_EXPRESSION_FIELDS.map((field) => field.key)).toContain(
      "inattention_poor_focus",
    );
    expect(LEARNING_EXPRESSION_FIELDS.map((field) => field.label)).toContain(
      "Mood swings/emotional disregulation",
    );
    expect(LEARNING_EXPRESSION_FIELDS.map((field) => field.key)).toContain("anxiety_fear");
    expect(LEARNING_PROFILE_SAVE3_KEYS).toContain("mood_swings_emotional_disregulation");
    expect(LEARNING_PROFILE_SAVE3_KEYS).toContain("other_behavioral_challenges");
  });

  it("keeps save3 aligned with learning profile keys", () => {
    expect(SAVE_HANDLERS.save3).toEqual(LEARNING_PROFILE_SAVE3_KEYS);
  });

  it("reads the learning challenges gate as a boolean", () => {
    expect(readLearningOrBehavioralChallenges(true)).toBe(true);
    expect(readLearningOrBehavioralChallenges(false)).toBe(false);
    expect(readLearningOrBehavioralChallenges(null)).toBe(null);
  });
});
