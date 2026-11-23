import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  "drizzle/migrations/0027_silence_resolved_follow_request_notifications.sql",
  "utf8",
);

const expectResolvedRequestToLeaveNoNotification = (branch: string) => {
  expect(branch).toContain("DELETE FROM public.business_notifications");
  expect(branch).toContain("AND kind IN ('follow_request', 'follow_request_declined', 'follow_request_withdrawn')");
  expect(branch).not.toMatch(/SET\s+kind\s*=\s*'follow_request_(declined|withdrawn)'/);
};

describe("resolved follow-request notifications", () => {
  it("removes the pending alert when a request is declined or withdrawn", () => {
    const branch = sql.slice(
      sql.indexOf("IF TG_OP = 'DELETE' THEN"),
      sql.indexOf("ELSIF TG_OP = 'UPDATE'"),
    );
    expectResolvedRequestToLeaveNoNotification(branch);
  });

  it("removes the pending alert when a pending status resolves without acceptance", () => {
    const branch = sql.slice(sql.indexOf("ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status <> 'pending' THEN"));
    expectResolvedRequestToLeaveNoNotification(branch);
  });
});
