import type { ApiResponse } from "@/server/http/api-envelope";

async function readApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

export async function fetchApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  return readApiResponse<T>(response);
}

export async function postApi<T>(
  url: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return readApiResponse<T>(response);
}

export async function postFormApi<T>(url: string, formData: FormData): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  return readApiResponse<T>(response);
}
