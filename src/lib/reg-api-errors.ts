import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { ApiClientError } from "@/lib/client-api";

export function messageFromRegApiError(error: unknown, fallback: string): string {
  if (error instanceof TypeError) {
    return "Couldn't reach the server. Check your connection and try again.";
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function handleRegSessionExpiry(
  error: unknown,
  leadId: string,
  router: AppRouterInstance,
): boolean {
  if (error instanceof ApiClientError && error.code === "UNAUTHENTICATED") {
    router.push(`/reg?lead_id=${encodeURIComponent(leadId)}`);
    return true;
  }

  return false;
}
