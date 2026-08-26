import type { MsStudentDirRow } from "@/modules/students/types";

const birthDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatBirthDate(value: unknown): string | null {
  if (typeof value !== "number") {
    return null;
  }

  return birthDateFormatter.format(new Date(value));
}

type StepOnePreviewProps = {
  student: MsStudentDirRow;
  studentName: string;
};

export function StepOnePreview({ student, studentName }: StepOnePreviewProps) {
  const birthDate = formatBirthDate(student.student_birth_date);

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-section font-semibold text-foreground">General information</h2>
      <p className="mt-2 text-body text-muted-foreground">
        To edit {studentName}&apos;s information, review what we have on file. Step 1
        forms will be editable in the next sprint.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-label text-muted-foreground">Student name</dt>
          <dd className="text-body font-medium text-foreground">
            {String(student.student_name ?? studentName)}
          </dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">Parent name</dt>
          <dd className="text-body font-medium text-foreground">
            {String(student.parent_name ?? "—")}
          </dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">Parent email</dt>
          <dd className="text-body font-medium text-foreground">
            {String(student.parent_email ?? student.email ?? "—")}
          </dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">Birth date</dt>
          <dd className="text-body font-medium text-foreground">{birthDate ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
