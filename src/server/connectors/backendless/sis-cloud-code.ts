import { invokeCloudCode } from "@/server/connectors/backendless/cloud-code-client";

const HONOR_TEMPLATE_ID = "1leXqbMKzIwI2EXnavTZX-XKMajr0m2TMqpkmV-5-hj8";
const TOS_TEMPLATE_ID = "1WKFdWXqTCNfdpy9WfpzXyLwM_rrsSEV1aiRHIg_4Ztg";

function buildReplaceRequests(replacements: Record<string, string>) {
  return Object.entries(replacements).map(([placeholder, replaceText]) => ({
    replaceAllText: {
      containsText: { text: placeholder, matchCase: true },
      replaceText,
    },
  }));
}

export async function copyDriveFile(
  sourceFileId: string,
  destinationFolderId: string,
  fileName: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  return invokeCloudCode({
    service: "uiBuilder",
    method: "GDriveCopyFileIDtoFolderIDFrontEnd",
    body: {
      sourceFileID: sourceFileId,
      destinationFolderID: destinationFolderId,
      fileName,
    },
    fetchImpl,
  });
}

export async function allowDriveFileAccess(
  sourceFileId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  return invokeCloudCode({
    service: "uiBuilder",
    method: "GDriveAllowFileAccessByFileIDFrontEnd",
    body: { sourceFileID: sourceFileId },
    fetchImpl,
  });
}

export async function docsBatchUpdate(
  documentId: string,
  replacements: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  const raw = await invokeCloudCode<string | Record<string, unknown>>({
    service: "BG_30_SIS_SECURITY",
    method: "SISSecureProxyPost",
    body: {
      action: "docsBatchUpdate",
      payload: {
        documentId: String(documentId),
        requests: buildReplaceRequests(replacements),
      },
    },
    fetchImpl,
  });

  if (typeof raw === "string") {
    return JSON.parse(raw) as Record<string, unknown>;
  }

  return raw;
}

export async function uploadFileToDrive(
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  return invokeCloudCode({
    service: "BG_30_SIS_SECURITY",
    method: "SISUploadFileToDrivePost",
    body,
    fetchImpl,
  });
}

export async function completeSisForm(
  event: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  return invokeCloudCode({
    service: "BG_21_Microschool",
    method: "SISCompletedForm",
    body: event,
    fetchImpl,
  });
}

export function buildHonorPdfUrl(documentId: string): string {
  return `https://docs.google.com/feeds/download/documents/export/Export?id=${documentId}&exportFormat=pdf`;
}

export const HONOR_TEMPLATE = HONOR_TEMPLATE_ID;
export const TOS_TEMPLATE = TOS_TEMPLATE_ID;
