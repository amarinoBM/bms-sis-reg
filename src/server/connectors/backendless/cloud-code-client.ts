import { AppError } from "@/core/app-error";
import { requireBackendlessCodeUrl } from "@/config/env";

import {
  clearBackendlessGuestToken,
  getBackendlessGuestToken,
} from "@/server/connectors/backendless/guest-session";

type CloudCodeOptions = {
  service: string;
  method: string;
  body: Record<string, unknown> | string;
  fetchImpl?: typeof fetch;
};

function isAuthenticationFailure(status: number, bodyText: string): boolean {
  return (
    status === 401 ||
    (status === 400 && bodyText.includes("Authentication required"))
  );
}

export async function invokeCloudCode<T>(
  options: CloudCodeOptions,
): Promise<T> {
  const { service, method, body, fetchImpl = fetch } = options;
  const codeUrl = requireBackendlessCodeUrl();
  const endpoint = `${codeUrl}/services/${encodeURIComponent(service)}/${encodeURIComponent(method)}`;

  const attempt = async (guestToken: string) => {
    return fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-token": guestToken,
      },
      body: JSON.stringify(body),
    });
  };

  let guestToken = await getBackendlessGuestToken(fetchImpl);
  let response = await attempt(guestToken);

  if (isAuthenticationFailure(response.status, await response.clone().text())) {
    clearBackendlessGuestToken();
    guestToken = await getBackendlessGuestToken(fetchImpl);
    response = await attempt(guestToken);
  }

  if (!response.ok) {
    const cause = await response.text();
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Cloud Code ${service}.${method} failed.`,
      status: 502,
      cause,
    });
  }

  return (await response.json()) as T;
}

export async function encryptStudentDirRow(
  leadId: string,
  studentDirObject: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  return invokeCloudCode({
    service: "BG_13_HR",
    method: "EncryptDecryptMSStudentDir",
    body: {
      process: "encrypt",
      key: leadId,
      studentDirObject,
    },
    fetchImpl,
  });
}

export async function decryptStudentDirRow(
  leadId: string,
  studentDirObject: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  return invokeCloudCode({
    service: "BG_13_HR",
    method: "EncryptDecryptMSStudentDir",
    body: {
      process: "decrypt",
      key: leadId,
      studentDirObject,
    },
    fetchImpl,
  });
}
