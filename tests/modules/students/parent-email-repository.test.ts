import { beforeEach, describe, expect, it, vi } from "vitest";

import { findPreferredParentEmails } from "@/modules/students/repository";
import { decryptStudentDirRow } from "@/server/connectors/backendless/cloud-code-client";

vi.mock("@/server/connectors/backendless/cloud-code-client", () => ({
  decryptStudentDirRow: vi.fn(),
  encryptStudentDirRow: vi.fn(),
}));

const decryptRow = vi.mocked(decryptStudentDirRow);

describe("preferred parent email repository", () => {
  beforeEach(() => {
    vi.stubEnv("BACKENDLESS_REST_URL", "https://example.test/api");
    decryptRow.mockReset();
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
});
