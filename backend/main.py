import asyncio
import json
import logging
import os
import re
from typing import Any, Literal
import feedparser
import google.generativeai as genai
#from sentence_transformers import SentenceTransformer
import httpx
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

from supabase_client import (
    create_user_session,
    insert_job_matches,
    insert_proposal,
    update_proposal_scores,
)

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("proply")
#embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

#EMBED_MODEL = "models/text-embedding-004"
#EMBED_FALLBACK_MODEL = "models/text-embedding-004"
GENERATION_MODEL = "gemini-2.5-flash"
GROQ_MODEL = "llama-3.3-70b-versatile"

RSS_FEEDS = [
    {
        "url": "https://www.freelancer.com/rss.xml",
        "source": "Freelancer",
    }
]

app = FastAPI(title="Proply API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Pydantic models ---


class MatchJobsRequest(BaseModel):
    skills: str
    experience_level: str
    hourly_rate: str = ""


class JobMatch(BaseModel):
    title: str
    description: str
    budget: str | None = None
    url: str
    source: str
    match_percentage: float
    keyword_baseline_score: float


class MatchJobsResponse(BaseModel):
    jobs: list[JobMatch]
    session_id: str | None = None
    feed_errors: list[dict[str, str]] = Field(default_factory=list)


class GenerateProposalRequest(BaseModel):
    session_id: str | None = None
    job_title: str
    job_description: str
    user_skills: str
    user_experience: str
    tone: Literal["professional", "friendly", "concise"]


class GenerateProposalResponse(BaseModel):
    proposal: str
    word_count: int
    proposal_id: str | None = None
    estimated_writing_time_saved: str = "~22 minutes"


class ScoreProposalRequest(BaseModel):
    proposal_id: str | None = None
    proposal: str
    job_description: str


class ScoreProposalResponse(BaseModel):
    relevance: int
    specificity: int
    cta_strength: int
    overall: int
    tip: str


class HealthResponse(BaseModel):
    status: str


# --- Helpers ---


def tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9+#.]+", text.lower())
    return {w for w in words if len(w) > 2}


def keyword_baseline_score(skills: str, description: str) -> float:
    skill_tokens = tokenize(skills)
    desc_tokens = tokenize(description)
    if not skill_tokens and not desc_tokens:
        return 0.0
    unique = skill_tokens | desc_tokens
    if not unique:
        return 0.0
    overlap = skill_tokens & desc_tokens
    return round((len(overlap) / len(unique)) * 100, 1)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.array(a, dtype=np.float64)
    vb = np.array(b, dtype=np.float64)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))


def _embed_sync(text: str) -> list[float]:
    embedding = embedding_model.encode(
        text[:8000],
        convert_to_numpy=True
    )
    return embedding.tolist()


async def embed_text(text: str) -> list[float]:
    try:
        return await asyncio.to_thread(
            _embed_sync,
            text
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Embedding failed: {exc}",
        ) from exc


def parse_budget(entry: dict[str, Any]) -> str | None:
    for key in ("budget", "salary", "price"):
        if entry.get(key):
            return str(entry[key])
    summary = entry.get("summary", "") or ""
    budget_match = re.search(
        r"\$[\d,]+(?:\s*-\s*\$[\d,]+)?|\b\d+\s*(?:USD|usd|/hr|per hour)",
        summary,
    )
    if budget_match:
        return budget_match.group(0)
    return None


def parse_feed_entries(
    parsed: feedparser.FeedParserDict, source: str
) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    for entry in parsed.entries:
        title = getattr(entry, "title", None) or "Untitled"
        description = (
            getattr(entry, "summary", None)
            or getattr(entry, "description", None)
            or ""
        )
        description = re.sub(r"<[^>]+>", "", description).strip()
        url = getattr(entry, "link", None) or ""
        budget = parse_budget(entry)
        jobs.append(
            {
                "title": title,
                "description": description,
                "budget": budget,
                "url": url,
                "source": source,
            }
        )
    return jobs


async def fetch_rss_feed(
    url: str, source: str
) -> tuple[list[dict[str, Any]], str | None]:
    try:
        async with httpx.AsyncClient(
            timeout=30.0,
            headers={"User-Agent": "Proply/1.0 (+https://github.com/proply)"},
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            content = response.text

        parsed = await asyncio.to_thread(feedparser.parse, content)
        if getattr(parsed, "bozo", False) and not parsed.entries:
            return [], f"Feed parse error for {source}"
        return parse_feed_entries(parsed, source), None
    except Exception as exc:
        logger.exception("RSS feed failed: %s", url)
        return [], str(exc)


async def fetch_all_jobs() -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    feed_errors: list[dict[str, str]] = []
    all_jobs: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    tasks = [fetch_rss_feed(f["url"], f["source"]) for f in RSS_FEEDS]
    results = await asyncio.gather(*tasks)

    for feed_cfg, (jobs, error) in zip(RSS_FEEDS, results):
        if error:
            feed_errors.append(
                {
                    "source": feed_cfg["source"],
                    "url": feed_cfg["url"],
                    "error": error,
                }
            )
        for job in jobs:
            if job["url"] and job["url"] in seen_urls:
                continue
            if job["url"]:
                seen_urls.add(job["url"])
            all_jobs.append(job)

    return all_jobs, feed_errors


def count_words(text: str) -> int:
    return len(text.split())


async def generate_with_groq(prompt: str, system: str) -> str:
    client = Groq(api_key=GROQ_API_KEY)

    def _call() -> str:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=512,
        )
        return completion.choices[0].message.content or ""

    return await asyncio.to_thread(_call)


async def generate_with_gemini(prompt: str, system: str) -> str:
    model = genai.GenerativeModel(
        GENERATION_MODEL,
        system_instruction=system,
    )

    def _call() -> str:
        response = model.generate_content(prompt)
        return response.text or ""

    return await asyncio.to_thread(_call)

async def score_job_relevance(
    skills: str,
    experience: str,
    job_title: str,
    job_description: str,
) -> float:

    prompt = f"""
User Skills:
{skills}

Experience Level:
{experience}

Job Title:
{job_title}

Job Description:
{job_description[:2500]}

Rate how suitable this job is for the user.

Return ONLY a number between 0 and 100.
"""

    model = genai.GenerativeModel(GENERATION_MODEL)

    def _call():
        response = model.generate_content(prompt)
        text = response.text.strip()

        match = re.search(r"\d+", text)
        if match:
            return float(match.group())

        return 50.0

    try:
        return await asyncio.to_thread(_call)
    except Exception:
        return 50.0





PROPOSAL_SYSTEM = (
    "You are an expert freelance proposal writer. Write winning proposals that are "
    "specific, avoid generic phrases like 'I am interested in your project', mention "
    "the client's specific problem, and end with a clear CTA."
)


# --- Routes ---


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    logger.info("Health check")
    return HealthResponse(status="ok")


@app.post("/api/match-jobs", response_model=MatchJobsResponse)
async def match_jobs(body: MatchJobsRequest) -> MatchJobsResponse:
    logger.info(
        "match-jobs: skills_len=%d experience=%s",
        len(body.skills),
        body.experience_level,
    )

    session_id = await create_user_session(
        body.skills,
        body.experience_level,
        body.hourly_rate,
    )

    raw_jobs, feed_errors = await fetch_all_jobs()
    skill_tokens = tokenize(body.skills)

    filtered_jobs = []

    for job in raw_jobs:

        text = (
            job["title"] + " " +
            job["description"]
        ).lower()

        overlap = sum(
            1 for token in skill_tokens
            if token in text
        )

        if overlap > 0:
            filtered_jobs.append(job)

    raw_jobs = filtered_jobs or raw_jobs
    logger.info("Fetched %d jobs from RSS feeds", len(raw_jobs))

    if not raw_jobs:
        return MatchJobsResponse(
            jobs=[], session_id=session_id, feed_errors=feed_errors
        )

    profile_text = (
        f"Skills: {body.skills}. "
        f"Experience: {body.experience_level}. "
        f"Hourly rate: {body.hourly_rate or 'not specified'}."
    )

    #user_embedding = await embed_text(profile_text)

    scored: list[JobMatch] = []

    for job in raw_jobs[:50]:
        desc = job["description"] or job["title"]
        kw_score = keyword_baseline_score(body.skills, desc)

        try:
            match_pct = await score_job_relevance(
                body.skills,
                body.experience_level,
                job["title"],
                desc,
            )

            #job_embedding = await embed_text(desc[:8000])
            #similarity = cosine_similarity(user_embedding, job_embedding)
            #match_pct = round(max(0.0, min(100.0, similarity * 100)), 1)
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning("Job embedding failed for %s: %s", job["title"], exc)
            match_pct = kw_score

        scored.append(
            JobMatch(
                title=job["title"],
                description=job["description"],
                budget=job.get("budget"),
                url=job["url"],
                source=job["source"],
                match_percentage=match_pct,
                keyword_baseline_score=kw_score,
            )
        )

    scored.sort(key=lambda j: j.match_percentage, reverse=True)
    top = scored[:10]
    logger.info("Returning top %d matches", len(top))

    if session_id:
        await insert_job_matches(
            session_id,
            [
                {
                    "title": j.title,
                    "url": j.url,
                    "source": j.source,
                    "match_percentage": j.match_percentage,
                    "keyword_baseline_score": j.keyword_baseline_score,
                }
                for j in top
            ],
        )

    return MatchJobsResponse(
        jobs=top, session_id=session_id, feed_errors=feed_errors
    )


@app.post("/api/generate-proposal", response_model=GenerateProposalResponse)
async def generate_proposal(body: GenerateProposalRequest) -> GenerateProposalResponse:
    logger.info("generate-proposal: job=%s tone=%s", body.job_title, body.tone)

    tone_guide = {
        "professional": "Use a polished, confident professional tone.",
        "friendly": "Use a warm, approachable but still competent tone.",
        "concise": "Be brief and direct; every sentence should add value.",
    }

    prompt = (
        f"Write a freelance proposal of exactly 150-200 words.\n"
        f"Tone: {body.tone}. {tone_guide[body.tone]}\n\n"
        f"Job title: {body.job_title}\n"
        f"Job description:\n{body.job_description}\n\n"
        f"Freelancer skills:\n{body.user_skills}\n"
        f"Experience level: {body.user_experience}\n\n"
        f"Return only the proposal text, no headings or labels."
    )

    proposal_text = ""
    try:
        if GROQ_API_KEY:
            proposal_text = await generate_with_groq(prompt, PROPOSAL_SYSTEM)
            logger.info("Proposal generated via Groq")
        else:
            raise ValueError("GROQ_API_KEY not set")
    except Exception as exc:
        logger.warning("Groq failed, falling back to Gemini: %s", exc)
        proposal_text = await generate_with_gemini(prompt, PROPOSAL_SYSTEM)
        logger.info("Proposal generated via Gemini fallback")

    proposal_text = proposal_text.strip()
    wc = count_words(proposal_text)

    proposal_id: str | None = None
    if body.session_id:
        proposal_id = await insert_proposal(
            body.session_id,
            body.job_title,
            body.tone,
            proposal_text,
        )

    return GenerateProposalResponse(
        proposal=proposal_text,
        word_count=wc,
        proposal_id=proposal_id,
        estimated_writing_time_saved="~22 minutes",
    )


@app.post("/api/score-proposal", response_model=ScoreProposalResponse)
async def score_proposal(body: ScoreProposalRequest) -> ScoreProposalResponse:
    logger.info("score-proposal: proposal_len=%d", len(body.proposal))

    scoring_prompt = f"""Score this freelance proposal against the job description.

Job description:
{body.job_description[:3000]}

Proposal:
{body.proposal[:3000]}

Return ONLY valid JSON with these integer fields (0-100):
- relevance: how well it addresses the job
- specificity: avoids generic phrases, mentions concrete details
- cta_strength: strength of call to action
- overall: weighted average (relevance 40%, specificity 35%, cta_strength 25%)
- tip: one brief sentence suggesting the most important improvement

Example format:
{{"relevance": 85, "specificity": 70, "cta_strength": 80, "overall": 78, "tip": "..."}}"""

    model = genai.GenerativeModel(GENERATION_MODEL)

    def _score() -> dict[str, Any]:
        response = model.generate_content(
            scoring_prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            ),
        )
        text = response.text or "{}"
        return json.loads(text)

    try:
        data = await asyncio.to_thread(_score)
    except Exception as exc:
        logger.exception("Score parsing failed")
        raise HTTPException(
            status_code=503,
            detail=f"Proposal scoring failed: {exc}",
        ) from exc

    overall = data.get("overall")
    if overall is None:
        r = int(data.get("relevance", 50))
        s = int(data.get("specificity", 50))
        c = int(data.get("cta_strength", 50))
        overall = round(r * 0.4 + s * 0.35 + c * 0.25)

    relevance = int(data.get("relevance", 50))
    specificity = int(data.get("specificity", 50))
    cta_strength = int(data.get("cta_strength", 50))
    overall_int = int(overall)

    if body.proposal_id:
        await update_proposal_scores(
            body.proposal_id,
            float(relevance),
            float(specificity),
            float(cta_strength),
            float(overall_int),
        )

    return ScoreProposalResponse(
        relevance=relevance,
        specificity=specificity,
        cta_strength=cta_strength,
        overall=overall_int,
        tip=str(data.get("tip", "Add a stronger, specific call to action.")),
    )
