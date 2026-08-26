import { AppError } from "@/core/app-error";
import { runRoute } from "@/server/http/route-handler";

export async function GET() {
  return runRoute(async () => {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Sample route for typed API failures.",
    });
  });
}
