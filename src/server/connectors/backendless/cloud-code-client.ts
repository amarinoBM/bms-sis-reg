import { AppError } from "@/core/app-error";
import { requireBackendlessCodeUrl } from "@/config/env";

type CloudCodeOptions = {
  service: string;
  method: string;
  body: Record<string, unknown> | string;
  fetchImpl?: typeof fetch;
};

export async function invokeCloudCode<T>(
  options: CloudCodeOptions,
): Promise<T> {
  const { service, method, body, fetchImpl = fetch } = options;
  const codeUrl = requireBackendlessCodeUrl();
  const response = await fetchImpl(
    `${codeUrl}/services/${encodeURIComponent(service)}/${encodeURIComponent(method)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Cloud Code ${service}.${method} failed.`,
      status: 502,
      cause: await response.text(),
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
