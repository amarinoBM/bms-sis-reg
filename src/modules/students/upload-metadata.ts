const DRIVE_FILE_ID_PATTERN = /\/d\/([^/]+)/;

export function extractDriveFileId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  const match = url.match(DRIVE_FILE_ID_PATTERN);
  return match?.[1] ?? null;
}

export function buildUploadMetadataFromUrl(
  url: string | null | undefined,
): { id: string; type: string } | null {
  const id = extractDriveFileId(url);

  if (!id) {
    return null;
  }

  return { id, type: "drive" };
}

import { readTranscriptFiles } from "@/modules/wizard/transcript-fields";

export function hydrateUploadMetadata(row: Record<string, unknown>): Record<string, unknown> {
  const hydrated = { ...row };

  if (!hydrated.birthCertMetaData && hydrated.studentBirthCert) {
    hydrated.birthCertMetaData = buildUploadMetadataFromUrl(
      String(hydrated.studentBirthCert),
    );
  }

  if (!hydrated.studentPicMetaData && hydrated.studentPic) {
    hydrated.studentPicMetaData = buildUploadMetadataFromUrl(String(hydrated.studentPic));
  }

  if (!hydrated.learningUploadMetaData && hydrated.upload_student_curreny_learning) {
    hydrated.learningUploadMetaData = buildUploadMetadataFromUrl(
      String(hydrated.upload_student_curreny_learning),
    );
  }

  const transcriptFiles = readTranscriptFiles(hydrated.transcriptFiles);
  if (!hydrated.transcriptMetaData && transcriptFiles[0]) {
    hydrated.transcriptMetaData = buildUploadMetadataFromUrl(transcriptFiles[0]);
  }

  if (
    !hydrated.transcriptMetaData &&
    typeof hydrated.uploadTranscript === "string" &&
    hydrated.uploadTranscript.startsWith("http")
  ) {
    hydrated.transcriptMetaData = buildUploadMetadataFromUrl(String(hydrated.uploadTranscript));
  }

  return hydrated;
}
