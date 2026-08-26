import { AppError } from "@/core/app-error";

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

export async function findAppRows<T extends Record<string, unknown>>(
  table: string,
  where: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
  options?: { loadRelations?: string },
): Promise<T[]> {
  const restUrl = requireRestUrl();
  const query = encodeURIComponent(buildWhereClause(where));
  const relations = options?.loadRelations
    ? `&loadRelations=${encodeURIComponent(options.loadRelations)}`
    : "";
  const response = await fetchImpl(
    `${restUrl}/data/${encodeURIComponent(table)}?where=${query}&pageSize=100${relations}`,
  );

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Could not query ${table}.`,
      status: 502,
    });
  }

  return (await response.json()) as T[];
}

export async function createAppRow(
  table: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ objectId: string }> {
  const response = await fetchImpl(`${requireRestUrl()}/data/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Could not create ${table} row.`,
      status: 502,
      cause: await response.text(),
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

export async function updateAppRow(
  table: string,
  objectId: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    `${requireRestUrl()}/data/${encodeURIComponent(table)}/${encodeURIComponent(objectId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Could not update ${table} row.`,
      status: 502,
      cause: await response.text(),
    });
  }
}

export async function getAppRow<T extends Record<string, unknown>>(
  table: string,
  objectId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<T | null> {
  const response = await fetchImpl(
    `${requireRestUrl()}/data/${encodeURIComponent(table)}/${encodeURIComponent(objectId)}`,
    { cache: "no-store" },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Could not load ${table} row.`,
      status: 502,
    });
  }

  return (await response.json()) as T;
}

export async function deleteAppRow(
  table: string,
  objectId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    `${requireRestUrl()}/data/${encodeURIComponent(table)}/${encodeURIComponent(objectId)}`,
    { method: "DELETE" },
  );

  if (!response.ok && response.status !== 404) {
    throw new AppError({
      code: "EXTERNAL_WRITE_FAILED",
      message: `Could not delete ${table} row.`,
      status: 502,
    });
  }
}
