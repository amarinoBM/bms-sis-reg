import { describe, expect, it } from "vitest";
import type { AdminEditActor } from "@/modules/admin/policy";
import { buildStepSavePayload, pickSaveStepFields } from "@/modules/wizard/save-service";

const actor: AdminEditActor = { role: "admin", actorRef: "synthetic-admin", operationId: "synthetic-operation" };

describe("admin first-name corrections", () => {
  it("retains the parent picker behavior, even with a forged actor in fields", () => {
    expect(pickSaveStepFields("save1", { student_name: "Alexander", actor, student_last_name: "Example" }))
      .toEqual({ student_last_name: "Example" });
  });

  it("accepts and trims the name only for the server-authorized admin save1", () => {
    expect(pickSaveStepFields("save1", { student_name: " Alexander " }, actor)).toEqual({ student_name: "Alexander" });
    expect(pickSaveStepFields("save8", { student_name: "Alexander" }, actor)).toEqual({});
  });

  it.each([null, 123, "", "   ", "Alex [delete]", "[DELETE] Alex"])("rejects an invalid or reserved name: %s", (student_name) => {
    expect(() => pickSaveStepFields("save1", { student_name }, actor)).toThrow();
  });

  it("writes a first-name-only correction with trusted attribution", () => {
    const result = buildStepSavePayload("save1", { student_name: " Alexander ", actor: { role: "forged" } }, { student_name: "Alex" }, actor);
    expect(result.student_name).toBe("Alexander");
    expect(result.UpdateHistory).toEqual([expect.objectContaining({ fields: ["student_name"], actor })]);
    expect(result.actor).toBeUndefined();
  });
});
