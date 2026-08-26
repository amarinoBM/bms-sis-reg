/**
 * Step 7 UI copy — sourced from Clever / UI Builder (`clever-app.json` audit)
 * and the live home-state requirements panel (state_regs cards).
 */

export const HOME_STATE_COPY = {
  fieldLabel: "Home state",
  intro:
    "Private school students from a state other than Florida need to submit a letter each year to their local school district.",
  travelLead: "If you often travel, select the state where your ",
  travelTail: "student will spend most of their time this academic year.",
  requirementsHeading: "Your state requires some paperwork:",
  studyInformationLead: "We hope the above is clear and suggest you also study the information ",
  studyInformationLink: "here",
  paperworkYes: "Yes",
  paperworkNo: "No",
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
  vaccineSituationPrompt: "Please select your situation from below:",
  vaccineConfirmingTitle: "Confirming",
  vaccineConfirmingDetail:
    "We have already completed the necessary vaccinations and have sent relevant form for to the state’s",
  vaccinePendingTitle: "Pending",
  vaccinePendingDetail:
    "We don't currently have the form, but we will be submitting it shortly.",
  vaccineExemptionTitle: "Exemption",
  vaccineExemptionDetail:
    "We are seeking an exemption and will be submitting it soon",
  vaccineSituationFieldLabel: "Vaccine situation",
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

export const FLORIDA_HOME_STATE = "Florida";
