import { AppError } from "@/core/app-error";
import { requireBackendlessRestUrl } from "@/config/env";
import { OTP_CACHE_TTL_SECONDS } from "@/config/backendless";

function encodeCacheKey(key: string): string {
  return encodeURIComponent(key);
}

export async function putCacheValue(
  key: string,
  value: unknown,
  ttlSeconds: number = OTP_CACHE_TTL_SECONDS,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const restUrl = requireBackendlessRestUrl();
  const response = await fetchImpl(
    `${restUrl}/cache/${encodeCacheKey(key)}?timeout=${ttlSeconds}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    },
  );

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: "Could not store OTP in cache.",
      status: 502,
      cause: await response.text(),
    });
  }
}

export async function getCacheValue<T>(
  key: string,
  fetchImpl: typeof fetch = fetch,
): Promise<T | null> {
  const restUrl = requireBackendlessRestUrl();
  const response = await fetchImpl(`${restUrl}/cache/${encodeCacheKey(key)}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: "Could not read OTP from cache.",
      status: 502,
    });
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export function parentOtpCacheKey(leadId: string): string {
  return `parentOTP-${leadId}`;
}
