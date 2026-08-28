import { createHmac } from "node:crypto";
import { sealData, unsealData } from "iron-session";
import { AppError } from "@/core/app-error";
import { requireBackendlessRestUrl } from "@/config/env";
import { getCacheValue, putCacheValue, deleteCacheValue } from "@/server/connectors/backendless/cache-client";
import { adminConfig } from "./config";

export function adminRef(kind: string, value: string): string {
  return createHmac("sha256", adminConfig().secret).update(kind + ":" + value).digest("hex");
}
function key(name: string) { return "reg-admin-v1-" + adminRef("store", name); }

export async function readAdminValue<T>(name: string): Promise<T | null> {
  const sealed = await getCacheValue<string>(key(name));
  if (typeof sealed !== "string") return null;
  const result = await unsealData<{ name: string; value: T }>(sealed, { password: adminConfig().secret });
  return result.name === name ? result.value : null;
}
export async function writeAdminValue(name: string, value: unknown, ttl: number): Promise<void> {
  const sealed = await sealData({ name, value }, { password: adminConfig().secret, ttl });
  try {
    await putCacheValue(key(name), sealed, ttl);
  } catch (error) {
    if (!(error instanceof AppError) || error.code !== "EXTERNAL_WRITE_FAILED") throw error;
    throw new AppError({ code: "EXTERNAL_WRITE_FAILED", status: 502,
      message: "Could not save admin sign-in state. Request a new code and try again." });
  }
}
export async function removeAdminValue(name: string) {
  await deleteCacheValue(key(name));
}

// increment/get guarantees unique updated values across concurrent server instances.
export async function incrementAdminCounter(name: string): Promise<number> {
  const response = await fetch(requireBackendlessRestUrl() + "/counters/" + key(name) + "/increment/get", {
    method: "PUT", cache: "no-store", headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new AppError({ code: "INTERNAL_ERROR", message: "Admin sign-in is temporarily unavailable." });
  const count: unknown = await response.json();
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 1) {
    throw new AppError({ code: "INTERNAL_ERROR", message: "Admin sign-in is temporarily unavailable." });
  }
  return count;
}
export async function adminRateLimit(name: string, seconds: number, max: number) {
  const window = Math.floor(Date.now() / (seconds * 1000));
  if (await incrementAdminCounter("rate:" + name + ":" + window) > max) {
    throw new AppError({ code: "FORBIDDEN", message: "Too many attempts. Please wait and try again." });
  }
}
