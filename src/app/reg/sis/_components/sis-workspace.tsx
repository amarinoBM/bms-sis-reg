"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { HonorStep } from "@/app/reg/sis/_components/honor-step";
import { LoadingPanel } from "@/app/reg/sis/_components/loading-panel";
import { StepForm } from "@/app/reg/sis/_components/step-form";
import { StepNav } from "@/app/reg/sis/_components/step-nav";
import { StudentPicker } from "@/app/reg/sis/_components/student-picker";
import { SubmitStep } from "@/app/reg/sis/_components/submit-step";
import { TosStep } from "@/app/reg/sis/_components/tos-step";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isStepDisabled } from "@/modules/wizard/progress";
import {
  flattenFormValues,
  getStepFormDefinition,
} from "@/modules/wizard/step-schemas";
import { INITIAL_ACTIVE_STEP, type WizardStepId } from "@/modules/wizard/steps";
import { fetchApi } from "@/lib/client-api";
import {
  handleRegSessionExpiry,
  messageFromRegApiError,
} from "@/lib/reg-api-errors";
import type { StudentLoadResult } from "@/modules/students/types";

type SisWorkspaceProps = {
  leadId: string;
  initialStudentName: string;
};

type LoadOptions = {
  background?: boolean;
};

export function SisWorkspace({ leadId, initialStudentName }: SisWorkspaceProps) {
  const router = useRouter();
  const [studentName, setStudentName] = useState(initialStudentName);
  const [activeStepId, setActiveStepId] = useState<WizardStepId>(INITIAL_ACTIVE_STEP);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payload, setPayload] = useState<StudentLoadResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [pendingStudentName, setPendingStudentName] = useState<string | null>(null);
  const loadRequestIdRef = useRef(0);

  const loadStudent = useCallback(
    async (name: string, options?: LoadOptions) => {
      const background = options?.background === true;
      const requestId = ++loadRequestIdRef.current;

      try {
        if (background) {
          setIsRefreshing(true);
        } else {
          setLoadState("loading");
          setErrorMessage(null);
        }

        const params = new URLSearchParams({
          lead_id: leadId,
          student_name: name,
        });
        const body = await fetchApi<StudentLoadResult>(
          `/api/students/load?${params.toString()}`,
          { cache: "no-store" },
        );

        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        setPayload(body);
        setStudentName(body.studentInfo.studentName);
        setLoadState("ready");
      } catch (error) {
        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        if (handleRegSessionExpiry(error, leadId, router)) {
          toast.error("Your session expired. Sign in again with a login code.");
          return;
        }

        const message = messageFromRegApiError(
          error,
          "Could not load student information.",
        );
        if (background) {
          toast.error(message);
        } else {
          setErrorMessage(message);
          setLoadState("error");
          toast.error(message);
        }
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [leadId, router],
  );

  const refreshStudent = useCallback(() => {
    return loadStudent(studentName, { background: true });
  }, [loadStudent, studentName]);

  useEffect(() => {
    void loadStudent(initialStudentName);
  }, [initialStudentName, loadStudent]);

  const handleStudentChangeRequest = (nextStudentName: string) => {
    if (nextStudentName === studentName) {
      return;
    }

    setPendingStudentName(nextStudentName);
    setSwitchDialogOpen(true);
  };

  function confirmStudentSwitch() {
    const nextStudentName = pendingStudentName;
    if (!nextStudentName) {
      return;
    }

    setSwitchDialogOpen(false);
    setPendingStudentName(null);

    const params = new URLSearchParams({
      lead_id: leadId,
      student_name: nextStudentName,
    });
    router.replace(`/reg/sis?${params.toString()}`);
    setStudentName(nextStudentName);
    setActiveStepId(INITIAL_ACTIVE_STEP);
    void loadStudent(nextStudentName);
  }

  function handleSwitchDialogOpenChange(open: boolean) {
    setSwitchDialogOpen(open);
    if (!open) {
      setPendingStudentName(null);
    }
  }

  const formValues = payload ? flattenFormValues(payload.student) : {};
  const stepDefinition = getStepFormDefinition(activeStepId);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-title font-semibold text-foreground">Student Information</h1>
          <p className="mt-2 text-body text-muted-foreground">
            Complete each section to finish registration for your student.
          </p>
          {isRefreshing && (
            <p className="mt-2 text-label text-muted-foreground" role="status" aria-live="polite">
              Updating your saved information…
            </p>
          )}
        </div>
        {loadState === "ready" && payload ? (
          <StudentPicker
            students={payload.enrolledStudents}
            selectedStudentName={studentName}
            selectedObjectId={payload.studentInfo.objectId}
            onStudentChange={handleStudentChangeRequest}
          />
        ) : null}
      </div>

      {loadState === "loading" && <LoadingPanel />}

      {loadState === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-card p-6">
          <h2 className="text-section font-semibold text-foreground">Could not load form</h2>
          <p className="mt-2 text-body text-muted-foreground">{errorMessage}</p>
          <p className="mt-2 text-body text-muted-foreground">
            If this continues, email{" "}
            <a href="mailto:help@brilliantmicroschool.org" className="text-primary underline">
              help@brilliantmicroschool.org
            </a>
            .
          </p>
          <Button className="mt-4" onClick={() => void loadStudent(studentName)}>
            Try again
          </Button>
        </div>
      )}

      {loadState === "ready" && payload && (
        <>
          <AlertDialog open={switchDialogOpen} onOpenChange={handleSwitchDialogOpenChange}>
            <AlertDialogContent size="default" className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Switch to {pendingStudentName ?? "this student"}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You will return to the first section for that student.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmStudentSwitch}>
                  Switch student
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <StepNav
            activeStepId={activeStepId}
            stepCompletion={payload.studentInfo.stepCompletion}
            onStepSelect={setActiveStepId}
          />

          <div className="min-w-0">
              {stepDefinition && (
                <StepForm
                  key={`${activeStepId}-${payload.studentInfo.objectId}`}
                  definition={stepDefinition}
                  leadId={leadId}
                  objectId={payload.studentInfo.objectId}
                  studentName={payload.studentInfo.studentName}
                  stepId={activeStepId}
                  initialValues={formValues}
                  disabled={isStepDisabled(activeStepId, payload.student)}
                  onSaved={refreshStudent}
                  onGoToStep={setActiveStepId}
                />
              )}

              {activeStepId === "12" && (
                <HonorStep
                  leadId={leadId}
                  objectId={payload.studentInfo.objectId}
                  studentName={payload.studentInfo.studentName}
                  parentName={
                    typeof payload.student.parent_name === "string"
                      ? payload.student.parent_name
                      : undefined
                  }
                  signed={payload.student.honorCodeSigned === "Completed"}
                  honorCodeURL={payload.student.honorCodeURL as string | undefined}
                  onSigned={refreshStudent}
                  onGoToStep={setActiveStepId}
                />
              )}

              {activeStepId === "13" && (
                <TosStep
                  leadId={leadId}
                  objectId={payload.studentInfo.objectId}
                  studentName={payload.studentInfo.studentName}
                  signed={payload.student.ToSBool === true}
                  tosURL={payload.student.ToSURL as string | undefined}
                  onSigned={refreshStudent}
                  onGoToStep={setActiveStepId}
                />
              )}

              {activeStepId === "14" && (
                <SubmitStep
                  leadId={leadId}
                  objectId={payload.studentInfo.objectId}
                  studentName={payload.studentInfo.studentName}
                  student={payload.student}
                  completed={payload.student.is_complete_sis === true}
                  onSubmitted={refreshStudent}
                  onGoToStep={setActiveStepId}
                />
              )}

              {!stepDefinition &&
                activeStepId !== "12" &&
                activeStepId !== "13" &&
                activeStepId !== "14" && (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <p className="text-body text-muted-foreground">
                      This section is not available yet.
                    </p>
                  </div>
                )}
            </div>
        </>
      )}
    </div>
  );
}
