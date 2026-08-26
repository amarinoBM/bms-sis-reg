import { saveStudentRecord } from "@/modules/students/repository";
import {
  allowDriveFileAccess,
  buildHonorPdfUrl,
  copyDriveFile,
  docsBatchUpdate,
  HONOR_TEMPLATE,
} from "@/server/connectors/backendless/sis-cloud-code";
import { sendScheduledDocumentEmail } from "@/server/connectors/backendless/email-client";
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

  const bodyHtml = [
    `Dear ${input.parentName},`,
    "<br><br>I trust this email finds you well. Thank you for taking the time to review and sign the honor code.",
    "<br><br>Attached to this email, you will find a copy of the signed honor code for your records.",
    `<br><br><a href='${honorCodeURL}'>Brilliant Microschool Honor Code</a>`,
    "<br><br>Best Regards,",
    "<br><br>Parent Support Team",
    "<br>help@brilliantmicroschool.org",
  ].join("");

  await sendScheduledDocumentEmail(
    input.leadId,
    input.email,
    "Signed Honor Code",
    bodyHtml,
    fetchImpl,
  );

  return { honorCodeURL };
}
