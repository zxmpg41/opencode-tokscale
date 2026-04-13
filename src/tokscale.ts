import { execFile } from "child_process"
import type { ModelReportJson, TimePeriod, PeriodStats } from "./types"
import { PERIOD_FLAGS } from "./types"

let cachedDetection: boolean | null = null

export function resetDetectionCache(): void {
  cachedDetection = null
}

export function detectTokscale(): Promise<boolean> {
  if (cachedDetection !== null) return Promise.resolve(cachedDetection)

  return new Promise((resolve) => {
    execFile("which", ["tokscale"], { timeout: 5000 }, (error) => {
      cachedDetection = !error
      resolve(cachedDetection)
    })
  })
}

export function fetchPeriodStats(
  period: TimePeriod,
  options?: { openCodeOnly?: boolean },
): Promise<PeriodStats> {
  const args = ["models", "--json", PERIOD_FLAGS[period], "--no-spinner"]
  if (options?.openCodeOnly !== false) args.push("--opencode")

  return new Promise((resolve, reject) => {
    execFile(
      "tokscale",
      args,
      { timeout: 15000, maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(new Error(`tokscale CLI failed: ${error.message}`))
          return
        }
        try {
          const report = parseModelReport(stdout as string)
          resolve(reportToStats(report))
        } catch (e) {
          reject(e)
        }
      },
    )
  })
}

export function parseModelReport(stdout: string): ModelReportJson {
  if (!stdout) throw new Error("Empty output from tokscale CLI")

  let parsed: unknown
  try {
    parsed = JSON.parse(stdout)
  } catch {
    throw new Error(`Invalid JSON from tokscale CLI: ${stdout.slice(0, 100)}`)
  }

  const report = parsed as Record<string, unknown>
  if (
    typeof report.totalInput !== "number" ||
    typeof report.totalOutput !== "number" ||
    typeof report.totalCost !== "number"
  ) {
    throw new Error("Invalid tokscale report: missing required numeric fields")
  }

  return parsed as ModelReportJson
}

export function reportToStats(report: ModelReportJson): PeriodStats {
  return {
    totalTokens:
      report.totalInput + report.totalOutput + report.totalCacheRead + report.totalCacheWrite,
    totalCost: report.totalCost,
    totalMessages: report.totalMessages,
    fetchedAt: Date.now(),
  }
}
