import { describe, expect, it } from "vitest";
import {
  calculateDeposit,
  currencyExponent,
  toMinorUnits
} from "@/lib/money";

describe("money", () => {
  it("converts two-decimal currencies without floating point", () => {
    expect(toMinorUnits("2,500.25", "AED")).toBe(250025n);
  });

  it("supports zero and three decimal currencies", () => {
    expect(currencyExponent("JPY")).toBe(0);
    expect(toMinorUnits("15", "JPY")).toBe(15n);
    expect(toMinorUnits("12.345", "KWD")).toBe(12345n);
  });

  it("rejects excess precision", () => {
    expect(() => toMinorUnits("1.234", "AED")).toThrow(
      "AED supports 2 decimal places."
    );
  });

  it("rounds deposits to the nearest minor unit", () => {
    expect(calculateDeposit(10001n, 5_000)).toBe(5001n);
  });
});
