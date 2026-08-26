import { z } from "zod";

const serverEnvSchema = z.object({
  BACKENDLESS_REST_URL: z.url(),
  BACKENDLESS_CODE_URL: z.url().optional(),
  EXTERNAL_WRITES_ENABLED: z.enum(["true", "false"]).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
});

export type ServerEnv = {
  backendlessRestUrl: string;
  backendlessCodeUrl?: string;
  externalWritesEnabled: boolean;
  authSecret: string;
  publicAppUrl: string;
};

export function getServerEnv(env: Record<string, string | undefined> = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(env);

  if (!parsed.success && env.NODE_ENV === "production") {
    throw new Error("Invalid server environment configuration.");
  }

  if (env.NODE_ENV === "production" && !env.AUTH_SECRET?.trim()) {
    throw new Error("AUTH_SECRET is required in production.");
  }

  const authSecret =
    env.AUTH_SECRET?.trim() ?? "development-only-secret-min-32-chars!!";

  return {
    backendlessRestUrl: env.BACKENDLESS_REST_URL ?? "",
    backendlessCodeUrl: env.BACKENDLESS_CODE_URL,
    externalWritesEnabled: env.EXTERNAL_WRITES_ENABLED === "true",
    authSecret,
    publicAppUrl: env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3010",
  };
}

export function requireBackendlessRestUrl(env: NodeJS.ProcessEnv = process.env): string {
  const restUrl = env.BACKENDLESS_REST_URL;

  if (!restUrl) {
    throw new Error("BACKENDLESS_REST_URL is not configured.");
  }

  return restUrl.replace(/\/$/, "");
}

export function requireBackendlessCodeUrl(env: NodeJS.ProcessEnv = process.env): string {
  const codeUrl = env.BACKENDLESS_CODE_URL;

  if (!codeUrl) {
    throw new Error("BACKENDLESS_CODE_URL is not configured.");
  }

  return codeUrl.replace(/\/$/, "");
}
