import { describe, expect, it, vi, beforeEach } from "vitest"
import type { ModelReportJson, PeriodStats } from "../types"

const validReport: ModelReportJson = {
  groupBy: "client,model",
  entries: [],
  totalInput: 1234567,
  totalOutput: 567890,
  totalCacheRead: 890123,
  totalCacheWrite: 12345,
  totalMessages: 456,
  totalCost: 12.34,
  processingTimeMs: 175,
}

const validReportJson = JSON.stringify(validReport)

vi.mock("child_process", () => ({
  execFile: vi.fn(),
}))

import { execFile } from "child_process"
import { detectTokscale, fetchPeriodStats, parseModelReport, reportToStats, resetDetectionCache } from "../tokscale"

const mockExecFile = vi.mocked(execFile)

function mockExecFileSuccess(stdout: string) {
  mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
    const callback = typeof _opts === "function" ? _opts : cb
    ;(callback as Function)(null, stdout, "")
    return {} as ReturnType<typeof execFile>
  })
}

function mockExecFileError(error: Error & { code?: number }) {
  mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
    const callback = typeof _opts === "function" ? _opts : cb
    ;(callback as Function)(error, "", "")
    return {} as ReturnType<typeof execFile>
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetDetectionCache()
})

describe("detectTokscale", () => {
  it("returns true when which tokscale succeeds", async () => {
    mockExecFileSuccess("/usr/local/bin/tokscale")
    const result = await detectTokscale()
    expect(result).toBe(true)
    expect(mockExecFile).toHaveBeenCalledWith(
      "which",
      ["tokscale"],
      expect.objectContaining({ timeout: 5000 }),
      expect.any(Function),
    )
  })

  it("returns false when which tokscale fails with exit code 1", async () => {
    const error = Object.assign(new Error("not found"), { code: 1 })
    mockExecFileError(error)
    const result = await detectTokscale()
    expect(result).toBe(false)
  })

  it("returns false when which tokscale times out", async () => {
    const error = Object.assign(new Error("timeout"), { code: "ETIMEDOUT" as unknown as number })
    mockExecFileError(error)
    const result = await detectTokscale()
    expect(result).toBe(false)
  })
})

describe("fetchPeriodStats", () => {
  it("returns parsed PeriodStats on successful CLI call", async () => {
    mockExecFileSuccess(validReportJson)
    const stats = await fetchPeriodStats("today")
    expect(stats.totalTokens).toBe(1234567 + 567890 + 890123 + 12345)
    expect(stats.totalCost).toBe(12.34)
    expect(stats.totalMessages).toBe(456)
    expect(stats.fetchedAt).toBeTypeOf("number")
  })

  it("passes correct CLI args for today with openCodeOnly=true (default)", async () => {
    mockExecFileSuccess(validReportJson)
    await fetchPeriodStats("today")
    expect(mockExecFile).toHaveBeenCalledWith(
      "tokscale",
      ["models", "--json", "--today", "--no-spinner", "--opencode"],
      expect.objectContaining({ timeout: 15000, maxBuffer: 1024 * 1024 }),
      expect.any(Function),
    )
  })

  it("passes CLI args without --opencode when openCodeOnly=false", async () => {
    mockExecFileSuccess(validReportJson)
    await fetchPeriodStats("today", { openCodeOnly: false })
    expect(mockExecFile).toHaveBeenCalledWith(
      "tokscale",
      ["models", "--json", "--today", "--no-spinner"],
      expect.objectContaining({ timeout: 15000 }),
      expect.any(Function),
    )
  })

  it("returns PeriodStats with zero totals for empty entries but valid JSON", async () => {
    const emptyReport: ModelReportJson = {
      groupBy: "client,model",
      entries: [],
      totalInput: 0,
      totalOutput: 0,
      totalCacheRead: 0,
      totalCacheWrite: 0,
      totalMessages: 0,
      totalCost: 0,
      processingTimeMs: 10,
    }
    mockExecFileSuccess(JSON.stringify(emptyReport))
    const stats = await fetchPeriodStats("today")
    expect(stats.totalTokens).toBe(0)
    expect(stats.totalCost).toBe(0)
    expect(stats.totalMessages).toBe(0)
  })

  it("throws error when CLI exits with code 1", async () => {
    const error = Object.assign(new Error("CLI failed"), { code: 1 })
    mockExecFileError(error)
    await expect(fetchPeriodStats("today")).rejects.toThrow()
  })

  it("throws error when CLI returns invalid JSON", async () => {
    mockExecFileSuccess("not json at all")
    await expect(fetchPeriodStats("today")).rejects.toThrow()
  })

  it("throws error when CLI times out", async () => {
    const error = Object.assign(new Error("timeout"), { code: "ETIMEDOUT" as unknown as number })
    mockExecFileError(error)
    await expect(fetchPeriodStats("today")).rejects.toThrow()
  })
})

describe("parseModelReport", () => {
  it("parses valid JSON string into ModelReportJson", () => {
    const result = parseModelReport(validReportJson)
    expect(result).toEqual(validReport)
  })

  it("throws error for empty string", () => {
    expect(() => parseModelReport("")).toThrow()
  })

  it("throws error for invalid JSON", () => {
    expect(() => parseModelReport("{invalid}")).toThrow()
  })

  it("throws error for valid JSON missing totalInput", () => {
    const incomplete = JSON.stringify({ groupBy: "client,model", entries: [], totalOutput: 0 })
    expect(() => parseModelReport(incomplete)).toThrow()
  })
})

describe("reportToStats", () => {
  it("converts ModelReportJson to PeriodStats", () => {
    const stats = reportToStats(validReport)
    expect(stats.totalTokens).toBe(1234567 + 567890 + 890123 + 12345)
    expect(stats.totalCost).toBe(12.34)
    expect(stats.totalMessages).toBe(456)
    expect(stats.fetchedAt).toBeTypeOf("number")
    expect(stats.fetchedAt).toBeGreaterThan(0)
  })
})
