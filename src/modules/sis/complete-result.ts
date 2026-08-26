export function isSisCompletedFormSuccess(result: unknown): boolean {
  if (result === null || result === undefined) {
    return false;
  }

  if (typeof result === "boolean") {
    return result;
  }

  if (typeof result !== "object") {
    return true;
  }

  const record = result as Record<string, unknown>;

  if (record.success === false) {
    return false;
  }

  if (record.error) {
    return false;
  }

  return true;
}

export function formatSisCompletedFormFailure(result: unknown): string {
  if (result && typeof result === "object" && "message" in result) {
    const message = (result as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Registration could not be completed. Our team has been notified — please contact help@brilliantmicroschool.org if this continues.";
}
