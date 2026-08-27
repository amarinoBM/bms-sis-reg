import { requireBackendlessRestUrl } from "@/config/env";

let cachedGuestToken: string | null = null;

export function clearBackendlessGuestToken(): void {
  cachedGuestToken = null;
}

export async function getBackendlessGuestToken(
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (cachedGuestToken) {
    return cachedGuestToken;
  }

  const restUrl = requireBackendlessRestUrl();
  const response = await fetchImpl(`${restUrl}/users/register/guest`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Backendless guest login failed (${response.status}).`,
    );
  }

  const payload = (await response.json()) as { "user-token"?: string };
  const token = payload["user-token"];

  if (!token) {
    throw new Error("Backendless guest login did not return a user-token.");
  }

  cachedGuestToken = token;
  return token;
}
