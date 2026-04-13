import type { ModelReportJson } from "./types"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatTokens(count: number): string {
  if (count <= 0) return "0"
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

export function formatCost(cost: number): string {
  if (cost <= 0) return "$0.00"
  return currencyFormatter.format(cost)
}

export function computeTotalTokens(report: ModelReportJson): number {
  return report.totalInput + report.totalOutput + report.totalCacheRead + report.totalCacheWrite
}
