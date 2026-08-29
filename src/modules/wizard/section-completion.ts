import type { SaveHandlerKey } from "@/modules/wizard/save-handlers";

export function completionKeyForSaveHandler(saveHandler: SaveHandlerKey): string {
  return saveHandler.replace(/^save/, "");
}

export function hasRecordedSectionCompletion(
  student: Record<string, unknown>,
  saveHandler: SaveHandlerKey,
): boolean {
  const completionKey = completionKeyForSaveHandler(saveHandler);

  // Keep reading the old flag shape for compatibility with fixtures and any
  // historical rows from environments where those properties were stored.
  if (student[`${completionKey}disabled`] === true) {
    return true;
  }

  const history = Array.isArray(student.UpdateHistory) ? student.UpdateHistory : [];
  return history.some(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      "step" in entry &&
      entry.step === saveHandler,
  );
}
