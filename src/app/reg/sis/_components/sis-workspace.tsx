"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { LoadingPanel } from "@/app/reg/sis/_components/loading-panel";
import { ProgressRail } from "@/app/reg/sis/_components/progress-rail";
import { StepOnePreview } from "@/app/reg/sis/_components/step-one-preview";
import { StudentPicker } from "@/app/reg/sis/_components/student-picker";
import { INITIAL_ACTIVE_STEP } from "@/modules/wizard/steps";
import { getMainProgressStatuses } from "@/modules/wizard/progress";
import type { StudentLoadResult } from "@/modules/students/types";
import type { ApiResponse } from "@/server/http/api-envelope";

type SisWorkspaceProps = {
  leadId: string;
  initialStudentName: string;
};

export function SisWorkspace({ leadId, initialStudentName }: SisWorkspaceProps) {
  const router = useRouter();
  const [studentName, setStudentName] = useState(initialStudentName);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payload, setPayload] = useState<StudentLoadResult | null>(null);

  const loadStudent = useCallback(async (name: string) => {
    setLoadState("loading");
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        lead_id: leadId,
        student_name: name,
      });
      const response = await fetch(`/api/students/load?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await response.json()) as ApiResponse<StudentLoadResult>;

      if (!body.success) {
        throw new Error(body.error.message);
      }

      setPayload(body.data);
      setStudentName(body.data.studentInfo.studentName);
      setLoadState("ready");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load student information.";
      setErrorMessage(message);
      setLoadState("error");
      toast.error(message);
    }
  }, [leadId]);

  useEffect(() => {
    void loadStudent(initialStudentName);
  }, [initialStudentName, loadStudent]);

  const handleStudentChange = (nextStudentName: string) => {
    const params = new URLSearchParams({
      lead_id: leadId,
      student_name: nextStudentName,
    });
    router.replace(`/reg/sis?${params.toString()}`);
    setStudentName(nextStudentName);
    void loadStudent(nextStudentName);
  };

  const progressSteps = payload
    ? getMainProgressStatuses(INITIAL_ACTIVE_STEP, payload.studentInfo.stepCompletion)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-title font-semibold text-foreground">Student Information</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Complete each section to finish registration for your student.
        </p>
      </div>

      {loadState === "loading" && <LoadingPanel />}

      {loadState === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-card p-6">
          <h2 className="text-section font-semibold text-foreground">Could not load form</h2>
          <p className="mt-2 text-body text-muted-foreground">{errorMessage}</p>
        </div>
      )}

      {loadState === "ready" && payload && (
        <>
          <ProgressRail steps={progressSteps} />

          <StudentPicker
            students={payload.enrolledStudents}
            selectedStudentName={studentName}
            onStudentChange={handleStudentChange}
          />

          <StepOnePreview
            student={payload.student}
            studentName={payload.studentInfo.studentName}
          />
        </>
      )}
    </div>
  );
}
