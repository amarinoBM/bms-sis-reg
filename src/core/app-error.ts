export const APP_ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INVALID_INPUT",
  "VERSION_FROZEN",
  "APPROVAL_REQUIRED",
  "EVIDENCE_REQUIRED",
  "DUPLICATE_OPERATION",
  "DRAFT_CHANGED_ELSEWHERE",
  "EXTERNAL_WRITE_FAILED",
  "EXTERNAL_READBACK_MISMATCH",
  "INTERNAL_ERROR",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly exposeMessage: string;
  readonly causeDetail?: string;

  constructor(options: {
    code: AppErrorCode;
    message: string;
    status?: number;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.exposeMessage = options.message;
    this.status = options.status ?? statusForCode(options.code);
    if (options.cause instanceof Error) {
      this.causeDetail = options.cause.message;
    } else if (typeof options.cause === "string") {
      this.causeDetail = options.cause;
    }
  }
}

export function statusForCode(code: AppErrorCode): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "INVALID_INPUT":
      return 400;
    case "VERSION_FROZEN":
    case "APPROVAL_REQUIRED":
    case "EVIDENCE_REQUIRED":
    case "DUPLICATE_OPERATION":
    case "DRAFT_CHANGED_ELSEWHERE":
      return 409;
    case "EXTERNAL_WRITE_FAILED":
    case "EXTERNAL_READBACK_MISMATCH":
      return 502;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  return new AppError({
    code: "INTERNAL_ERROR",
    message: "Something went wrong. Try again or contact support.",
    cause: error,
  });
}
