"use client";

import { useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Upload } from "lucide-react";

import { ExternalLink } from "@/app/reg/_components/external-link";
import { RegSpinner } from "@/app/reg/_components/reg-spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isAppError } from "@/core/app-error";
import { REG_FIELD_FOCUS_CLASS, REG_FIELD_SURFACE_CLASS, REG_TOUCH_CLASS } from "@/lib/reg-ui";
import { assertUploadFileAllowed } from "@/modules/uploads/upload-limits";
import { cn } from "@/lib/utils";

export const REG_UPLOAD_ACCEPT =
  "application/pdf,image/jpeg,image/jpg,image/png,image/webp";

const regControlClass = cn(REG_TOUCH_CLASS, REG_FIELD_FOCUS_CLASS, REG_FIELD_SURFACE_CLASS);

function regControlClassName(disabled?: boolean) {
  return cn(regControlClass, disabled && "bg-muted/40 text-muted-foreground");
}

function buildFieldA11y({
  id,
  description,
  error,
  extraDescribedBy,
}: {
  id: string;
  description?: string;
  error?: string;
  extraDescribedBy?: string;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [descriptionId, errorId, extraDescribedBy].filter(Boolean).join(" ") || undefined;

  return { descriptionId, errorId, describedBy };
}

type FormFieldProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const { descriptionId, errorId } = buildFieldA11y({ id, description, error });

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <Label htmlFor={id} className="text-label font-medium leading-snug text-foreground break-words">
        {label}
        {required ? (
          <>
            <span className="text-destructive" aria-hidden="true"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </Label>
      {description ? (
        <p id={descriptionId} className="max-w-prose text-label leading-relaxed text-muted-foreground break-words">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-label text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function controlA11yProps({
  id,
  description,
  error,
  required,
}: {
  id: string;
  description?: string;
  error?: string;
  required?: boolean;
}) {
  const { describedBy } = buildFieldA11y({ id, description, error });

  return {
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "aria-required": required || undefined,
  };
}

type FormTextInputProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  required?: boolean;
};

export function FormTextInput({
  id,
  label,
  description,
  error,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  autoComplete,
  inputMode,
  maxLength,
  required,
}: FormTextInputProps) {
  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <Input
        id={id}
        type={type}
        className={regControlClassName(disabled)}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required={required}
        {...controlA11yProps({ id, description, error, required })}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

type FormTextareaProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
};

export function FormTextarea({
  id,
  label,
  description,
  error,
  value,
  onChange,
  disabled,
  placeholder,
  maxLength,
  required,
}: FormTextareaProps) {
  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <Textarea
        id={id}
        className={cn(regControlClassName(disabled), "min-w-0")}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        {...controlA11yProps({ id, description, error, required })}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

type FormSelectProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

export type FormFieldOption = {
  value: string;
  label: string;
  description?: string;
};

function normalizeFieldOptions(options: string[] | FormFieldOption[]): FormFieldOption[] {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
}

const formSelectContentClass =
  "min-w-[var(--anchor-width)] w-max max-w-[min(100vw-3rem,var(--available-width))]";

function formSelectTriggerClass(disabled?: boolean) {
  return cn(regControlClassName(disabled), "w-full min-w-0");
}

function SelectOptionItem({ option }: { option: FormFieldOption }) {
  return (
    <SelectItem value={option.value}>
      <span className="font-medium">{option.label}</span>
      {option.description ? (
        <span className="text-muted-foreground">{option.description}</span>
      ) : null}
    </SelectItem>
  );
}

export function FormSelect({
  id,
  label,
  description,
  error,
  value,
  options,
  onChange,
  disabled,
  placeholder = "Select an option",
  required,
}: FormSelectProps) {
  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      {options.length === 0 ? (
        <p className="text-label text-muted-foreground">No options available.</p>
      ) : (
        <Select
          value={value}
          onValueChange={(next) => onChange(next ?? "")}
          disabled={disabled}
        >
          <SelectTrigger
            id={id}
            className={formSelectTriggerClass(disabled)}
            {...controlA11yProps({ id, description, error, required })}
          >
            <SelectValue placeholder={placeholder} className="truncate" />
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            sideOffset={8}
            className={formSelectContentClass}
          >
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}

type FormOptionSelectProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  value: string;
  options: FormFieldOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

export function FormOptionSelect({
  id,
  label,
  description,
  error,
  value,
  options,
  onChange,
  disabled,
  placeholder = "Select an option",
  required,
}: FormOptionSelectProps) {
  const normalizedOptions = normalizeFieldOptions(options);
  const selectedOption = normalizedOptions.find((option) => option.value === value);

  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      {normalizedOptions.length === 0 ? (
        <p className="text-label text-muted-foreground">No options available.</p>
      ) : (
        <Select
          value={value}
          onValueChange={(next) => onChange(next ?? "")}
          disabled={disabled}
        >
          <SelectTrigger
            id={id}
            className={formSelectTriggerClass(disabled)}
            {...controlA11yProps({ id, description, error, required })}
          >
            <SelectValue placeholder={placeholder} className="truncate">
              {selectedOption?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            sideOffset={8}
            className={formSelectContentClass}
          >
            {normalizedOptions.map((option) => (
              <SelectOptionItem key={option.value} option={option} />
            ))}
          </SelectContent>
        </Select>
      )}
      {selectedOption?.description ? (
        <p className="text-label text-muted-foreground">{selectedOption.description}</p>
      ) : null}
    </FormField>
  );
}

type FormMultiOptionSelectProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  value: string[];
  options: FormFieldOption[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  excludeValues?: string[];
};

export function FormMultiOptionSelect({
  id,
  label,
  description,
  error,
  value,
  options,
  onChange,
  disabled,
  placeholder = "Add an option…",
  excludeValues = [],
}: FormMultiOptionSelectProps) {
  const normalizedOptions = normalizeFieldOptions(options);
  const excluded = new Set([...value, ...excludeValues]);
  const availableOptions = normalizedOptions.filter((option) => !excluded.has(option.value));
  const selectedOptions = normalizedOptions.filter((option) => value.includes(option.value));

  return (
    <FormField id={id} label={label} description={description} error={error}>
      <Select
        value=""
        onValueChange={(next) => {
          if (!next || value.includes(next)) {
            return;
          }
          onChange([...value, next]);
        }}
        disabled={disabled || availableOptions.length === 0}
      >
        <SelectTrigger
          id={id}
          className={formSelectTriggerClass(disabled)}
          {...controlA11yProps({ id, description, error })}
        >
          <SelectValue
            placeholder={
              availableOptions.length === 0 ? "All options selected" : placeholder
            }
            className="truncate"
          />
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          sideOffset={8}
          className={formSelectContentClass}
        >
          {availableOptions.map((option) => (
            <SelectOptionItem key={option.value} option={option} />
          ))}
        </SelectContent>
      </Select>

      {selectedOptions.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {selectedOptions.map((option) => {
            const optionId = `${id}-${option.value.replace(/\s+/g, "-")}`;

            return (
              <div key={option.value} className="flex min-w-0 items-start gap-3">
                <Checkbox
                  id={optionId}
                  className="mt-0.5 size-5 shrink-0 after:-inset-x-4 after:-inset-y-3"
                  checked={true}
                  disabled={disabled}
                  onCheckedChange={(next) => {
                    if (next !== true) {
                      onChange(value.filter((item) => item !== option.value));
                    }
                  }}
                />
                <Label htmlFor={optionId} className="min-w-0 py-1 text-body leading-snug break-words">
                  <span className="font-medium text-foreground">{option.label}</span>
                  {option.description ? (
                    <span className="mt-0.5 block text-label text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </Label>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-label text-muted-foreground">Nothing selected yet.</p>
      )}
    </FormField>
  );
}

type FormCheckboxProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
};

export function FormCheckbox({
  id,
  label,
  checked,
  onChange,
  disabled,
  error,
}: FormCheckboxProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-w-0 items-start gap-3">
        <Checkbox
          id={id}
          className="mt-0.5 size-5 shrink-0 after:-inset-x-4 after:-inset-y-3"
          checked={checked}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onCheckedChange={(next) => onChange(next === true)}
        />
        <Label htmlFor={id} className="min-w-0 py-1 text-body leading-snug break-words">
          {label}
        </Label>
      </div>
      {error ? (
        <p id={errorId} className="text-label text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type FormCheckboxGroupProps = {
  legend: string;
  description?: string;
  error?: string;
  options: string[] | FormFieldOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  idPrefix: string;
};

export function FormCheckboxGroup({
  legend,
  description,
  error,
  options,
  value,
  onChange,
  disabled,
  idPrefix,
}: FormCheckboxGroupProps) {
  const normalizedOptions = normalizeFieldOptions(options);
  const { descriptionId, errorId, describedBy } = buildFieldA11y({
    id: idPrefix,
    description,
    error,
  });

  return (
    <fieldset className="min-w-0 space-y-3 rounded-lg border border-border/80 bg-muted/25 p-4" aria-describedby={describedBy}>
      <legend className="text-label font-medium text-foreground break-words">{legend}</legend>
      {description ? (
        <p id={descriptionId} className="max-w-prose text-label leading-relaxed text-muted-foreground break-words">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-label text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="space-y-2">
        {normalizedOptions.map((option, index) => {
          const optionId = `${idPrefix}-${index}`;
          const checked = value.includes(option.value);

          return (
            <div key={option.value} className="flex min-w-0 items-start gap-3">
              <Checkbox
                id={optionId}
                className="mt-0.5 size-5 shrink-0 after:-inset-x-4 after:-inset-y-3"
                checked={checked}
                disabled={disabled}
                onCheckedChange={(next) => {
                  if (next === true) {
                    onChange([...value, option.value]);
                    return;
                  }
                  onChange(value.filter((item) => item !== option.value));
                }}
              />
              <Label
                htmlFor={optionId}
                className="min-w-0 py-1 text-body leading-snug break-words"
              >
                <span className="font-medium text-foreground">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block text-label text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

type FormDateInputProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
  required?: boolean;
};

export function FormDateInput({
  id,
  label,
  description,
  error,
  value,
  onChange,
  disabled,
  min,
  max,
  required,
}: FormDateInputProps) {
  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <input
        id={id}
        type="date"
        value={value}
        disabled={disabled}
        min={min}
        max={max}
        required={required}
        className={cn(
          regControlClassName(disabled),
          "w-full min-w-0 rounded-lg border border-input px-2.5 py-1 text-base md:text-sm disabled:cursor-not-allowed disabled:opacity-50",
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80",
          error &&
            "border-destructive ring-2 ring-inset ring-destructive/30 aria-invalid:border-destructive",
        )}
        {...controlA11yProps({ id, description, error, required })}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

type FormFileUploadProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  fileUrl?: string | null;
  pendingFileName?: string;
  uploadedFileName?: string;
  accept?: string;
  uploading?: boolean;
  readOnly?: boolean;
  onFileSelect: (file: File) => void;
};

export function FormFileUpload({
  id,
  label,
  description = "Accepted formats: PDF, JPG, PNG, or WEBP. Maximum size: 10 MB. The file saves when you upload it.",
  error: externalError,
  fileUrl,
  pendingFileName,
  uploadedFileName,
  accept = REG_UPLOAD_ACCEPT,
  uploading = false,
  readOnly = false,
  onFileSelect,
}: FormFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const hasFile = Boolean(fileUrl);
  const displayError = externalError ?? localError ?? undefined;
  const statusId = `${id}-status`;
  const displayFileName =
    uploading
      ? pendingFileName
      : uploadedFileName ?? pendingFileName ?? (hasFile ? "Uploaded file" : undefined);
  const { describedBy } = buildFieldA11y({
    id,
    description,
    error: displayError,
    extraDescribedBy: statusId,
  });

  function openFilePicker() {
    if (uploading) {
      return;
    }
    inputRef.current?.click();
  }

  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={displayError}
    >
      <div
        className={cn(
          "relative min-w-0 overflow-hidden rounded-lg border p-4 transition-all duration-200",
          uploading && "border-primary/40 bg-primary/5 ring-2 ring-primary/15",
          hasFile && !uploading && "border-primary/25 bg-primary/5",
          !hasFile && !uploading && "border-border bg-muted/30",
          displayError && "border-destructive/50 ring-2 ring-destructive/15",
        )}
        aria-busy={uploading}
      >
        {uploading ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-primary/15"
            aria-hidden="true"
          >
            <div className="h-full w-2/5 animate-pulse bg-primary/70" />
          </div>
        ) : null}

        <div
          id={statusId}
          className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          role="status"
          aria-live="polite"
        >
          <div className="flex min-w-0 items-start gap-3">
            {uploading ? (
              <RegSpinner className="mt-0.5 shrink-0" />
            ) : hasFile ? (
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
            ) : (
              <Upload
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 space-y-1">
              <p className="text-body font-medium text-foreground">
                {uploading
                  ? "Uploading your file…"
                  : hasFile
                    ? "Upload complete"
                    : "No file uploaded yet"}
              </p>
              {displayFileName ? (
                <p className="truncate text-label text-muted-foreground">{displayFileName}</p>
              ) : null}
              {hasFile && !uploading ? (
                <ExternalLink
                  href={String(fileUrl)}
                  className="block truncate text-body text-primary underline underline-offset-2"
                >
                  Open in new tab
                </ExternalLink>
              ) : !hasFile && !uploading ? (
                <p className="text-label text-muted-foreground">
                  PDF or JPG, PNG, or WEBP, up to 10 MB.
                </p>
              ) : null}
            </div>
          </div>

          {!readOnly ? (
            <Button
              type="button"
              variant="outline"
              className={cn(
                REG_TOUCH_CLASS,
                "w-full shrink-0 gap-2 whitespace-normal sm:w-auto",
              )}
              disabled={uploading}
              onClick={openFilePicker}
            >
              {uploading ? (
                <>
                  <RegSpinner size="sm" />
                  Uploading…
                </>
              ) : hasFile ? (
                "Replace file"
              ) : (
                "Choose file"
              )}
            </Button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          disabled={readOnly || uploading}
          aria-describedby={describedBy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            try {
              assertUploadFileAllowed(file);
              setLocalError(null);
              onFileSelect(file);
            } catch (error) {
              setLocalError(
                isAppError(error)
                  ? error.exposeMessage
                  : "Could not upload this file. Try a PDF or image under 10 MB.",
              );
            }

            event.target.value = "";
          }}
        />
      </div>
    </FormField>
  );
}
