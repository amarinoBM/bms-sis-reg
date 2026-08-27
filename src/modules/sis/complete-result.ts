const IDENTITY_FAILURE_STAGE = "student_identity_guard";

const IDENTITY_FAILURE_MESSAGE =
  "We could not match this student enrollment. Please contact help@brilliantmicroschool.org so we can finish your registration.";

const GENERIC_FAILURE_MESSAGE =
  "Registration could not be completed. Our team has been notified — please contact help@brilliantmicroschool.org if this continues.";

function readStage(result: unknown): string {
  if (!result || typeof result !== "object") {
    return "";
  }

  const stage = (result as { stage?: unknown }).stage;
  return typeof stage === "string" ? stage : "";
}

function isIdentityGuardFailure(result: unknown): boolean {
  return readStage(result) === IDENTITY_FAILURE_STAGE;
}

export function isSisCompletedFormSuccess(result: unknown): boolean {
  if (result === null || result === undefined) {
    return true;
  }

  if (typeof result === "boolean") {
    return result;
  }

  if (typeof result !== "object") {
    return true;
  }

  const record = result as Record<string, unknown>;

  if (record.success === false) {
    return !isIdentityGuardFailure(result);
  }

  if (record.error && record.success !== true) {
    return !isIdentityGuardFailure(result);
  }

  return true;
}

export function formatSisCompletedFormFailure(result: unknown): string {
  if (isIdentityGuardFailure(result)) {
    return IDENTITY_FAILURE_MESSAGE;
  }

  if (result && typeof result === "object") {
    const record = result as { message?: unknown; error?: unknown };
    for (const value of [record.message, record.error]) {
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return GENERIC_FAILURE_MESSAGE;
}
