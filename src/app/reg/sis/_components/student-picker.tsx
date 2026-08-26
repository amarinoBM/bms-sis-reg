import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { cn } from "@/lib/utils";
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
      <Label htmlFor="student-picker">Select student</Label>
      <Select
        value={selectedStudentName}
        onValueChange={(value) => {
          if (value) {
            onStudentChange(value);
          }
        }}
      >
        <SelectTrigger id="student-picker" className={cn(REG_TOUCH_CLASS, "w-full max-w-md")}>
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
