const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convert stored student date values to `YYYY-MM-DD` for `<input type="date">`. */
export function toDateInputValue(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (DATE_INPUT_PATTERN.test(trimmed)) {
      return trimmed;
    }

    const parsed = Date.parse(trimmed);
    if (Number.isFinite(parsed)) {
      return formatLocalDateInput(new Date(parsed));
    }

    return "";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return formatLocalDateInput(new Date(value));
  }

  return "";
}

/** Parse `YYYY-MM-DD` from a date input to local-midnight epoch ms. */
export function fromDateInputValue(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = DATE_INPUT_PATTERN.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const local = new Date(year, monthIndex, day);

  if (
    local.getFullYear() !== year ||
    local.getMonth() !== monthIndex ||
    local.getDate() !== day
  ) {
    return null;
  }

  return local.getTime();
}

function formatLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse `YYYY-MM-DD` to a local calendar `Date` (undefined when invalid). */
export function parseDateInputIso(value: string): Date | undefined {
  const ms = fromDateInputValue(value);
  if (ms === null) {
    return undefined;
  }

  return new Date(ms);
}

/** Format `YYYY-MM-DD` for display in registration forms. */
export function formatDateDisplay(value: string): string {
  const date = parseDateInputIso(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
