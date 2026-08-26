/** Google Drive file ids for honor code and terms templates (same as Cloud Code copy source). */
export const HONOR_DOCUMENT_TEMPLATE_ID = "1leXqbMKzIwI2EXnavTZX-XKMajr0m2TMqpkmV-5-hj8";
export const TOS_DOCUMENT_TEMPLATE_ID = "1WKFdWXqTCNfdpy9WfpzXyLwM_rrsSEV1aiRHIg_4Ztg";

export function buildDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function buildDriveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export const HONOR_DOCUMENT_PREVIEW_URL = buildDrivePreviewUrl(HONOR_DOCUMENT_TEMPLATE_ID);
export const TOS_DOCUMENT_PREVIEW_URL = buildDrivePreviewUrl(TOS_DOCUMENT_TEMPLATE_ID);
