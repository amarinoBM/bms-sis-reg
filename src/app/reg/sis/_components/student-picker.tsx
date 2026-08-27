"use client";

import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [open, setOpen] = useState(false);

  if (students.length <= 1) {
    return (
      <p className="text-label text-muted-foreground">
        Registering{" "}
        <span className="font-medium text-foreground">{selectedStudentName}</span>
      </p>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <p className="text-label text-muted-foreground sm:text-right">
        Registering{" "}
        <span className="font-medium text-foreground">{selectedStudentName}</span>
        <span className="mx-1.5 text-muted-foreground/60">·</span>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="text-label font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            />
          }
        >
          Switch student
        </PopoverTrigger>
      </p>
      <PopoverContent align="end" className="w-72 p-3">
        <PopoverHeader className="px-1">
          <PopoverTitle className="text-sm">Switch student</PopoverTitle>
          <PopoverDescription>
            You will return to the first section for the other student.
          </PopoverDescription>
        </PopoverHeader>
        <ul className="mt-2 space-y-1">
          {students.map((student) => {
            const isSelected =
              student.objectId === selectedObjectId ||
              student.studentName === selectedStudentName;

            return (
              <li key={student.objectId}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-muted font-medium text-foreground"
                      : "text-foreground hover:bg-muted/70",
                  )}
                  onClick={() => {
                    setOpen(false);
                    if (!isSelected) {
                      onStudentChange(student.studentName);
                    }
                  }}
                >
                  {student.studentName}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
