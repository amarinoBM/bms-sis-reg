import { AppError } from "@/core/app-error";

// Leave room for multipart headers below the hosting provider's 4.5 MB request cap.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Shared UI copy for registration file uploads. */
export const UPLOAD_FORMAT_HINT = "PDF, JPG, PNG, or WEBP up to 4 MB.";

export const UPLOAD_FIELD_DESCRIPTION = `${UPLOAD_FORMAT_HINT} The file saves when you upload it.`;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

export function assertUploadFileAllowed(file: File): void {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new AppError({
      code: "INVALID_INPUT",
      message: "File is too large. Maximum size is 4 MB.",
    });
  }

  const mime = file.type.trim().toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (mime && ALLOWED_MIME_TYPES.has(mime)) {
    return;
  }

  if (!mime && extension && ALLOWED_EXTENSIONS.has(extension)) {
    return;
  }

  throw new AppError({
    code: "INVALID_INPUT",
    message: "Upload PDF or image files only (PDF, JPG, PNG, WEBP).",
  });
}
