import { describe, expect, it } from "vitest";
import { aiDraftSchema } from "@/lib/ai";

describe("aiDraftSchema", () => {
  it("accepts a structured draft with conservative defaults", () => {
    const draft = aiDraftSchema.parse({
      summary: "The client requested an additional landing page.",
      confidence: 0.88,
      findings: [
        {
          type: "request",
          title: "Additional landing page",
          evidence: "Can you also add another landing page?",
          recommendation: "Compare against the signed deliverables."
        }
      ]
    });
    expect(draft.deliverables).toEqual([]);
    expect(draft.changeOrder).toBeNull();
    expect(draft.confidence).toBe(0.88);
  });

  it("rejects unbounded confidence and unsafe deposit percentages", () => {
    expect(() =>
      aiDraftSchema.parse({
        summary: "Invalid",
        confidence: 1.4,
        changeOrder: {
          title: "Extra",
          reason: "Request",
          description: "Extra work",
          timelineImpact: "One week",
          depositPercentage: 0
        }
      })
    ).toThrow();
  });
});
