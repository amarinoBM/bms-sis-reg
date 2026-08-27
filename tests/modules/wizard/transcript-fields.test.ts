import { describe, expect, it } from "vitest";

import {
  readCreditTransferSubjects,
  readTranscriptDeliveryChoice,
  readTranscriptFiles,
  TRANSCRIPT_DELIVERY_SCHOOL,
  TRANSCRIPT_DELIVERY_UPLOAD,
} from "@/modules/wizard/transcript-fields";

describe("transcript-fields", () => {
  it("reads delivery choices from legacy uploadTranscript strings", () => {
    expect(readTranscriptDeliveryChoice(TRANSCRIPT_DELIVERY_UPLOAD)).toBe(
      TRANSCRIPT_DELIVERY_UPLOAD,
    );
    expect(readTranscriptDeliveryChoice(TRANSCRIPT_DELIVERY_SCHOOL)).toBe(
      TRANSCRIPT_DELIVERY_SCHOOL,
    );
  });

  it("normalizes transcript file arrays", () => {
    expect(readTranscriptFiles(["https://drive.google.com/file/d/abc/view"])).toEqual([
      "https://drive.google.com/file/d/abc/view",
    ]);
    expect(readCreditTransferSubjects("[\"Spanish\", \"Algebra 1\"]")).toEqual([
      "Spanish",
      "Algebra 1",
    ]);
  });
});
