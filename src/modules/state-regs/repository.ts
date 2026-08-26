import { BACKENDLESS_TABLES } from "@/config/backendless";
import { findAppRows } from "@/server/connectors/backendless/app-data-client";

import { stateNameForBackendlessQuery } from "./state-regs-logic";
import type { StateRegRecord } from "./types";

export async function findStateRegByName(stateName: string): Promise<StateRegRecord | null> {
  const trimmedStateName = stateName.trim();
  if (!trimmedStateName) {
    return null;
  }

  const hyphenatedStateName = stateNameForBackendlessQuery(trimmedStateName);
  const queryNames =
    hyphenatedStateName === trimmedStateName
      ? [trimmedStateName]
      : [hyphenatedStateName, trimmedStateName];

  for (const queryName of queryNames) {
    const rows = await findAppRows<StateRegRecord>(BACKENDLESS_TABLES.stateRegs, {
      State_Name: queryName,
    });

    if (rows.length > 0) {
      return rows[0];
    }
  }

  return null;
}
