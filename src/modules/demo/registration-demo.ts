import { buildStudentInfoState } from "@/modules/students/student-info-state";
import type { StudentLoadResult } from "@/modules/students/types";

const DEMO_LEAD_ID = "demo-family";
const DEMO_STUDENT_NAME = "Alex Example";
const DEMO_OBJECT_ID = "demo-student";

export function createRegistrationDemo(): StudentLoadResult {
  const student = {
    objectId: DEMO_OBJECT_ID,
    lead_id: DEMO_LEAD_ID,
    student_name: DEMO_STUDENT_NAME,
    student_last_name: "Example",
    student_birth_date: Date.UTC(2014, 2, 1),
    parent_name: "Sam Example",
    parent_last_name: "Example",
    parent_email: "parent@example.test",
    parent_phone: "+1 555 010 0200",
    parent_relation: "Parent",
    most_interested_in: "Building model rockets, swimming, and music",
    learning_environment_past_12_months: "A mix of home learning and public school",
    learning_experiece_past_12_months: "Alex learns best through practical projects and clear examples.",
    school_like_to_see: "More confidence with independent work and public speaking",
    student_last_school_name: "Example School",
    computer_system: "Windows",
    starting_date: Date.UTC(2026, 8, 1),
    length_of_staying: "The full school year",
    uploadTranscript: "I can upload them",
    honorCodeSigned: "Completed",
    ToSBool: true,
    is_complete_sis: true,
  };

  return {
    student,
    studentInfo: buildStudentInfoState(DEMO_LEAD_ID, student, null),
    chargebeeId: null,
    enrolledStudents: [
      { objectId: DEMO_OBJECT_ID, studentName: DEMO_STUDENT_NAME },
    ],
  };
}
