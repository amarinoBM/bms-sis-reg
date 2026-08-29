import { describe, expect, it } from "vitest";
import { isAllowedAdmin, isAdminSessionActive, normalizeAdminSearch } from "@/modules/admin/policy";

describe("admin access policy", () => {
  it("allows only Andreas's exact mailbox, case-insensitively", () => {
    expect(isAllowedAdmin(" AM@brilliantmicroschool.org ")).toBe(true);
    for (const email of ["other@brilliantmicroschool.org", "am+test@brilliantmicroschool.org", "am@brilliantmicroschool.org.evil.test", ""]) {
      expect(isAllowedAdmin(email)).toBe(false);
    }
  });
  it("expires idle and absolute sessions, including exact boundaries", () => {
    const now = 40_000_000;
    expect(isAdminSessionActive({ issuedAt: now - 1000, lastSeenAt: now - 1000 }, now)).toBe(true);
    expect(isAdminSessionActive({ issuedAt: now - 1000, lastSeenAt: now - 30 * 60_000 }, now)).toBe(false);
    expect(isAdminSessionActive({ issuedAt: now - 8 * 60 * 60_000, lastSeenAt: now }, now)).toBe(false);
    expect(isAdminSessionActive({ issuedAt: now + 1, lastSeenAt: now }, now)).toBe(false);
  });
  it("accepts full emails, lead IDs, and current or legacy registration links", () => {
    expect(normalizeAdminSearch("AM@EXAMPLE.COM")).toEqual({ email: "am@example.com" });
    expect(normalizeAdminSearch("lead_123")).toEqual({ leadId: "lead_123" });
    expect(normalizeAdminSearch("https://reg.brilliantmicroschools.org/reg?lead_id=lead_123")).toEqual({ leadId: "lead_123" });
    expect(normalizeAdminSearch("https://portal.brilliantgrades.com/Clever/?page=SIS#lead_id=lead_123")).toEqual({ leadId: "lead_123" });
  });
  it("rejects names, partial emails, malformed links, and unsafe lead IDs", () => {
    for (const value of ["a", "Alex Smith", "alex@", "https://example.com/no-lead", "lead_' OR 1=1", "x".repeat(501)]) {
      expect(() => normalizeAdminSearch(value)).toThrow();
    }
  });
});
