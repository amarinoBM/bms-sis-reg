import { uploadFileToDrive } from "@/server/connectors/backendless/sis-cloud-code";
import type { AdminEditActor } from "@/modules/admin/policy";
import { readStudentTranscriptFiles } from "@/modules/uploads/document-files";
import { saveStudentRecord } from "@/modules/students/repository";
import {
  buildDriveFileUrl,
  DRIVE_FOLDER_ID,
  UPLOAD_FIELD_MAP,
  type UploadType,
} from "@/modules/uploads/upload-config";

type UploadStudentFileInput = {
  leadId: string;
  objectId: string;
  uploadType: UploadType;
  file: File;
  parentName: string;
  studentName: string;
  currentRow?: Record<string, unknown>;
  actor?: AdminEditActor;
};

function fileToDataUrl(file: File): Promise<string> {
  return file.arrayBuffer().then((buffer) => {
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${file.type || "application/octet-stream"};base64,${base64}`;
  });
}

function extractFileId(metadata: Record<string, unknown>): string | null {
  const id = metadata.id ?? metadata.fileId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function uploadStudentFile(
  input: UploadStudentFileInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ fieldKey: string; url: string }> {
  const mapping = UPLOAD_FIELD_MAP[input.uploadType];
  const fileUrl = await fileToDataUrl(input.file);
  const fileName = `${mapping.fileNamePrefix}${input.parentName}_${input.studentName}`;

  const rawMetadata = await uploadFileToDrive(
    {
      fileUrl,
      fileName,
      destinationFolderID: DRIVE_FOLDER_ID,
      mimeType: input.file.type || "application/octet-stream",
    },
    fetchImpl,
  );

  const metadata =
    typeof rawMetadata === "string"
      ? (JSON.parse(rawMetadata) as Record<string, unknown>)
      : rawMetadata;

  const fileId = extractFileId(metadata);
  if (!fileId) {
    throw new Error("Upload did not return a Drive file id.");
  }

  const driveUrl = buildDriveFileUrl(fileId);
  const savePayload: Record<string, unknown> = {};
  if (input.actor) {
    savePayload.UpdateHistory = [
      ...(Array.isArray(input.currentRow?.UpdateHistory) ? input.currentRow.UpdateHistory : []),
      { at: Date.now(), step: "upload", fields: [mapping.fieldKey], actor: input.actor },
    ];
  }

  if (input.uploadType === "transcript") {
    const existingFiles = readStudentTranscriptFiles(input.currentRow ?? {});
    savePayload.transcriptFiles = [...existingFiles, driveUrl];
  } else {
    savePayload[mapping.fieldKey] = driveUrl;

    if (mapping.metadataKey) {
      savePayload[mapping.metadataKey] = metadata;
    }
  }

  if (mapping.marksStepDisabled) {
    savePayload[`${mapping.marksStepDisabled}disabled`] = true;
  }

  await saveStudentRecord(input.leadId, input.objectId, savePayload, fetchImpl);

  return { fieldKey: mapping.fieldKey, url: driveUrl };
}
