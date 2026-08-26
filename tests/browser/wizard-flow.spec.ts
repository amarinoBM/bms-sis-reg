import { test, expect } from "@playwright/test";

test("students save route requires parent session", async ({ request }) => {
  const response = await request.post("/api/students/save", {
    data: {
      leadId: "lead_test",
      objectId: "student-dir-1",
      saveStep: "save2",
      fields: { most_interested_in: "Robotics" },
      studentName: "Noah",
    },
  });

  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.error.code).toBe("UNAUTHENTICATED");
});

test("students unlock route requires parent session", async ({ request }) => {
  const response = await request.post("/api/students/unlock", {
    data: {
      leadId: "lead_test",
      objectId: "student-dir-1",
      stepId: "2",
    },
  });

  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.error.code).toBe("UNAUTHENTICATED");
});

test("sis complete route requires parent session", async ({ request }) => {
  const response = await request.post("/api/sis/complete", {
    data: {
      leadId: "lead_test",
      objectId: "student-dir-1",
      studentName: "Noah",
    },
  });

  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.error.code).toBe("UNAUTHENTICATED");
});
