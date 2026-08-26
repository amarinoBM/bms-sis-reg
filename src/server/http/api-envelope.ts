import type { AppErrorCode } from "@/core/app-error";

export type ApiSuccess<TData> = {
  success: true;
  data: TData;
};

export type ApiFailure = {
  success: false;
  error: {
    code: AppErrorCode;
    message: string;
  };
};

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

export function apiSuccess<TData>(data: TData): ApiSuccess<TData> {
  return { success: true, data };
}

export function apiFailure(code: AppErrorCode, message: string): ApiFailure {
  return {
    success: false,
    error: { code, message },
  };
}

export function isApiFailure(response: ApiResponse<unknown>): response is ApiFailure {
  return response.success === false;
}
