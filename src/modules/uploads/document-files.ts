import { TRANSCRIPT_DELIVERY_OPTIONS } from "@/modules/wizard/transcript-fields";

export const DOCUMENT_FIELDS = [
  "studentBirthCert", "studentPic", "upload_student_curreny_learning",
  "upload_copy_EIP_504_plan", "honorCodeURL", "ToSURL", "uploadTranscript",
] as const;

export function isDriveDocument(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      ["drive.google.com", "docs.google.com"].includes(url.hostname);
  } catch { return false; }
}

function documentKey(value: string): string {
  if (!isDriveDocument(value)) return value;
  const url = new URL(value);
  return url.pathname.match(/\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id") ?? url.href;
}

/** Accept legacy arrays/JSON and guarded admin links; never render ciphertext or arbitrary URLs. */
export function readDocumentFiles(value: unknown): string[] {
  if (typeof value === "string" && value.trim().startsWith("[")) {
    try { return readDocumentFiles(JSON.parse(value)); } catch { return []; }
  }
  const values = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();
  return values.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter((item) => {
    if (!isDriveDocument(item) && !item.startsWith("/api/admin/document?")) return false;
    const key = documentKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function readIepFiles(student: Record<string, unknown>): string[] {
  return readDocumentFiles([...readDocumentFiles(student.upload_copy_EIP_504_plan), ...readDocumentFiles(student.IEPFiles)]);
}

export function readStudentTranscriptFiles(student: Record<string, unknown>): string[] {
  return readDocumentFiles([...readDocumentFiles(student.transcriptFiles), ...readDocumentFiles(student.uploadTranscript)]);
}

/** Form saves change answers, not document locations. Upload endpoints own document changes. */
export function preserveDocumentFields(fields: Record<string, unknown>, current: Record<string, unknown>) {
  const next = { ...fields };
  for (const field of [...DOCUMENT_FIELDS.filter((f) => f !== "uploadTranscript"), "transcriptFiles", "IEPFiles"]) {
    if (field in next) {
      if (field in current) next[field] = current[field];
      else delete next[field];
    }
  }
  if ("uploadTranscript" in next) {
    if (TRANSCRIPT_DELIVERY_OPTIONS.some((choice) => next.uploadTranscript === choice)) {
      if (isDriveDocument(current.uploadTranscript)) next.transcriptFiles = readStudentTranscriptFiles(current);
    } else if ("uploadTranscript" in current) next.uploadTranscript = current.uploadTranscript;
    else delete next.uploadTranscript;
  }
  return next;
}
