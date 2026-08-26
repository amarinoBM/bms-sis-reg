export type MsStudentDirRow = Record<string, unknown> & {
  objectId?: string;
  lead_id?: string;
  student_name?: string;
  parent_email?: string;
  chargebeeID?: string;
  studentBirthCert?: string;
  studentPic?: string;
  upload_student_curreny_learning?: string;
  uploadTranscript?: string;
  slots?: WeeklySlotRelation[];
};

export type WeeklySlotRelation = Record<string, unknown> & {
  status?: string;
  chargebee?: string;
  email?: string;
};

export type EnrolledStudentSummary = {
  studentName: string;
  objectId: string;
};

export type StudentLoadResult = {
  student: MsStudentDirRow;
  chargebeeId: string | null;
  enrolledStudents: EnrolledStudentSummary[];
};
