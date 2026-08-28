import { AppError } from "@/core/app-error";

export function adminAccessEnabled(): boolean {
  return process.env.ADMIN_ACCESS_ENABLED === "true";
}

export function adminConfig() {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  const auditTable = process.env.ADMIN_AUDIT_TABLE?.trim();
  if (!adminAccessEnabled() || !secret || secret.length < 32 ||
      secret === process.env.AUTH_SECRET?.trim() || !auditTable || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(auditTable)) {
    throw new AppError({ code: "FORBIDDEN", message: "Admin access is not available. Contact the site administrator." });
  }
  return { secret, auditTable };
}
