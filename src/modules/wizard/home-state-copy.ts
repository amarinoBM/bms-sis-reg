/**
 * Step 7 UI copy — sourced from Clever / UI Builder (`clever-app.json` audit)
 * and the live home-state requirements panel (state_regs cards).
 */

export const HOME_STATE_COPY = {
  fieldLabel: "Home state",
  intro:
    "Your home state helps us identify the paperwork and immunization records we may need for this school year.",
  travelLead: "If you often travel, select the state where ",
  travelTail: " will spend most of their time this academic year.",
  requirementsHeading: "Your state requires some paperwork:",
  studyInformationLead: "We hope the above is clear and suggest you also study the information ",
  studyInformationLink: "here",
  paperworkYes: "Yes",
  paperworkNo: "No",
  paperworkPrompt: "Do you need help with your state's homeschool paperwork?",
  floridaImmunization: [
    "To ensure the safety and well-being of all our Florida students,",
    "it's essential that we confirm the availability of the Florida Certification of ",
    "Immunization (DH Form 680) Part A for every Florida student in",
    "K or 7th grade. If your child has not been vaccinated,",
    "there are exemptions available, and we request that the",
    "appropriate exemption form be submitted.",
    "Specifically:",
    "- Students in kindergarten (KG) through sixth grade must have a",
    "Part A (Florida Department of Education [DOE] Code 1).",
    "- Students in seventh grade must have a Part A (DOE Code 8).",
    "- Students without a Part A must have one of the following exemptions:",
    "a. temporary medical exemption DH Form 680, Part B (DOE Code 2);",
    "b. permanent medical exemption DH Form 680, Part C (DOE Code 3) or",
    "c. Religious Exemption (DH Form 681)(DOE Code 4)",
  ],
  texasImmunization: [
    "Texas schools report immunization status for kindergarten and seventh grade students each year.",
    "Please upload your child's current immunization record or exemption document if you have it.",
    "We will review the record and use it to complete the school's Texas report.",
  ],
  texasImmunizationGuideUrl:
    "https://www.dshs.texas.gov/sites/default/files/LIDS-Immunizations/pdf/pdf_stock/11-15127.pdf",
  texasImmunizationGuideLabel: "Read the Texas immunization reporting instructions",
  vaccineSituationPrompt: "Please select your situation from below:",
  vaccineConfirmingTitle: "Required form available",
  vaccineConfirmingDetail:
    "We have the required Florida immunization form and can upload it here or confirm that it was sent to the state.",
  vaccinePendingTitle: "Form still needed",
  vaccinePendingDetail:
    "We do not have the required Florida form yet and will provide it shortly.",
  vaccineExemptionTitle: "Exemption document",
  vaccineExemptionDetail:
    "We are using an exemption and will provide the relevant document.",
  vaccineSituationFieldLabel: "Vaccine situation",
  immunizationUploadLabel: "Immunization record or exemption document",
  immunizationUploadDescription:
    "Upload the current record, a physician-signed medical exemption, or a valid conscientious exemption affidavit.",
  texasSituationPrompt: "What best describes your child's Texas immunization record?",
  texasRecordTitle: "Record available",
  texasRecordDetail: "We have a current immunization record to upload.",
  texasProvisionalTitle: "Provisional",
  texasProvisionalDetail: "The record is in progress or the child is covered by a provisional status.",
  texasExemptionTitle: "Exemption",
  texasExemptionDetail: "We have a valid medical or conscientious exemption document.",
  texasPendingTitle: "Needs follow-up",
  texasPendingDetail: "We do not have the current record yet and need to provide it later.",
  stepUpQuestion: "Will you submit our invoices to Step Up FES-UA?",
  stepUpYes: "Yes",
  stepUpNo: "No",
  stepUpIdLabel: "Step UP ID",
  studentAwardIdLabel: "Student Award ID",
  submitStepUpLabel: "Submit Step Up",
} as const;

/** Stored values for `determining_required_paperwork_home_state` (yesState / noState onClick). */
export const PAPERWORK_SUPPORT_YES = "I need support with local paperwork";
export const PAPERWORK_SUPPORT_NO = "I don't need support with local paperwork";

/** Stored values for `vaccine_situation` (situationBlock clicks). */
export const VACCINE_CONFIRMING = "Confirming";
export const VACCINE_PENDING = "Pending";

export const TEXAS_RECORD_AVAILABLE = "Texas record available";
export const TEXAS_PROVISIONAL = "Texas provisional";
export const TEXAS_EXEMPTION = "Texas exemption";
export const TEXAS_PENDING = "Texas needs follow-up";

export const FLORIDA_HOME_STATE = "Florida";
export const TEXAS_HOME_STATE = "Texas";
