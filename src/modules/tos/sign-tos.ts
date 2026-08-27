import { saveStudentRecord } from "@/modules/students/repository";
import { DRIVE_FOLDER_ID } from "@/modules/uploads/upload-config";
import { sendScheduledDocumentEmail } from "@/server/connectors/backendless/email-client";
import { buildTosSignedEmailHtml } from "@/modules/email/bms-email-template";
import { invokeCloudCode } from "@/server/connectors/backendless/cloud-code-client";
import {
  allowDriveFileAccess,
  copyDriveFile,
  docsBatchUpdate,
  normalizeDriveFileId,
  TOS_TEMPLATE,
} from "@/server/connectors/backendless/sis-cloud-code";

type BillingDetails = {
  chargebeePlan: string;
  quantity: string;
  price: string;
  contactName: string;
  contactEmail: string;
  address: string;
};

function formatSignedDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function buildTosFileName(parentName: string, studentName: string): string {
  return `BMS Terms of Service - ${parentName} and ${studentName}`;
}

function pickString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

async function resolveBillingDetails(
  chargebeeId: string | null,
  student: Record<string, unknown>,
  fetchImpl: typeof fetch,
): Promise<BillingDetails> {
  const fallback: BillingDetails = {
    chargebeePlan: pickString(student.subjects, "Brilliant Microschool"),
    quantity: "1",
    price: "",
    contactName: `${pickString(student.parent_name)} ${pickString(student.parent_last_name)}`.trim(),
    contactEmail: pickString(student.parent_email, pickString(student.email)),
    address: pickString(student.parent_address),
  };

  if (!chargebeeId) {
    return fallback;
  }

  try {
    if (chargebeeId.startsWith("cus_")) {
      const customer = await invokeCloudCode<Record<string, unknown>>({
        service: "uiBuilder",
        method: "UIStripeGetCustomer",
        body: { customer_id: chargebeeId, isLive: true },
        fetchImpl,
      });

      const subscription = customer.subscription as Record<string, unknown> | undefined;
      return {
        ...fallback,
        chargebeePlan: pickString(subscription?.plan, fallback.chargebeePlan),
        quantity: pickString(subscription?.quantity, "1"),
        price: pickString(subscription?.amount, fallback.price),
        contactName: pickString(customer.name, fallback.contactName),
        contactEmail: pickString(customer.email, fallback.contactEmail),
      };
    }

    const chargebee = await invokeCloudCode<Record<string, unknown>>({
      service: "uiBuilder",
      method: "UIChargebeeGetObjectListByParam",
      body: {
        objectType: "subscription",
        paramName: "id",
        paramValue: chargebeeId,
        isLive: true,
      },
      fetchImpl,
    });

    const list = Array.isArray(chargebee.list) ? chargebee.list : [];
    const first = (list[0] as Record<string, unknown> | undefined) ?? {};

    return {
      ...fallback,
      chargebeePlan: pickString(first.plan_id, fallback.chargebeePlan),
      quantity: pickString(first.plan_quantity, "1"),
      price: pickString(first.plan_unit_price, fallback.price),
    };
  } catch {
    return fallback;
  }
}

async function fetchClientIp(fetchImpl: typeof fetch): Promise<string> {
  try {
    const result = await invokeCloudCode<Record<string, unknown>>({
      service: "uiBuilder",
      method: "GetIPFrontEnd",
      body: {},
      fetchImpl,
    });
    return pickString(result.ip, pickString(result.IP, "unknown"));
  } catch {
    return "unknown";
  }
}

type SignTosInput = {
  leadId: string;
  objectId: string;
  parentSignature: string;
  parentName: string;
  studentName: string;
  email: string;
  chargebeeId: string | null;
  student: Record<string, unknown>;
};

export async function signTermsOfService(
  input: SignTosInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ tosURL: string }> {
  const [billing, userIp] = await Promise.all([
    resolveBillingDetails(input.chargebeeId, input.student, fetchImpl),
    fetchClientIp(fetchImpl),
  ]);
  const dateSigned = formatSignedDate(new Date());

  const copied = await copyDriveFile(
    TOS_TEMPLATE,
    DRIVE_FOLDER_ID,
    buildTosFileName(input.parentName, input.studentName),
    fetchImpl,
  );

  const fileId = normalizeDriveFileId(copied.id);
  if (!fileId) {
    throw new Error("TOS template copy did not return a file id.");
  }

  await allowDriveFileAccess(fileId, fetchImpl);

  const updateResult = await docsBatchUpdate(fileId, {
    "{{parentSignature}}": input.parentSignature,
    "{{userIP}}": userIp,
    "{{dateSigned}}": dateSigned,
    "{{address}}": billing.address,
    "{{contactName}}": billing.contactName,
    "{{contactEmail}}": billing.contactEmail,
    "{{chargebeePlan}}": billing.chargebeePlan,
    "{{quantity}}": billing.quantity,
    "{{price}}": billing.price,
  }, fetchImpl);

  const documentId = String(updateResult.documentId ?? fileId);
  const tosURL = `https://docs.google.com/feeds/download/documents/export/Export?id=${documentId}&exportFormat=pdf`;

  await saveStudentRecord(
    input.leadId,
    input.objectId,
    {
      ToSBool: true,
      ToSURL: tosURL,
      "11disabled": true,
    },
    fetchImpl,
  );

  const bodyHtml = buildTosSignedEmailHtml({
    parentName: input.parentName,
    studentName: input.studentName,
    documentUrl: tosURL,
  });

  await sendScheduledDocumentEmail(
    input.leadId,
    input.email,
    "Signed terms of service — Brilliant Microschools",
    bodyHtml,
    fetchImpl,
  );

  return { tosURL };
}
