import { describe, expect, it } from "vitest";
import { getInstantPulseReply } from "@/lib/pulse";

describe("getInstantPulseReply", () => {
  it("answers simple greetings without calling the AI", () => {
    expect(getInstantPulseReply("hi")).toContain("Hi!");
    expect(getInstantPulseReply("Hello!!")).toContain("upcoming invoices");
  });

  it("answers capability questions locally", () => {
    expect(getInstantPulseReply("what can you do?")).toContain("invoice report");
  });

  it("sends business questions to the server", () => {
    expect(getInstantPulseReply("Which invoices are overdue?")).toBeNull();
  });
});
