import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Cosine similarity (for client-side previews; primary matching runs on the backend). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

export function getMatchProgressColor(score: number): string {
  if (score >= 70) return "bg-emerald-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-red-500"
}

export function formatImprovement(
  aiMatch: number,
  keywordMatch: number
): number {
  return Math.round((aiMatch - keywordMatch) * 10) / 10
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}…`
}
