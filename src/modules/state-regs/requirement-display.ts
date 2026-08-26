import type { StateRegRecord, StateRequirementDisplay } from "./types";

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Live UI card labels (state_regs requirement rows).
 */
export function formatStateRequirementDisplays(reg: StateRegRecord): StateRequirementDisplay[] {
  const displays: StateRequirementDisplay[] = [];

  if (reg.Affidavit) {
    displays.push({ primaryLine: "Affidavit" });
  }
  if (reg.Notice_of_Intent) {
    displays.push({ primaryLine: "Notice of Intent" });
  }
  if (reg.Register_with_the_DoE) {
    displays.push({ primaryLine: "Register with the DOE" });
  }
  if (reg.Individualized_Home_Instruction_Plan) {
    displays.push({ primaryLine: "Individualized Home Instruction Plan" });
  }
  if (reg.Maintain_a_portfolio) {
    displays.push({ primaryLine: "Maintain a Portfolio" });
  }
  if (reg.Annual_Evaluation) {
    displays.push({ primaryLine: "Annual Evaluation" });
  }
  if (reg.Notice_of_termination) {
    displays.push({ primaryLine: "Notice of termination" });
  }
  if (reg.State_certified_teacher) {
    displays.push({ primaryLine: "State-certified Teacher" });
  }
  if (reg.Quarterly_Reports) {
    displays.push({ primaryLine: "Quarterly Reports" });
  }

  if (hasText(reg.Minimum_number_of_hours)) {
    const minimumHours = reg.Minimum_number_of_hours!.trim();
    displays.push({
      primaryLine: `Minimum number of hours: ${minimumHours}`,
    });
  }

  if (hasText(reg.Comments)) {
    const comments = reg.Comments!.trim();
    displays.push({
      primaryLine: `Comments - ${comments}`,
    });
  }

  if (hasText(reg.Subject_Requirements)) {
    const subjectRequirements = reg.Subject_Requirements!.trim();
    displays.push({
      primaryLine: `Subject Requirements - ${subjectRequirements}`,
    });
  }

  if (hasText(reg.url)) {
    const url = reg.url!.trim();
    displays.push({
      primaryLine: "State Requirements website here",
      linkUrl: url,
      linkLabel: "State Requirements website here",
    });
  }

  return displays;
}
