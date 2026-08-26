import { AppError } from "@/core/app-error";
import { requireBackendlessRestUrl } from "@/config/env";
import {
  OTP_CACHE_TTL_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/config/backendless";

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

export async function deleteCacheValue(
  key: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const restUrl = requireBackendlessRestUrl();
  const response = await fetchImpl(`${restUrl}/cache/${encodeCacheKey(key)}`, {
    method: "DELETE",
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: "Could not delete cache value.",
      status: 502,
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

export function parentOtpSendCountKey(leadId: string): string {
  return `parentOTP-send-count-${leadId}`;
}

export function parentOtpVerifyFailKey(leadId: string): string {
  return `parentOTP-verify-fail-${leadId}`;
}

export function parentOtpLastSendKey(leadId: string): string {
  return `parentOTP-last-send-${leadId}`;
}

const OTP_SEND_WINDOW_SECONDS = 3600;
const OTP_SEND_MAX_PER_WINDOW = 10;
const OTP_VERIFY_FAIL_MAX = 10;

export async function incrementRateLimit(
  key: string,
  ttlSeconds: number,
  maxAttempts: number,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const current = (await getCacheValue<number>(key, fetchImpl)) ?? 0;

  if (current >= maxAttempts) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Too many attempts. Please wait and try again.",
    });
  }

  await putCacheValue(key, current + 1, ttlSeconds, fetchImpl);
}

export async function assertOtpSendAllowed(
  leadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  await incrementRateLimit(
    parentOtpSendCountKey(leadId),
    OTP_SEND_WINDOW_SECONDS,
    OTP_SEND_MAX_PER_WINDOW,
    fetchImpl,
  );
}

export async function assertOtpResendCooldown(
  leadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const lastSendMs = await getCacheValue<number>(parentOtpLastSendKey(leadId), fetchImpl);

  if (lastSendMs === null || lastSendMs === undefined) {
    return;
  }

  const elapsedMs = Date.now() - lastSendMs;
  const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;

  if (elapsedMs < cooldownMs) {
    const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
    throw new AppError({
      code: "FORBIDDEN",
      message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
    });
  }
}

export async function recordOtpSend(
  leadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  await putCacheValue(
    parentOtpLastSendKey(leadId),
    Date.now(),
    OTP_RESEND_COOLDOWN_SECONDS,
    fetchImpl,
  );
}

export async function assertOtpVerifyAllowed(
  leadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  await incrementRateLimit(
    parentOtpVerifyFailKey(leadId),
    OTP_CACHE_TTL_SECONDS,
    OTP_VERIFY_FAIL_MAX,
    fetchImpl,
  );
}

export async function clearOtpVerifyFailures(
  leadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  await deleteCacheValue(parentOtpVerifyFailKey(leadId), fetchImpl);
}
