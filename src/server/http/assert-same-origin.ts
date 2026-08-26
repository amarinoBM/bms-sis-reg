import { AppError } from "@/core/app-error";
import { getServerEnv } from "@/config/env";

export function assertSameOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  const allowedOrigin = new URL(getServerEnv().publicAppUrl).origin;
  if (origin !== allowedOrigin) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "This request is not allowed from that site.",
    });
  }
}
