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
  selectedObjectId?: string;
  onStudentChange: (studentName: string) => void;
};

export function StudentPicker({
  students,
  selectedStudentName,
  selectedObjectId,
  onStudentChange,
}: StudentPickerProps) {
  if (students.length <= 1) {
    return (
      <p className="min-w-0 text-body text-muted-foreground break-words">
        Student: <span className="font-medium text-foreground">{selectedStudentName}</span>
      </p>
    );
  }

  const selectedValue =
    selectedObjectId && students.some((student) => student.objectId === selectedObjectId)
      ? selectedObjectId
      : (students.find((student) => student.studentName === selectedStudentName)?.objectId ??
        "");

  return (
    <div className="space-y-2">
      <Label htmlFor="student-picker">Select student</Label>
      <Select
        value={selectedValue}
        items={students.map((student) => ({
          value: student.objectId,
          label: student.studentName,
        }))}
        onValueChange={(value) => {
          const nextStudent = students.find((student) => student.objectId === value);
          if (nextStudent) {
            onStudentChange(nextStudent.studentName);
          }
        }}
      >
        <SelectTrigger id="student-picker" className={cn(REG_TOUCH_CLASS, "w-full max-w-md min-w-0")}>
          <SelectValue placeholder="Choose a student" />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} sideOffset={8} className="min-w-[var(--anchor-width)] w-max max-w-[min(100vw-3rem,var(--available-width))]">
          {students.map((student) => (
            <SelectItem key={student.objectId} value={student.objectId}>
              {student.studentName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
