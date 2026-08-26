import { APP_ERROR_CODES, type AppErrorCode } from "@/core/app-error";
import type { ApiResponse } from "@/server/http/api-envelope";

export class ApiClientError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(options: { code: AppErrorCode; message: string; status: number }) {
    super(options.message);
    this.name = "ApiClientError";
    this.code = options.code;
    this.status = options.status;
  }
}

function isAppErrorCode(value: string): value is AppErrorCode {
  return (APP_ERROR_CODES as readonly string[]).includes(value);
}

async function readApiResponseBody<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError({
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Try again or contact support.",
      status: response.status,
    });
  }
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = await readApiResponseBody<T>(response);

  if (!response.ok || !payload.success) {
    const code =
      !payload.success && isAppErrorCode(payload.error.code)
        ? payload.error.code
        : "INTERNAL_ERROR";
    const message = !payload.success
      ? payload.error.message
      : "Something went wrong. Try again or contact support.";

    throw new ApiClientError({ code, message, status: response.status });
  }

  return payload.data;
}

export async function fetchApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  return readApiResponse<T>(response);
}

export async function postApi<T>(
  url: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return readApiResponse<T>(response);
}

export async function postFormApi<T>(url: string, formData: FormData): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  return readApiResponse<T>(response);
}
