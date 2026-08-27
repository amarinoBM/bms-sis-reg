/** Prior coursework subjects — values stored in CreditTransfer array on ms_student_dir. */

export const CREDIT_TRANSFER_SUBJECTS = [
  "Agriculture Sciences",
  "Algebra 1",
  "Algebra 2",
  "Anatomy and Physiology",
  "Audio/Video Production",
  "Automotive Technology",
  "Band",
  "Biology",
  "Business and Marketing",
  "Calculus",
  "Chemistry",
  "Chinese",
  "Choir",
  "Computer Science",
  "Creative Writing",
  "Culinary Arts",
  "Debate",
  "Digital Design",
  "Economics",
  "English 1",
  "English 2",
  "English 3",
  "English 4",
  "Environmental Science",
  "French",
  "Geography",
  "Geometry",
  "German",
  "Global Studies",
  "Health Education",
  "Health Sciences",
  "Integrated Math 1",
  "Integrated Math 2",
  "Integrated Math 3",
  "Journalism",
  "Orchestra",
  "Photography",
  "Physical Education",
  "Physics",
  "Pre-Algebra",
  "Pre-Calculus",
  "Psychology",
  "Sociology",
  "Spanish",
  "Statistics",
  "Theatre Arts/Drama",
  "U.S. Government",
  "U.S. History",
  "Visual Arts",
  "World History",
] as const;

export function filterCreditTransferSubjects(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...CREDIT_TRANSFER_SUBJECTS];
  }

  return CREDIT_TRANSFER_SUBJECTS.filter((subject) =>
    subject.toLowerCase().includes(normalized),
  );
}
