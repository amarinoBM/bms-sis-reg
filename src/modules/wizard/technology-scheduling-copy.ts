/**
 * Step 8 (save8) copy — technology & scheduling fields.
 */

export function technologySchedulingStepDescription(studentName: string): string {
  return `Set up ${studentName}'s device and school calendar for the year ahead.`;
}

export function computerSystemLabel(studentName: string): string {
  return `What computer system will ${studentName} be using?`;
}

export function startingDateLabel(studentName: string): string {
  return `When will ${studentName} start?`;
}

export function lengthOfStayingLabel(studentName: string): string {
  return `How long do you plan for ${studentName} to stay with us?`;
}

export const LENGTH_OF_STAYING_HINT =
  "When planning your school year, we recommend finishing in late June and starting again in early August — so you meet state hour requirements for the full year.";
