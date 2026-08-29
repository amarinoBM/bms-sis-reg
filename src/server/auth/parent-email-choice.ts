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

export async function findParentEmailOptions(
  leadId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ParentEmailOption[]> {
  const emails = await findPreferredParentEmails(leadId, fetchImpl);

  return emails.map((email) => ({
    maskedEmail: maskEmail(email),
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
