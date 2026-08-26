"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { HonorStep } from "@/app/reg/sis/_components/honor-step";
import { LoadingPanel } from "@/app/reg/sis/_components/loading-panel";
import { ProgressRail } from "@/app/reg/sis/_components/progress-rail";
import { StepForm } from "@/app/reg/sis/_components/step-form";
import { StepNav } from "@/app/reg/sis/_components/step-nav";
import { StudentPicker } from "@/app/reg/sis/_components/student-picker";
import { SubmitStep } from "@/app/reg/sis/_components/submit-step";
import { TosStep } from "@/app/reg/sis/_components/tos-step";
import { isStepDisabled } from "@/modules/wizard/progress";
import {
  flattenFormValues,
  getStepFormDefinition,
} from "@/modules/wizard/step-schemas";
import { INITIAL_ACTIVE_STEP, type WizardStepId } from "@/modules/wizard/steps";
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
  const [activeStepId, setActiveStepId] = useState<WizardStepId>(INITIAL_ACTIVE_STEP);
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
    setActiveStepId(INITIAL_ACTIVE_STEP);
    void loadStudent(nextStudentName);
  };

  const progressSteps = payload
    ? getMainProgressStatuses(activeStepId, payload.studentInfo.stepCompletion)
    : [];

  const formValues = payload ? flattenFormValues(payload.student) : {};
  const stepDefinition = getStepFormDefinition(activeStepId);

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

          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <StepNav
              activeStepId={activeStepId}
              stepCompletion={payload.studentInfo.stepCompletion}
              onStepSelect={setActiveStepId}
            />

            <div>
              {stepDefinition && (
                <StepForm
                  definition={stepDefinition}
                  leadId={leadId}
                  objectId={payload.studentInfo.objectId}
                  studentName={payload.studentInfo.studentName}
                  initialValues={formValues}
                  disabled={isStepDisabled(activeStepId, payload.student)}
                  onSaved={() => loadStudent(studentName)}
                />
              )}

              {activeStepId === "10" && (
                <HonorStep
                  leadId={leadId}
                  objectId={payload.studentInfo.objectId}
                  studentName={payload.studentInfo.studentName}
                  signed={payload.student.honorCodeSigned === "Completed"}
                  honorCodeURL={payload.student.honorCodeURL as string | undefined}
                  onSigned={() => loadStudent(studentName)}
                />
              )}

              {activeStepId === "11" && (
                <TosStep
                  leadId={leadId}
                  objectId={payload.studentInfo.objectId}
                  studentName={payload.studentInfo.studentName}
                  chargebeeId={payload.chargebeeId}
                  signed={payload.student.ToSBool === true}
                  tosURL={payload.student.ToSURL as string | undefined}
                  onSigned={() => loadStudent(studentName)}
                />
              )}

              {activeStepId === "12" && (
                <SubmitStep
                  leadId={leadId}
                  objectId={payload.studentInfo.objectId}
                  studentName={payload.studentInfo.studentName}
                  completed={payload.student.is_complete_sis === true}
                  onSubmitted={() => loadStudent(studentName)}
                />
              )}

              {!stepDefinition &&
                activeStepId !== "10" &&
                activeStepId !== "11" &&
                activeStepId !== "12" && (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <p className="text-body text-muted-foreground">
                      This section is not available yet.
                    </p>
                  </div>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
