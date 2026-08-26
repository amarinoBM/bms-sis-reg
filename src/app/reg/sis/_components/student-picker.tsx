import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EnrolledStudentSummary } from "@/modules/students/types";

type StudentPickerProps = {
  students: EnrolledStudentSummary[];
  selectedStudentName: string;
  onStudentChange: (studentName: string) => void;
};

export function StudentPicker({
  students,
  selectedStudentName,
  onStudentChange,
}: StudentPickerProps) {
  if (students.length <= 1) {
    return (
      <p className="text-body text-muted-foreground">
        Student: <span className="font-medium text-foreground">{selectedStudentName}</span>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-label font-medium uppercase tracking-label text-muted-foreground">
        Select student
      </p>
      <Select
        value={selectedStudentName}
        onValueChange={(value) => {
          if (value) {
            onStudentChange(value);
          }
        }}
      >
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder="Choose a student" />
        </SelectTrigger>
        <SelectContent>
          {students.map((student) => (
            <SelectItem key={student.objectId} value={student.studentName}>
              {student.studentName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
