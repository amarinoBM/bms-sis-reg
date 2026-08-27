import {
  flattenGuardianContact,
  normalizeGuardianContactForSave,
} from "@/modules/wizard/guardian-contact";
import type { SaveHandlerKey } from "@/modules/wizard/save-handlers";
import {
  applyEthnicitySelection,
  applyGenderSelection,
  normalizeInterestCategory,
  readEthnicitySelection,
  readGenderSelection,
  readInterestsSelection,
} from "@/modules/wizard/field-options";
import {
  readCreditTransferSubjects,
  readTranscriptDeliveryChoice,
  readTranscriptFiles,
  readTransferCreditFlag,
  TRANSCRIPT_DELIVERY_UPLOAD,
} from "@/modules/wizard/transcript-fields";
import {
  readIepOr504Plan,
  readLearningCenterBool,
} from "@/modules/wizard/prior-school-fields";

const VIRTUAL_FIELD_KEYS = new Set([
  "gender_selection",
  "ethnicity_selection",
]);

export function expandVirtualFormFields(
  saveStep: SaveHandlerKey,
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const expanded = { ...fields };

  if (saveStep === "save1") {
    const genderSelection = expanded.gender_selection;
    if (typeof genderSelection === "string" && genderSelection) {
      applyGenderSelection(expanded, genderSelection);
    }

    const ethnicitySelection = expanded.ethnicity_selection;
    if (typeof ethnicitySelection === "string" && ethnicitySelection) {
      applyEthnicitySelection(expanded, ethnicitySelection);
    }
  }

  if (saveStep === "save6.1") {
    expanded.CreditTransfer = readCreditTransferSubjects(expanded.CreditTransfer);
    expanded.transcriptFiles = readTranscriptFiles(expanded.transcriptFiles);
    expanded.transferCredit = readTransferCreditFlag(expanded.transferCredit);

    const deliveryChoice = readTranscriptDeliveryChoice(expanded.uploadTranscript);
    if (deliveryChoice) {
      expanded.uploadTranscript = deliveryChoice;
    }
  }

  if (saveStep === "save2") {
    const interests = readInterestsSelection(expanded.interests);
    expanded.interests = interests.map(
      (item) => normalizeInterestCategory(item) ?? item,
    );

    const mostInterestedIn = expanded.most_interested_in;
    if (typeof mostInterestedIn === "string") {
      const normalized = normalizeInterestCategory(mostInterestedIn);
      if (normalized) {
        expanded.most_interested_in = normalized;
      }
    }
  }

  if (saveStep === "save1.6") {
    expanded.secondary_guardian = normalizeGuardianContactForSave(
      expanded.secondary_guardian,
    );
    expanded.tertiary_guardian = normalizeGuardianContactForSave(
      expanded.tertiary_guardian,
    );
  }

  if (saveStep === "save6") {
    const hadLastSchool = readLearningCenterBool(expanded.learningCenterBool);
    if (hadLastSchool !== null) {
      expanded.learningCenterBool = hadLastSchool;
    }

    const hasIep = readIepOr504Plan(expanded.IEP_or_504_plan);
    if (hasIep !== null) {
      expanded.IEP_or_504_plan = hasIep;
    }
  }

  for (const key of VIRTUAL_FIELD_KEYS) {
    delete expanded[key];
  }

  return expanded;
}

export function enrichFlatFormValues(
  student: Record<string, unknown>,
): Record<string, unknown> {
  const flat: Record<string, unknown> = { ...student };

  flat.gender_selection = readGenderSelection(student);
  flat.ethnicity_selection = readEthnicitySelection(student);
  flat.interests = readInterestsSelection(student.interests).map(
    (item) => normalizeInterestCategory(item) ?? item,
  );

  const mostInterestedIn =
    typeof student.most_interested_in === "string" ? student.most_interested_in : "";
  flat.most_interested_in = normalizeInterestCategory(mostInterestedIn) ?? mostInterestedIn;

  flat.transcriptFiles = readTranscriptFiles(student.transcriptFiles);
  flat.CreditTransfer = readCreditTransferSubjects(student.CreditTransfer);
  flat.transferCredit = readTransferCreditFlag(student.transferCredit);

  const deliveryChoice = readTranscriptDeliveryChoice(student.uploadTranscript);
  if (deliveryChoice) {
    flat.uploadTranscript = deliveryChoice;
  } else if (
    typeof student.uploadTranscript === "string" &&
    student.uploadTranscript.trim().startsWith("http")
  ) {
    const legacyUrl = student.uploadTranscript.trim();
    const legacyFiles = readTranscriptFiles(flat.transcriptFiles);
    flat.transcriptFiles = [...legacyFiles, legacyUrl];
    flat.uploadTranscript = TRANSCRIPT_DELIVERY_UPLOAD;
  }

  if (student.share_contact === "Yes") {
    flat.share_contact = true;
  } else if (student.share_contact === "No") {
    flat.share_contact = false;
  }

  flattenGuardianContact("secondary_guardian", student.secondary_guardian, flat);
  flattenGuardianContact("tertiary_guardian", student.tertiary_guardian, flat);

  const hadLastSchool = readLearningCenterBool(student.learningCenterBool);
  if (hadLastSchool !== null) {
    flat.learningCenterBool = hadLastSchool;
  }

  const hasIep = readIepOr504Plan(student.IEP_or_504_plan);
  if (hasIep !== null) {
    flat.IEP_or_504_plan = hasIep;
  }

  return flat;
}
