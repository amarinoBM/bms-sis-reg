"use client";

import {
  FormCheckbox,
  FormFileUpload,
  FormMultiOptionSelect,
  FormQuestionnaireSingleChoice,
  type FormFieldOption,
} from "@/app/reg/_components/form-fields";
import { CREDIT_TRANSFER_SUBJECTS } from "@/modules/wizard/credit-transfer-subjects";
import { readStudentTranscriptFiles } from "@/modules/uploads/document-files";
import { UPLOAD_FORMAT_HINT } from "@/modules/uploads/upload-limits";
import {
  readCreditTransferSubjects,
  readTranscriptDeliveryChoice,
  readTransferCreditFlag,
  TRANSCRIPT_DELIVERY_CHOICES,
  TRANSCRIPT_DELIVERY_OPTIONS,
  transcriptDeliveryQuestionLabel,
  transcriptSchoolRequestNote,
  transcriptStepIntro,
} from "@/modules/wizard/transcript-fields";

const DELIVERY_OPTIONS: FormFieldOption[] = TRANSCRIPT_DELIVERY_CHOICES.map((choice) => ({
  value: choice.value,
  label: choice.label,
  description: choice.description,
}));

const CREDIT_SUBJECT_OPTIONS: FormFieldOption[] = CREDIT_TRANSFER_SUBJECTS.map((subject) => ({
  value: subject,
  label: subject,
}));

type TranscriptFieldsProps = {
  studentName: string;
  values: Record<string, unknown>;
  readOnly: boolean;
  fieldErrors?: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  uploading?: boolean;
  pendingFileName?: string;
  uploadedFileName?: string;
  onUploadTranscript?: (file: File) => void;
};

export function TranscriptFields({
  studentName,
  values,
  readOnly,
  fieldErrors = {},
  onChange,
  uploading = false,
  pendingFileName,
  uploadedFileName,
  onUploadTranscript,
}: TranscriptFieldsProps) {
  const deliveryChoice = readTranscriptDeliveryChoice(values.uploadTranscript);
  const transcriptFiles = readStudentTranscriptFiles(values);
  const creditSubjects = readCreditTransferSubjects(values.CreditTransfer);
  const wantsCreditTransfer = readTransferCreditFlag(values.transferCredit);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-label font-medium text-foreground">Credit Transfer Request</p>
        <p className="text-body leading-relaxed text-muted-foreground">
          {transcriptStepIntro(studentName)}
        </p>
      </div>

      <FormQuestionnaireSingleChoice
        id="uploadTranscript"
        label={transcriptDeliveryQuestionLabel()}
        value={deliveryChoice ?? ""}
        options={DELIVERY_OPTIONS}
        disabled={readOnly}
        shortcuts="letters"
        requirement="required"
        error={fieldErrors.uploadTranscript}
        onChange={(value) => onChange("uploadTranscript", value)}
      />

      {deliveryChoice === TRANSCRIPT_DELIVERY_OPTIONS[0] ? (
        <FormFileUpload
          id="transcript-upload"
          label="Upload transcript files"
          description={`Add report cards, transcripts, or other school records one file at a time. Existing files are kept. ${UPLOAD_FORMAT_HINT}`}
          error={fieldErrors.transcriptFiles}
          fileUrls={transcriptFiles}
          fileLabel="Transcript file"
          actionLabel={transcriptFiles.length ? "Add another file" : "Choose file"}
          pendingFileName={pendingFileName}
          uploadedFileName={uploadedFileName}
          uploading={uploading}
          readOnly={readOnly || !onUploadTranscript}
          onFileSelect={(file) => onUploadTranscript?.(file)}
        />
      ) : null}

      {deliveryChoice === TRANSCRIPT_DELIVERY_OPTIONS[1] ? (
        <div className="rounded-lg border border-border/80 bg-muted/20 p-4 text-body text-muted-foreground">
          {transcriptSchoolRequestNote()}
        </div>
      ) : null}

      <fieldset className="space-y-4 rounded-lg border border-border/80 bg-muted/25 p-4">
        <legend className="text-label font-medium text-foreground">Credit transfer subjects</legend>
        <FormCheckbox
          id="transferCredit"
          label="Request credit transfer for prior coursework"
          checked={wantsCreditTransfer}
          disabled={readOnly}
          onChange={(checked) => onChange("transferCredit", checked)}
        />

        {wantsCreditTransfer ? (
          <FormMultiOptionSelect
            id="CreditTransfer"
            label="Subjects to review"
            description="Add subjects you would like reviewed for credit transfer."
            value={creditSubjects}
            options={CREDIT_SUBJECT_OPTIONS}
            disabled={readOnly}
            placeholder="Add a subject…"
            error={fieldErrors.CreditTransfer}
            onChange={(next) => onChange("CreditTransfer", next)}
          />
        ) : null}
      </fieldset>
    </div>
  );
}
