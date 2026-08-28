import { AppError } from "@/core/app-error";
import { registrationVersion } from "./registrations";

export function assertAdminWriteEnabled() {
  if (process.env.EXTERNAL_WRITES_ENABLED !== "true") {
    throw new AppError({ code: "FORBIDDEN", message: "Saving changes is disabled in this environment." });
  }
}
export function assertRegistrationVersion(student: Record<string, unknown>, version: string) {
  if (version !== registrationVersion(student)) {
    throw new AppError({ code: "DRAFT_CHANGED_ELSEWHERE", message: "This registration changed since you opened it. Reload it before saving.", status: 409 });
  }
}
