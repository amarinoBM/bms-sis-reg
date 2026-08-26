export const GUARDIAN_CONTACT_FIELD_KEYS = [
  "parent_name",
  "parent_last_name",
  "parent_email",
  "parent_phone",
  "parent_address",
  "parent_relation",
] as const;

export type GuardianContactFieldKey = (typeof GUARDIAN_CONTACT_FIELD_KEYS)[number];

export type GuardianContactPrefix = "secondary_guardian" | "tertiary_guardian";

export type GuardianContactRecord = Partial<
  Record<GuardianContactFieldKey, string>
>;

export function guardianFlatKey(
  prefix: GuardianContactPrefix,
  fieldKey: GuardianContactFieldKey,
): string {
  return `${prefix}.${fieldKey}`;
}

export function flattenGuardianContact(
  prefix: GuardianContactPrefix,
  guardian: unknown,
  flat: Record<string, unknown>,
): void {
  if (!guardian || typeof guardian !== "object" || Array.isArray(guardian)) {
    return;
  }

  for (const [key, value] of Object.entries(guardian as Record<string, unknown>)) {
    flat[guardianFlatKey(prefix, key as GuardianContactFieldKey)] = value;
  }
}

export function readGuardianContact(
  prefix: GuardianContactPrefix,
  values: Record<string, unknown>,
): GuardianContactRecord {
  const guardian: GuardianContactRecord = {};

  for (const fieldKey of GUARDIAN_CONTACT_FIELD_KEYS) {
    const value = values[guardianFlatKey(prefix, fieldKey)];
    if (typeof value === "string") {
      guardian[fieldKey] = value;
    }
  }

  return guardian;
}

export function guardianContactHasValues(guardian: GuardianContactRecord): boolean {
  return Object.values(guardian).some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export function normalizeGuardianContactForSave(
  guardian: unknown,
): GuardianContactRecord | null {
  if (!guardian || typeof guardian !== "object" || Array.isArray(guardian)) {
    return null;
  }

  const normalized: GuardianContactRecord = {};
  for (const fieldKey of GUARDIAN_CONTACT_FIELD_KEYS) {
    const value = (guardian as Record<string, unknown>)[fieldKey];
    if (typeof value === "string" && value.trim()) {
      normalized[fieldKey] = value.trim();
    }
  }

  return guardianContactHasValues(normalized) ? normalized : null;
}

export function collectGuardianContactsFromFlat(
  values: Record<string, unknown>,
): {
  secondary_guardian: GuardianContactRecord | null;
  tertiary_guardian: GuardianContactRecord | null;
} {
  return {
    secondary_guardian: normalizeGuardianContactForSave(
      unflattenGuardianPrefix("secondary_guardian", values),
    ),
    tertiary_guardian: normalizeGuardianContactForSave(
      unflattenGuardianPrefix("tertiary_guardian", values),
    ),
  };
}

function unflattenGuardianPrefix(
  prefix: GuardianContactPrefix,
  values: Record<string, unknown>,
): GuardianContactRecord {
  const guardian: GuardianContactRecord = {};

  for (const fieldKey of GUARDIAN_CONTACT_FIELD_KEYS) {
    const flatKey = guardianFlatKey(prefix, fieldKey);
    if (flatKey in values) {
      guardian[fieldKey] = String(values[flatKey] ?? "");
    }
  }

  return guardian;
}
