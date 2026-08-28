import { AppError } from "@/core/app-error";
import type { AdminEditActor } from "@/modules/admin/policy";
import {
  isSaveHandlerKey,
  SAVE_HANDLERS,
  SAVE_META_FIELDS,
  type SaveHandlerKey,
} from "@/modules/wizard/save-handlers";

function stableSerialize(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function pickSaveStepFields(
  saveStep: SaveHandlerKey,
  fields: Record<string, unknown>,
  actor?: AdminEditActor,
): Record<string, unknown> {
  const allowed = new Set(SAVE_HANDLERS[saveStep]);
  const picked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    const adminFirstName = actor?.role === "admin" && saveStep === "save1" && key === "student_name";
    if (adminFirstName) {
      if (typeof value !== "string" || !value.trim() || /\[delete\]/i.test(value)) {
        throw new AppError({ code: "INVALID_INPUT", message: "Enter a first name without the reserved [delete] marker." });
      }
      picked[key] = value.trim();
    } else if (allowed.has(key) && !SAVE_META_FIELDS.has(key)) {
      picked[key] = value;
    }
  }

  return picked;
}

export function buildStepSavePayload(
  saveStep: SaveHandlerKey,
  fields: Record<string, unknown>,
  previousRow: Record<string, unknown>,
  actor?: AdminEditActor,
): Record<string, unknown> {
  const picked = pickSaveStepFields(saveStep, fields, actor);
  const changedKeys = Object.keys(picked).filter(
    (key) => stableSerialize(picked[key]) !== stableSerialize(previousRow[key]),
  );

  if (changedKeys.length === 0) {
    throw new AppError({
      code: "INVALID_INPUT",
      message: "No changes to save.",
    });
  }

  const existingHistory = Array.isArray(previousRow.UpdateHistory)
    ? previousRow.UpdateHistory
    : [];

  return {
    ...(actor ? Object.fromEntries(changedKeys.map((key) => [key, picked[key]])) : picked),
    changed_fields: changedKeys.join(","),
    date_updated: Date.now(),
    previous_data: previousRow,
    UpdateHistory: [
      ...existingHistory,
      {
        step: saveStep,
        at: Date.now(),
        fields: changedKeys,
        ...(actor ? { actor } : {}),
      },
    ],
    [saveStep.replace(/^save/, "") + "disabled"]: true,
  };
}

export function parseSaveStep(value: string): SaveHandlerKey {
  if (!isSaveHandlerKey(value)) {
    throw new AppError({
      code: "INVALID_INPUT",
      message: "Unknown save step.",
    });
  }

  return value;
}
