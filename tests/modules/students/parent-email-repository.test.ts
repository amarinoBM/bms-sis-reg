import { beforeEach, describe, expect, it, vi } from "vitest";

import { findPreferredParentEmails, saveStudentStep } from "@/modules/students/repository";
import {
  decryptStudentDirRow,
  encryptStudentDirRow,
} from "@/server/connectors/backendless/cloud-code-client";
import { updateAppRow } from "@/server/connectors/backendless/app-data-client";

vi.mock("@/server/connectors/backendless/cloud-code-client", () => ({
  decryptStudentDirRow: vi.fn(),
  encryptStudentDirRow: vi.fn(),
}));
vi.mock("@/server/connectors/backendless/app-data-client", () => ({
  updateAppRow: vi.fn(),
}));
vi.mock("@/modules/parent-maps/sync-parent-map", () => ({
  syncParentMapForContactSave: vi.fn(),
}));

const decryptRow = vi.mocked(decryptStudentDirRow);
const encryptRow = vi.mocked(encryptStudentDirRow);
const updateRow = vi.mocked(updateAppRow);

describe("preferred parent email repository", () => {
  beforeEach(() => {
    vi.stubEnv("BACKENDLESS_REST_URL", "https://example.test/api");
    vi.stubEnv("EXTERNAL_WRITES_ENABLED", "true");
    decryptRow.mockReset();
    encryptRow.mockReset();
    updateRow.mockReset();
  });

  it("loads a family's enrolled rows once before decrypting each child", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          { objectId: "student_one", student_name: "One", slots: [{ status: "enrolled" }] },
          { objectId: "student_two", student_name: "Two", slots: [{ status: "enrolled" }] },
        ]),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    decryptRow
      .mockResolvedValueOnce({
        objectId: "student_one",
        student_name: "One",
        parent_email: "first@example.test",
      })
      .mockResolvedValueOnce({
        objectId: "student_two",
        student_name: "Two",
        parent_email: "second@example.test",
      });

    await expect(
      findPreferredParentEmails("lead_family", fetchImpl as typeof fetch),
    ).resolves.toEqual(["first@example.test", "second@example.test"]);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(decryptRow).toHaveBeenCalledTimes(2);
  });

  it("preserves both family addresses when the parent changes which one is primary", async () => {
    encryptRow.mockImplementation(async (_leadId, row) => row);
    updateRow.mockResolvedValue(undefined);

    await saveStudentStep(
      "lead_family",
      "student_one",
      "save1.5",
      {
        parent_name: "Parent",
        parent_email: "legacy@example.test",
        email: "untrusted@example.test",
      },
      {
        objectId: "student_one",
        parent_name: "Parent",
        parent_email: "current@example.test",
        email: "legacy@example.test",
      },
    );

    expect(encryptRow).toHaveBeenCalledWith(
      "lead_family",
      expect.objectContaining({
        objectId: "student_one",
        parent_email: "legacy@example.test",
        email: "current@example.test",
        changed_fields: expect.stringContaining("email"),
      }),
      expect.any(Function),
    );
  });
});
