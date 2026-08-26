import { BACKENDLESS_TABLES } from "@/config/backendless";
import {
  createAppRow,
  findAppRows,
  updateAppRow,
} from "@/server/connectors/backendless/app-data-client";
import { invokeCloudCode } from "@/server/connectors/backendless/cloud-code-client";

type GeoResult = {
  lat?: number | string;
  lon?: number | string;
};

type ParentMapRow = {
  objectId?: string;
  lead_id?: string;
  share_contact?: string;
};

function buildGeoPoint(lat: number, lon: number) {
  return {
    __type: "GeoPoint",
    latitude: lat,
    longitude: lon,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function geocodeLead(
  leadId: string,
  fetchImpl: typeof fetch,
): Promise<GeoResult | null> {
  try {
    return await invokeCloudCode<GeoResult>({
      service: "uiBuilder",
      method: "UIGeocodeChargebeeAddressConversion",
      body: leadId,
      fetchImpl,
    });
  } catch {
    return null;
  }
}

async function maskLocation(
  lat: number,
  lon: number,
  fetchImpl: typeof fetch,
): Promise<GeoResult | null> {
  try {
    return await invokeCloudCode<GeoResult>({
      service: "uiBuilder",
      method: "UIGeocodeMaskLocation",
      body: { lat, lon },
      fetchImpl,
    });
  } catch {
    return null;
  }
}

async function linkStudentDirRelation(
  parentMapId: string,
  studentDirId: string,
  fetchImpl: typeof fetch,
): Promise<void> {
  const restUrl = process.env.BACKENDLESS_REST_URL?.replace(/\/$/, "");
  if (!restUrl) {
    return;
  }

  await fetchImpl(
    `${restUrl}/data/${BACKENDLESS_TABLES.parentMaps}/${encodeURIComponent(parentMapId)}/student_dir`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([studentDirId]),
    },
  );
}

export async function syncParentMapForContactSave(
  leadId: string,
  studentDirObjectId: string,
  shareContact: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (process.env.EXTERNAL_WRITES_ENABLED !== "true") {
    return;
  }

  const shareValue = shareContact ? "Yes" : "No";
  const existing = await findAppRows<ParentMapRow>(
    BACKENDLESS_TABLES.parentMaps,
    { lead_id: leadId },
    fetchImpl,
  );

  if (existing.length === 0) {
    const geocode = await geocodeLead(leadId, fetchImpl);
    const lat = toNumber(geocode?.lat);
    const lon = toNumber(geocode?.lon);

    const payload: Record<string, unknown> = {
      lead_id: leadId,
      share_contact: shareValue,
    };

    if (lat !== null && lon !== null) {
      payload.location = buildGeoPoint(lat, lon);
      const masked = await maskLocation(lat, lon, fetchImpl);
      const maskedLat = toNumber(masked?.lat);
      const maskedLon = toNumber(masked?.lon);
      if (maskedLat !== null && maskedLon !== null) {
        payload.masked_location = buildGeoPoint(maskedLat, maskedLon);
      }
    }

    const created = await createAppRow(BACKENDLESS_TABLES.parentMaps, payload, fetchImpl);
    await linkStudentDirRelation(created.objectId, studentDirObjectId, fetchImpl);
    return;
  }

  const parentMap = existing[0];
  if (!parentMap.objectId) {
    return;
  }

  await updateAppRow(
    BACKENDLESS_TABLES.parentMaps,
    parentMap.objectId,
    { share_contact: shareValue },
    fetchImpl,
  );
  await linkStudentDirRelation(parentMap.objectId, studentDirObjectId, fetchImpl);
}
