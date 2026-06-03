const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface MatchJobsRequest {
  skills: string;
  experience_level: string;
  hourly_rate: string;
}

export interface JobMatch {
  title: string;
  description: string;
  budget: string | null;
  url: string;
  source: string;
  match_percentage: number;
  keyword_baseline_score: number;
}

export interface MatchJobsResponse {
  jobs: JobMatch[];
  session_id?: string | null;
  feed_errors?: { source: string; url: string; error: string }[];
}

export type ProposalTone = "professional" | "friendly" | "concise";

export interface GenerateProposalRequest {
  session_id?: string | null;
  job_title: string;
  job_description: string;
  user_skills: string;
  user_experience: string;
  tone: ProposalTone;
}

export interface GenerateProposalResponse {
  proposal: string;
  word_count: number;
  proposal_id?: string | null;
  estimated_writing_time_saved: string;
}

export interface ScoreProposalRequest {
  proposal_id?: string | null;
  proposal: string;
  job_description: string;
}

export interface ScoreProposalResponse {
  relevance: number;
  specificity: number;
  cta_strength: number;
  overall: number;
  tip: string;
}

export interface HealthResponse {
  status: string;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  console.log(`[API] POST ${path}`, body);
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[API] POST ${path} failed:`, res.status, text);
    throw new Error(text || `Request failed (${res.status})`);
  }
  const data = (await res.json()) as T;
  console.log(`[API] POST ${path} success`);
  return data;
}

export async function matchJobs(
  payload: MatchJobsRequest
): Promise<MatchJobsResponse> {
  return apiPost<MatchJobsResponse>("/api/match-jobs", payload);
}

export async function generateProposal(
  payload: GenerateProposalRequest
): Promise<GenerateProposalResponse> {
  return apiPost<GenerateProposalResponse>("/api/generate-proposal", payload);
}

export async function scoreProposal(
  payload: ScoreProposalRequest
): Promise<ScoreProposalResponse> {
  return apiPost<ScoreProposalResponse>("/api/score-proposal", payload);
}

export async function healthCheck(): Promise<HealthResponse> {
  console.log("[API] GET /api/health");
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json() as Promise<HealthResponse>;
}
