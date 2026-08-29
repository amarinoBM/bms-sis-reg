export type UploadType =
  | "birth_cert"
  | "student_pic"
  | "learning"
  | "transcript"
  | "iep";

export type UploadFieldMapping = {
  fieldKey: string;
  extraFieldKey?: string;
  metadataKey?: string;
  fileNamePrefix: string;
};

export const UPLOAD_FIELD_MAP: Record<UploadType, UploadFieldMapping> = {
  birth_cert: {
    fieldKey: "studentBirthCert",
    metadataKey: "birthCertMetaData",
    fileNamePrefix: "BirthCert_",
  },
  student_pic: {
    fieldKey: "studentPic",
    metadataKey: "studentPicMetaData",
    fileNamePrefix: "StudentPic_",
  },
  learning: {
    fieldKey: "upload_student_curreny_learning",
    fileNamePrefix: "Learning_",
  },
  transcript: {
    fieldKey: "transcriptFiles",
    fileNamePrefix: "Transcript_",
  },
  iep: {
    fieldKey: "upload_copy_EIP_504_plan",
    fileNamePrefix: "IEP_",
  },
};

export const DRIVE_FOLDER_ID = "1_xwT_J7TVSiBbUtQ_Mn6cl6dbDuLqx4K";

export function buildDriveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function isUploadType(value: string): value is UploadType {
  return value in UPLOAD_FIELD_MAP;
}
