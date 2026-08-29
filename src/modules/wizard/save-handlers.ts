import { LEARNING_PROFILE_SAVE3_KEYS } from "@/modules/wizard/learning-profile";

export type SaveHandlerKey =
  | "save1"
  | "save1.5"
  | "save1.6"
  | "save2"
  | "save3"
  | "save4"
  | "save5"
  | "save6"
  | "save6.1"
  | "save7"
  | "save8";

export const SAVE_HANDLERS: Record<SaveHandlerKey, readonly string[]> = {
  save1: [
    "African_American",
    "Asian",
    "Caucasian",
    "Latino_Hispanic",
    "Native_American",
    "Native_Hawaiian",
    "female",
    "gender_variant_non_conforming",
    "male",
    "other_gender",
    "other_unknown_ethnicity",
    "prefer_not_to_say_ethnicity",
    "prefer_not_to_say_gender",
    "studentBirthCert",
    "studentPic",
    "student_birth_date",
    "student_last_name",
    "student_name",
    "student_nick_name",
    "transgender",
  ],
  "save1.5": [
    "email",
    "parent_address",
    "parent_email",
    "parent_last_name",
    "parent_name",
    "parent_phone",
    "parent_relation",
    "share_contact",
  ],
  "save1.6": ["PTO", "secondary_guardian", "tertiary_guardian"],
  save2: ["interests", "most_interested_in"],
  save3: LEARNING_PROFILE_SAVE3_KEYS,
  save4: ["ela_grade_level", "math_grade_level", "science_grade_level"],
  save5: [
    "confidence_in_collaborating",
    "confidence_in_engaging_independent_work",
    "confidence_in_reading",
    "confidence_in_writing",
    "confidence_using_technology",
    "connecting_with_adults",
  ],
  save6: [
    "IEP_or_504_plan",
    "learningCenterBool",
    "learning_environment_past_12_months",
    "learning_experiece_past_12_months",
    "school_like_to_see",
    "student_last_school_address",
    "student_last_school_contact_num",
    "student_last_school_contact_person",
    "student_last_school_name",
    "upload_copy_EIP_504_plan",
    "upload_student_curreny_learning",
  ],
  save7: [
    "determining_required_paperwork_home_state",
    "home_state",
    "step_up_id",
    "student_award_id",
    "submit_step_up",
    "vaccine_situation",
  ],
  save8: [
    "computer_system",
    "length_of_staying",
    "starting_date",
  ],
  "save6.1": [
    "CreditTransfer",
    "transcriptFiles",
    "transferCredit",
    "uploadTranscript",
  ],
};

export const SAVE_META_FIELDS = new Set([
  "objectId",
  "oldData",
  "previous_data",
  "propName",
  "UpdateHistory",
  "changed_fields",
  "date_updated",
  "student_name",
]);

export function isSaveHandlerKey(value: string): value is SaveHandlerKey {
  return value in SAVE_HANDLERS;
}
