import { NextResponse } from "next/server";

import { AppError, isAppError, toAppError } from "@/core/app-error";
import {
  apiFailure,
  apiSuccess,
  type ApiResponse,
} from "@/server/http/api-envelope";
import { assertSameOrigin } from "@/server/http/assert-same-origin";

export function jsonSuccess<TData>(
  data: TData,
  init?: ResponseInit,
): NextResponse<ApiResponse<TData>> {
  return NextResponse.json(apiSuccess(data), init);
}

export function jsonFailure(
  code: AppError["code"],
  message: string,
  status: number,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(apiFailure(code, message), { status });
}

export function handleRouteError(error: unknown): NextResponse<ApiResponse<never>> {
  const appError = toAppError(error);

  if (!isAppError(error)) {
    console.error("[route-error]", {
      code: appError.code,
      detail: appError.causeDetail,
    });
  }

  return jsonFailure(appError.code, appError.exposeMessage, appError.status);
}

export async function runRoute<TData>(
  handler: () => Promise<TData>,
  request?: Request,
): Promise<NextResponse<ApiResponse<TData>>> {
  try {
    if (request) {
      assertSameOrigin(request);
    }
    const data = await handler();
    return jsonSuccess(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
