import { createHmac, timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/config/env";
import { AppError } from "@/core/app-error";
import { maskEmail } from "@/lib/mask-email";
import { findPreferredParentEmails } from "@/modules/students/repository";

export type ParentEmailOption = {
  maskedEmail: string;
  choiceToken: string;
};

function choiceToken(leadId: string, email: string): string {
  return createHmac("sha256", getServerEnv().authSecret)
    .update(`parent-email-choice:v1:${leadId}:${email.toLowerCase()}`)
    .digest("hex");
}

function tokensMatch(expected: string, submitted: string): boolean {
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(submitted, "utf8");

  return left.length === right.length && timingSafeEqual(left, right);
}

function invalidChoice(): never {
  throw new AppError({
    code: "INVALID_INPUT",
    message: "Choose a parent email address and try again.",
  });
}

function distinctMaskedEmails(emails: string[]): string[] {
  const labels = emails.map(maskEmail);
  const collisions = new Map<string, number[]>();

  labels.forEach((label, index) => {
    const indexes = collisions.get(label) ?? [];
    indexes.push(index);
    collisions.set(label, indexes);
  });

  for (const indexes of collisions.values()) {
    if (indexes.length < 2) {
      continue;
    }

    const localLength = emails[indexes[0]].lastIndexOf("@");
    for (let visibleCharacters = 2; visibleCharacters < localLength; visibleCharacters += 1) {
      const candidates = indexes.map((index) => {
        const email = emails[index];
        const at = email.lastIndexOf("@");
        const local = email.slice(0, at);
        return `${local.slice(0, visibleCharacters)}${"*".repeat(local.length - visibleCharacters)}${email.slice(at)}`;
      });

      if (new Set(candidates).size === candidates.length) {
        indexes.forEach((index, candidateIndex) => {
          labels[index] = candidates[candidateIndex];
        });
        break;
      }
    }
  }

  return labels;
}

export async function findParentEmailOptions(
  leadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ParentEmailOption[]> {
  const emails = await findPreferredParentEmails(leadId, fetchImpl);
  const maskedEmails = distinctMaskedEmails(emails);

  return emails.map((email, index) => ({
    maskedEmail: maskedEmails[index],
    choiceToken: choiceToken(leadId, email),
  }));
}

export async function resolveParentEmailChoice(
  leadId: string,
  submittedToken?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const emails = await findPreferredParentEmails(leadId, fetchImpl);

  if (emails.length === 0) {
    return null;
  }

  if (emails.length === 1 && !submittedToken) {
    return emails[0];
  }

  if (!submittedToken) {
    return invalidChoice();
  }

  const match = emails.find((email) =>
    tokensMatch(choiceToken(leadId, email), submittedToken),
  );

  return match ?? invalidChoice();
}
