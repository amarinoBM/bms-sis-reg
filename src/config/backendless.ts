export const BACKENDLESS_TABLES = {
  msStudentDir: "ms_student_dir",
  studentInfo: "StudentInfo",
  weeklySlots: "weekly_slots",
  parentMaps: "parent_maps",
  stateRegs: "state_regs",
} as const;

export const OTP_CACHE_TTL_SECONDS = 1800;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

export const EMAIL_FROM = {
  name: "Brilliant Microschools",
  address: "help@brilliantmicroschool.org",
} as const;

export const OTP_EMAIL_SUBJECT = "Your Brilliant Microschools login code";
