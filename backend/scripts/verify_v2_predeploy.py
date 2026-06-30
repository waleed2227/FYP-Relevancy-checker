"""
Pre-deployment V2 verification — run from backend/:
  python -m scripts.verify_v2_predeploy
"""

from __future__ import annotations

import asyncio
import importlib.util
import sys
from pathlib import Path

_bootstrap_path = Path(__file__).resolve().parent / "_bootstrap.py"
_spec = importlib.util.spec_from_file_location("bootstrap", _bootstrap_path)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"Failed to load bootstrap from {_bootstrap_path}")
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.ai.embeddings import similarity_between
from app.ai.relevancy_engine import RelevancyEngine, build_combined_analysis_text
from app.ai.semantic_embeddings import is_semantic_engine_enabled, preload_model
from app.config.settings import get_settings
from app.database import AsyncSessionLocal
from app.models.project import ProjectIdea
from app.models.relevancy import MatchedProject, RelevancyResult

PARAPHRASE_PAIRS = [
    ("EVAL-P1A", "EVAL-P1B"),
    ("EVAL-P2A", "EVAL-P2B"),
    ("EVAL-P3A", "EVAL-P3B"),
    ("EVAL-P4A", "EVAL-P4B"),
    ("EVAL-P5A", "EVAL-P5B"),
]

UNRELATED_IDS = ["EVAL-U01", "EVAL-U02", "EVAL-U03", "EVAL-U04", "EVAL-U05"]
MATCH_THRESHOLD = 50.0


def _project_dict(p: ProjectIdea) -> dict:
    fields = (
        "title", "technologies", "description", "category", "target_industry",
        "problem_statement", "current_challenges", "existing_solutions",
        "existing_solution_limitations", "proposed_solution", "project_scope",
        "unique_features", "innovation_aspect", "competitive_advantage",
        "market_gap", "target_users", "secondary_target_users",
        "ai_technologies_used", "expected_impact",
    )
    return {f: getattr(p, f) for f in fields}


def _find_by_eval_id(projects: list[ProjectIdea], eval_id: str) -> ProjectIdea | None:
    needle = f"[{eval_id}]"
    for p in projects:
        if p.title.startswith(needle):
            return p
    return None


async def verify_db_paraphrase_matches(projects: list[ProjectIdea]) -> tuple[int, int, list[str]]:
    """Return (matched_pairs, total_pairs, failures)."""
    failures: list[str] = []
    matched = 0

    async with AsyncSessionLocal() as db:
        for a_id, b_id in PARAPHRASE_PAIRS:
            pa = _find_by_eval_id(projects, a_id)
            pb = _find_by_eval_id(projects, b_id)
            if not pa or not pb:
                failures.append(f"Missing project: {a_id} or {b_id}")
                continue

            rel = await db.execute(
                select(RelevancyResult)
                .options(selectinload(RelevancyResult.matched_projects))
                .where(RelevancyResult.project_id == pa.id)
            )
            result = rel.scalar_one_or_none()
            if not result:
                failures.append(f"{a_id}: no relevancy_result")
                continue

            partner_match = any(
                m.matched_project_id == pb.id or b_id in (m.title or "")
                for m in (result.matched_projects or [])
            )
            top_sim = max((m.similarity for m in result.matched_projects), default=0.0)
            if partner_match:
                matched += 1
                print(f"  DB OK  {a_id} <-> {b_id}  (top match sim={top_sim:.1f}%)")
            else:
                titles = [m.title[:50] for m in (result.matched_projects or [])[:3]]
                failures.append(f"{a_id} -> {b_id} not in matched_projects; top={titles}")

    return matched, len(PARAPHRASE_PAIRS), failures


async def verify_unrelated_false_positives(projects: list[ProjectIdea]) -> tuple[int, list[str]]:
    """Count unrelated cross-pairs incorrectly matched in DB (above threshold)."""
    unrelated = [_find_by_eval_id(projects, uid) for uid in UNRELATED_IDS]
    unrelated = [p for p in unrelated if p]
    false_positives = 0
    details: list[str] = []

    async with AsyncSessionLocal() as db:
        for i, pa in enumerate(unrelated):
            rel = await db.execute(
                select(RelevancyResult)
                .options(selectinload(RelevancyResult.matched_projects))
                .where(RelevancyResult.project_id == pa.id)
            )
            result = rel.scalar_one_or_none()
            if not result:
                continue
            for pb in unrelated[i + 1 :]:
                for m in result.matched_projects or []:
                    if m.matched_project_id == pb.id and m.similarity >= MATCH_THRESHOLD:
                        false_positives += 1
                        details.append(
                            f"  FP  {pa.title[:40]} <-> {pb.title[:40]}  sim={m.similarity:.1f}%"
                        )

    return false_positives, details


async def main() -> int:
    settings = get_settings()
    print("=" * 60)
    print("V2 PRE-DEPLOYMENT VERIFICATION")
    print("=" * 60)

    # 1. Settings
    print("\n[1] Environment")
    print(f"  RELEVANCY_ENGINE_V2_ENABLED = {settings.relevancy_engine_v2_enabled}")
    print(f"  SENTENCE_TRANSFORMER_MODEL  = {settings.sentence_transformer_model}")
    print(f"  SENTENCE_TRANSFORMER_DEVICE = {settings.sentence_transformer_device}")
    if not settings.relevancy_engine_v2_enabled:
        print("  FAIL: V2 is disabled in .env")
        return 1
    if not is_semantic_engine_enabled():
        print("  FAIL: semantic engine not enabled")
        return 1
    print("  OK")

    # 2. Model load
    print("\n[2] Model load")
    try:
        loaded = preload_model(local_files_only=True)
    except Exception as exc:
        print(f"  FAIL: {exc}")
        return 1
    if not loaded:
        print("  FAIL: model did not load (run download_sentence_transformer)")
        return 1
    print("  OK — sentence-transformer loaded from local cache")

    # 3. Load eval projects
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ProjectIdea).where(ProjectIdea.title.like("[EVAL-%")).order_by(ProjectIdea.id)
        )
        eval_projects = list(result.scalars().all())

    print(f"\n[3] Eval corpus: {len(eval_projects)} projects")

    # 4. Direct semantic similarity (paraphrase pairs)
    print("\n[4] Direct paraphrase similarity (V2 engine path)")
    direct_ok = 0
    for a_id, b_id in PARAPHRASE_PAIRS:
        pa = _find_by_eval_id(eval_projects, a_id)
        pb = _find_by_eval_id(eval_projects, b_id)
        if not pa or not pb:
            print(f"  SKIP {a_id}/{b_id} — project missing")
            continue
        sim = similarity_between(
            build_combined_analysis_text(_project_dict(pa)),
            build_combined_analysis_text(_project_dict(pb)),
        )
        ok = sim >= MATCH_THRESHOLD
        status = "OK" if ok else "FAIL"
        if ok:
            direct_ok += 1
        print(f"  {status}  {a_id} <-> {b_id}: {sim:.1f}%")
    print(f"  Result: {direct_ok}/{len(PARAPHRASE_PAIRS)} paraphrase pairs >= {MATCH_THRESHOLD}%")

    # 5. Unrelated direct similarity
    print("\n[5] Unrelated cross-similarity (direct, should stay low)")
    unrelated = [_find_by_eval_id(eval_projects, uid) for uid in UNRELATED_IDS]
    unrelated = [p for p in unrelated if p]
    high_unrelated = 0
    for i, pa in enumerate(unrelated):
        for pb in unrelated[i + 1 :]:
            sim = similarity_between(
                build_combined_analysis_text(_project_dict(pa)),
                build_combined_analysis_text(_project_dict(pb)),
            )
            if sim >= MATCH_THRESHOLD:
                high_unrelated += 1
                print(f"  HIGH  {pa.title[:35]} <-> {pb.title[:35]}: {sim:.1f}%")
    if high_unrelated == 0:
        print(f"  OK — 0/{len(unrelated)*(len(unrelated)-1)//2} unrelated pairs above {MATCH_THRESHOLD}%")
    else:
        print(f"  WARN — {high_unrelated} unrelated pairs above threshold")

    # 6. DB stored matches
    print("\n[6] Database matched_projects (paraphrase pairs)")
    db_matched, db_total, db_failures = await verify_db_paraphrase_matches(eval_projects)
    print(f"  Result: {db_matched}/{db_total} paraphrase pairs stored in DB")

    # 7. DB false positives among unrelated
    print("\n[7] Database false positives (unrelated U01–U05)")
    fp_count, fp_details = await verify_unrelated_false_positives(eval_projects)
    if fp_details:
        print("\n".join(fp_details))
    print(f"  Result: {fp_count} false positives")

    # 8. Project counts + relevancy coverage
    async with AsyncSessionLocal() as db:
        total = await db.execute(select(ProjectIdea.id))
        total_count = len(total.scalars().all())
        with_rel = await db.execute(select(RelevancyResult.id))
        rel_count = len(with_rel.scalars().all())

    print("\n[8] Database coverage")
    print(f"  Projects: {total_count}  |  With relevancy_result: {rel_count}")

    # Summary
    print("\n" + "=" * 60)
    passed = (
        settings.relevancy_engine_v2_enabled
        and loaded
        and direct_ok == len(PARAPHRASE_PAIRS)
        and db_matched == len(PARAPHRASE_PAIRS)
        and fp_count == 0
        and total_count == rel_count
    )
    if passed:
        print("PASS — V2 ready for deployment")
        return 0

    print("FAIL — issues found:")
    if direct_ok < len(PARAPHRASE_PAIRS):
        print(f"  - Direct paraphrase: {direct_ok}/{len(PARAPHRASE_PAIRS)}")
    if db_matched < len(PARAPHRASE_PAIRS):
        print(f"  - DB paraphrase matches: {db_matched}/{len(PARAPHRASE_PAIRS)}")
        for f in db_failures:
            print(f"    {f}")
    if fp_count > 0:
        print(f"  - Unrelated false positives: {fp_count}")
    if total_count != rel_count:
        print(f"  - Missing relevancy results: {total_count - rel_count} projects")
    return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
