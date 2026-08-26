import { AppError } from "@/core/app-error";
import type {
  BackendlessProperty,
  BackendlessRow,
  BackendlessTableExport,
} from "@/server/connectors/backendless/types";

type BackendlessReadClientOptions = {
  restUrl: string;
  fetchImpl?: typeof fetch;
};

export class BackendlessReadClient {
  private readonly restUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: BackendlessReadClientOptions) {
    this.restUrl = options.restUrl.replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getTableProperties(table: string): Promise<BackendlessProperty[]> {
    const response = await this.fetchImpl(
      `${this.restUrl}/data/${encodeURIComponent(table)}/properties`,
    );

    if (response.status === 404) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Backendless table not found.",
      });
    }

    if (!response.ok) {
      throw new AppError({
        code: "EXTERNAL_WRITE_FAILED",
        message: "Could not read Backendless schema.",
        status: 502,
      });
    }

    return (await response.json()) as BackendlessProperty[];
  }

  async exportTable(table: string): Promise<BackendlessTableExport> {
    return {
      table,
      properties: await this.getTableProperties(table),
    };
  }

  async getRow(table: string, objectId: string): Promise<BackendlessRow | null> {
    const response = await this.fetchImpl(
      `${this.restUrl}/data/${encodeURIComponent(table)}/${encodeURIComponent(objectId)}`,
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new AppError({
        code: "EXTERNAL_WRITE_FAILED",
        message: "Could not read Backendless row.",
        status: 502,
      });
    }

    return (await response.json()) as BackendlessRow;
  }
}

export function createBackendlessReadClientFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): BackendlessReadClient {
  const restUrl = env.BACKENDLESS_REST_URL;

  if (!restUrl) {
    throw new AppError({
      code: "INTERNAL_ERROR",
      message: "Backendless REST URL is not configured.",
    });
  }

  return new BackendlessReadClient({ restUrl });
}
