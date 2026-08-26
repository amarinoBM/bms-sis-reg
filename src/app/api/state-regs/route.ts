import { z } from "zod";

import { findStateRegByName } from "@/modules/state-regs/repository";
import { toStateRegDto } from "@/modules/state-regs/state-regs-logic";
import { runRoute } from "@/server/http/route-handler";

const querySchema = z.object({
  state: z.string().min(1),
});

export async function GET(request: Request) {
  return runRoute(async () => {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      state: url.searchParams.get("state"),
    });

    const record = await findStateRegByName(parsed.state);
    if (!record) {
      return { stateReg: null };
    }

    return { stateReg: toStateRegDto(record) };
  });
}
