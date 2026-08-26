import { saveStudentRecord } from "@/modules/students/repository";
import {
  allowDriveFileAccess,
  buildHonorPdfUrl,
  copyDriveFile,
  docsBatchUpdate,
  HONOR_TEMPLATE,
} from "@/server/connectors/backendless/sis-cloud-code";
import { sendScheduledDocumentEmail } from "@/server/connectors/backendless/email-client";
import { buildHonorSignedEmailHtml } from "@/modules/email/bms-email-template";
import { DRIVE_FOLDER_ID } from "@/modules/uploads/upload-config";

function formatSignedDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function buildHonorFileName(parentName: string, studentName: string): string {
  return `BMS Honor Code - ${parentName} and ${studentName}`;
}

type SignHonorInput = {
  leadId: string;
  objectId: string;
  parentSignature: string;
  studentSignature: string;
  parentName: string;
  studentName: string;
  email: string;
};

export async function signHonorCode(
  input: SignHonorInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ honorCodeURL: string }> {
  const copied = await copyDriveFile(
    HONOR_TEMPLATE,
    DRIVE_FOLDER_ID,
    buildHonorFileName(input.parentName, input.studentName),
    fetchImpl,
  );

  const fileId = String(copied.id ?? "");
  if (!fileId) {
    throw new Error("Honor template copy did not return a file id.");
  }

  await allowDriveFileAccess(fileId, fetchImpl);

  const dateSigned = formatSignedDate(new Date());
  const updateResult = await docsBatchUpdate(fileId, {
    "{{parentSignature}}": input.parentSignature,
    "{{studentSignature}}": input.studentSignature,
    "{{dateSigned}}": dateSigned,
  }, fetchImpl);

  const documentId = String(updateResult.documentId ?? fileId);
  const honorCodeURL = buildHonorPdfUrl(documentId);

  await saveStudentRecord(
    input.leadId,
    input.objectId,
    {
      honorCodeSigned: "Completed",
      honorCodeURL,
      "10disabled": true,
    },
    fetchImpl,
  );

  const bodyHtml = buildHonorSignedEmailHtml({
    parentName: input.parentName,
    studentName: input.studentName,
    documentUrl: honorCodeURL,
  });

  await sendScheduledDocumentEmail(
    input.leadId,
    input.email,
    "Signed honor code — Brilliant Microschools",
    bodyHtml,
    fetchImpl,
  );

  return { honorCodeURL };
}
