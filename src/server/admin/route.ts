import { AppError } from "@/core/app-error";
import { getServerEnv } from "@/config/env";
import { runRoute } from "@/server/http/route-handler";
import { ZodError } from "zod";

export async function adminRoute<T>(request: Request, handler: () => Promise<T>) {
  const response = await runRoute(async () => {
    if (request.method !== "GET" && request.headers.get("origin") !== new URL(getServerEnv().publicAppUrl).origin) {
      throw new AppError({ code: "FORBIDDEN", message: "This request is not allowed from that site." });
    }
    try {
      return await handler();
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) {
        throw new AppError({ code: "INVALID_INPUT", message: "Check your request and try again." });
      }
      throw error;
    }
  }, request);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
