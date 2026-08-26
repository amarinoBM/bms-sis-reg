import { describe, expect, it } from "vitest";

import { AppError, statusForCode, toAppError } from "@/core/app-error";
import { apiFailure, apiSuccess, isApiFailure } from "@/server/http/api-envelope";

describe("api envelope", () => {
  it("returns typed success payloads", () => {
    expect(apiSuccess({ ready: true })).toEqual({
      success: true,
      data: { ready: true },
    });
  });

  it("returns safe typed failures without stack traces", () => {
    const failure = apiFailure("FORBIDDEN", "You do not have access.");
    expect(failure).toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have access.",
      },
    });
    expect(JSON.stringify(failure)).not.toContain("stack");
    expect(isApiFailure(failure)).toBe(true);
  });
});

describe("app errors", () => {
  it("maps known codes to HTTP statuses", () => {
    expect(statusForCode("FORBIDDEN")).toBe(403);
    expect(statusForCode("DRAFT_CHANGED_ELSEWHERE")).toBe(409);
    expect(statusForCode("EXTERNAL_WRITE_FAILED")).toBe(502);
  });

  it("normalizes unknown errors to a generic internal failure", () => {
    const normalized = toAppError(new Error("backendless timeout"));
    expect(normalized.code).toBe("INTERNAL_ERROR");
    expect(normalized.exposeMessage).not.toContain("backendless");
    expect(normalized.causeDetail).toBe("backendless timeout");
  });

  it("preserves explicit app errors", () => {
    const error = new AppError({
      code: "NOT_FOUND",
      message: "Student Record not found.",
    });
    expect(toAppError(error)).toBe(error);
  });
});
