"""One-off generator for eval_corpus_v1.sql — not part of application runtime."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "eval_corpus_v1.json").read_text(encoding="utf-8"))
lines = [
    "-- Evaluation corpus v1 import",
    "-- Run from repo root:",
    "--   psql -U postgres -d fyp_relevancy_system -f dataset/eval_corpus_v1.sql",
    "BEGIN;",
    "",
    "-- Re-import cleanup (optional):",
    "-- DELETE FROM project_ideas WHERE title LIKE '[EVAL-%';",
    "",
]


def esc(value: str) -> str:
    return value.replace("'", "''")


for i, project in enumerate(data["projects"]):
    eval_id = project["eval_id"]
    title = f"[{eval_id}] {project['title']}"
    student_offset = i % 3
    lines.append(f"-- {eval_id} | group={project['category_group']}")
    lines.append("INSERT INTO project_ideas (")
    lines.append("  student_id, professor_id, title, technologies, description,")
    lines.append("  category, target_industry, problem_statement, proposed_solution,")
    lines.append("  unique_features, innovation_aspect, target_users, expected_impact,")
    lines.append("  professor_email, status, submitted_date")
    lines.append(") SELECT")
    lines.append(f"  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET {student_offset}),")
    lines.append(
        "  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id"
        " WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),"
    )
    text_cols = [
        title,
        project["technologies"],
        project["description"],
        project["target_industry"],
        project["target_industry"],
        project["problem_statement"],
        project["proposed_solution"],
        project["unique_features"],
        project["innovation_aspect"],
        project["target_users"],
        project["expected_impact"],
    ]
    for col in text_cols:
        lines.append(f"  '{esc(col)}',")
    lines.append("  'professor@uol.edu.pk',")
    lines.append("  'PENDING',")
    lines.append("  CURRENT_DATE")
    lines.append("WHERE NOT EXISTS (")
    lines.append(f"  SELECT 1 FROM project_ideas WHERE title = '{esc(title)}'")
    lines.append(");")
    lines.append("")

lines.extend(["COMMIT;", "", "-- After import: run relevancy analysis via API or backfill script."])
(ROOT / "eval_corpus_v1.sql").write_text("\n".join(lines), encoding="utf-8")
print(f"Generated {len(data['projects'])} INSERT statements")
