export function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function countPhoneDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

export function isValidPhone(value: string): boolean {
  return countPhoneDigits(value) >= 10;
}

export function isConfidenceRating(value: unknown): boolean {
  if (typeof value === "number") {
    return value >= 1 && value <= 5;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed >= "1" && trimmed <= "5";
  }

  return false;
}
