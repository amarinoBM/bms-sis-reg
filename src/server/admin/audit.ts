import { randomUUID } from "node:crypto";
import { AppError } from "@/core/app-error";
import { requireBackendlessRestUrl } from "@/config/env";
import { adminConfig } from "./config";
import { adminRef } from "./store";

export async function auditAdminAccess(
  event: "login" | "logout" | "search" | "view" | "document" | "save_requested" | "save_verified" | "upload_requested" | "upload_verified",
  actor: string,
  target?: { leadId: string; objectId: string },
  operationId?: string,
) {
  // No names, emails, answers, URLs, OTPs, search terms, or session tokens in the audit table.
  const response = await fetch(requireBackendlessRestUrl() + "/data/" + adminConfig().auditTable, {
    method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: randomUUID(), event, occurredAt: Date.now(), actorRef: adminRef("actor", actor), operationId,
      ...(target ? { leadRef: adminRef("lead", target.leadId), studentRef: adminRef("student", target.objectId) } : {}),
    }),
  });
  if (!response.ok) {
    throw new AppError({ code: "INTERNAL_ERROR", message: "Admin access could not be recorded. Please try again." });
  }
}
