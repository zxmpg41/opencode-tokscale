import { describe, expect, it } from "vitest"
import { formatTokens, formatCost, computeTotalTokens } from "../format"
import type { ModelReportJson } from "../types"

describe("formatTokens", () => {
  it("returns '0' for zero", () => {
    expect(formatTokens(0)).toBe("0")
  })

  it("returns raw number below 1000", () => {
    expect(formatTokens(500)).toBe("500")
  })

  it("formats thousands with K suffix", () => {
    expect(formatTokens(1_000)).toBe("1.0K")
    expect(formatTokens(1_500)).toBe("1.5K")
    expect(formatTokens(12_345)).toBe("12.3K")
  })

  it("formats near-million as K", () => {
    expect(formatTokens(999_999)).toBe("1000.0K")
  })

  it("formats millions with M suffix", () => {
    expect(formatTokens(1_000_000)).toBe("1.0M")
    expect(formatTokens(1_234_567)).toBe("1.2M")
    expect(formatTokens(12_345_678)).toBe("12.3M")
  })

  it("formats billions with B suffix", () => {
    expect(formatTokens(1_000_000_000)).toBe("1.0B")
  })

  it("clamps negatives to 0", () => {
    expect(formatTokens(-1)).toBe("0")
  })
})

describe("formatCost", () => {
  it("returns '$0.00' for zero", () => {
    expect(formatCost(0)).toBe("$0.00")
  })

  it("rounds small values up", () => {
    expect(formatCost(0.005)).toBe("$0.01")
  })

  it("formats with 2 decimal places", () => {
    expect(formatCost(1.5)).toBe("$1.50")
    expect(formatCost(12.34)).toBe("$12.34")
    expect(formatCost(123.456)).toBe("$123.46")
  })

  it("adds thousands separator", () => {
    expect(formatCost(1234.5)).toBe("$1,234.50")
  })

  it("clamps negatives to $0.00", () => {
    expect(formatCost(-1)).toBe("$0.00")
  })
})

describe("computeTotalTokens", () => {
  it("sums input, output, cacheRead, cacheWrite", () => {
    const report: ModelReportJson = {
      groupBy: "client,model",
      entries: [],
      totalInput: 100,
      totalOutput: 50,
      totalCacheRead: 30,
      totalCacheWrite: 10,
      totalMessages: 5,
      totalCost: 1.0,
      processingTimeMs: 42,
    }
    expect(computeTotalTokens(report)).toBe(190)
  })

  it("returns 0 for all-zero report", () => {
    const report: ModelReportJson = {
      groupBy: "client,model",
      entries: [],
      totalInput: 0,
      totalOutput: 0,
      totalCacheRead: 0,
      totalCacheWrite: 0,
      totalMessages: 0,
      totalCost: 0,
      processingTimeMs: 0,
    }
    expect(computeTotalTokens(report)).toBe(0)
  })

  it("uses total fields not per-entry sum", () => {
    const report: ModelReportJson = {
      groupBy: "client,model",
      entries: [
        {
          client: "OpenCode",
          mergedClients: null,
          model: "claude-sonnet-4",
          provider: "anthropic",
          input: 9999,
          output: 9999,
          cacheRead: 9999,
          cacheWrite: 9999,
          reasoning: 9999,
          messageCount: 1,
          cost: 99.99,
        },
      ],
      totalInput: 10,
      totalOutput: 20,
      totalCacheRead: 30,
      totalCacheWrite: 40,
      totalMessages: 1,
      totalCost: 1.0,
      processingTimeMs: 10,
    }
    expect(computeTotalTokens(report)).toBe(100)
  })
})
