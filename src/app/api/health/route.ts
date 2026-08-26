import { jsonSuccess, runRoute } from "@/server/http/route-handler";

import { APP_NAME } from "@/config/app";

export async function GET() {
  return runRoute(async () => ({
    status: "ok" as const,
    app: APP_NAME,
  }));
}

export async function HEAD() {
  return jsonSuccess({ status: "ok" as const, app: APP_NAME });
}
