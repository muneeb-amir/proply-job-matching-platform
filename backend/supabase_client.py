"""Supabase client helpers for Proply persistence."""

import asyncio
import logging
import os
from typing import Any

from supabase import Client, create_client

logger = logging.getLogger("proply")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

_client: Client | None = None


def get_supabase() -> Client | None:
    global _client
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _client


def normalize_source(source: str) -> str:
    lowered = source.strip().lower()
    if "upwork" in lowered:
        return "upwork"
    if "freelancer" in lowered:
        return "freelancer"
    return lowered or "unknown"


async def create_user_session(
    skills: str, experience_level: str, hourly_rate: str
) -> str | None:
    client = get_supabase()
    if not client:
        logger.warning("Supabase not configured; skipping user_sessions insert")
        return None

    def _insert() -> str | None:
        result = (
            client.table("user_sessions")
            .insert(
                {
                    "skills": skills,
                    "experience_level": experience_level,
                    "hourly_rate": hourly_rate or "",
                }
            )
            .execute()
        )
        if result.data:
            return str(result.data[0]["id"])
        return None

    try:
        return await asyncio.to_thread(_insert)
    except Exception:
        logger.exception("Failed to insert user_sessions row")
        return None


async def insert_job_matches(
    session_id: str, jobs: list[dict[str, Any]]
) -> None:
    client = get_supabase()
    if not client or not jobs:
        return

    rows = [
        {
            "session_id": session_id,
            "job_title": job["title"],
            "job_url": job["url"],
            "source": normalize_source(job["source"]),
            "match_percentage": job["match_percentage"],
            "keyword_baseline_score": job["keyword_baseline_score"],
        }
        for job in jobs
    ]

    def _insert() -> None:
        client.table("job_matches").insert(rows).execute()

    try:
        await asyncio.to_thread(_insert)
        logger.info("Inserted %d job_matches for session %s", len(rows), session_id)
    except Exception:
        logger.exception("Failed to insert job_matches rows")


async def insert_proposal(
    session_id: str,
    job_title: str,
    tone: str,
    proposal_text: str,
) -> str | None:
    client = get_supabase()
    if not client:
        logger.warning("Supabase not configured; skipping proposals insert")
        return None

    def _insert() -> str | None:
        result = (
            client.table("proposals")
            .insert(
                {
                    "session_id": session_id,
                    "job_title": job_title,
                    "tone": tone,
                    "proposal_text": proposal_text,
                }
            )
            .execute()
        )
        if result.data:
            return str(result.data[0]["id"])
        return None

    try:
        return await asyncio.to_thread(_insert)
    except Exception:
        logger.exception("Failed to insert proposals row")
        return None


async def update_proposal_scores(
    proposal_id: str,
    relevance: float,
    specificity: float,
    cta_score: float,
    overall: float,
) -> None:
    client = get_supabase()
    if not client:
        logger.warning("Supabase not configured; skipping proposals update")
        return

    def _update() -> None:
        client.table("proposals").update(
            {
                "relevance_score": relevance,
                "specificity_score": specificity,
                "cta_score": cta_score,
                "overall_score": overall,
            }
        ).eq("id", proposal_id).execute()

    try:
        await asyncio.to_thread(_update)
        logger.info("Updated proposal scores for %s", proposal_id)
    except Exception:
        logger.exception("Failed to update proposals row %s", proposal_id)
