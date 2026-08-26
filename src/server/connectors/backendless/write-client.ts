import { AppError } from "@/core/app-error";

function requireExternalWritesEnabled(): void {
  if (process.env.EXTERNAL_WRITES_ENABLED !== "true") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "External writes are disabled.",
    });
  }
}

function requireRestUrl(): string {
  const restUrl = process.env.BACKENDLESS_REST_URL;

  if (!restUrl) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "Backendless REST URL is not configured.",
    });
  }

  return restUrl.replace(/\/$/, "");
}

export async function createBackendlessRow(
  table: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ objectId: string }> {
  requireExternalWritesEnabled();

  const response = await fetchImpl(`${requireRestUrl()}/data/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Could not create ${table} row.`,
      status: 502,
      cause: detail,
    });
  }

  const row = (await response.json()) as { objectId?: string };

  if (!row.objectId) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Could not create ${table} row.`,
      status: 502,
    });
  }

  return { objectId: row.objectId };
}

export async function setBackendlessRelation(
  table: string,
  objectId: string,
  relationColumn: string,
  relatedTable: string,
  relatedObjectId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  requireExternalWritesEnabled();

  const restUrl = requireRestUrl();
  const relationResponse = await fetchImpl(
    `${restUrl}/data/${encodeURIComponent(table)}/${encodeURIComponent(objectId)}/${encodeURIComponent(relationColumn)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ objectId: relatedObjectId }),
    },
  );

  if (relationResponse.ok) {
    return;
  }

  const relationDetail = await relationResponse.text();
  const fallbackResponse = await fetchImpl(
    `${restUrl}/data/${encodeURIComponent(table)}/${encodeURIComponent(objectId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [`${relationColumn}@${relatedTable}`]: relatedObjectId,
      }),
    },
  );

  if (!fallbackResponse.ok) {
    const fallbackDetail = await fallbackResponse.text();
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Could not link ${table}.${relationColumn}.`,
      status: 502,
      cause: `${relationDetail}; ${fallbackDetail}`,
    });
  }
}

function escapeWhereValue(value: string): string {
  return value.replace(/'/g, "''");
}

function buildWhereClause(where: Record<string, unknown>): string {
  return Object.entries(where)
    .map(([key, value]) => {
      if (typeof value === "string") {
        return `${key}='${escapeWhereValue(value)}'`;
      }

      if (typeof value === "boolean" || typeof value === "number") {
        return `${key}=${String(value)}`;
      }

      throw new AppError({
        code: "INTERNAL_ERROR",
        message: `Unsupported where value for ${key}.`,
      });
    })
    .join(" and ");
}

export async function findRows<T extends Record<string, unknown>>(
  table: string,
  where: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<T[]> {
  const restUrl = requireRestUrl();
  const query = encodeURIComponent(buildWhereClause(where));
  const response = await fetchImpl(`${restUrl}/data/${encodeURIComponent(table)}?where=${query}&pageSize=100`);

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Could not query ${table}.`,
      status: 502,
    });
  }

  return (await response.json()) as T[];
}
