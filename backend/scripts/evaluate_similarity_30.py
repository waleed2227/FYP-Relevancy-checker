"""
30-pair similarity engine evaluation + independent Opus rater comparison.

This extends scripts/evaluate_similarity.py to a larger, balanced, hand-labeled
set of 30 project pairs and, in addition to running the REAL production pipeline
(build_semantic_text + embeddings.similarity_between), records an INDEPENDENT
human-style judgement made by an LLM rater (Anthropic "Opus") for every pair.

It produces:
  - per-pair table: ground-truth, engine score, engine prediction, Opus prediction
  - per-class similarity stats (mean/min/max) for the engine
  - Engine vs ground-truth: 3x3 confusion matrix, per-class P/R/F1, accuracy, macro-F1
  - Opus  vs ground-truth: accuracy + per-class accuracy
  - Engine vs Opus: agreement rate + Cohen's kappa
  - binary duplicate-detection (near-duplicate vs not) precision/recall
  - exactly 3 publication-quality PNG figures in scripts/eval_outputs/

Engine code is UNCHANGED — this script only reads from it, identical to the
code path used when a student submits a proposal.

Run from backend/:
  python -m scripts.evaluate_similarity_30
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
assert _spec is not None and _spec.loader is not None, "Could not load _bootstrap.py"
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from app.ai.embeddings import similarity_between
from app.ai.relevancy_engine import build_semantic_text

# ---------------------------------------------------------------------------
# Classification bands (similarity %). Re-used verbatim from
# scripts/evaluate_similarity.py — declared up-front, NOT fitted to results.
# ---------------------------------------------------------------------------
LOW_MAX = 50.0       # < 50           -> UNRELATED
HIGH_MIN = 68.0      # >= 68          -> NEAR_DUPLICATE
                     # 50..68         -> RELATED

# Binary duplicate detection threshold (matches app duplicate_similarity_threshold band).
DUPLICATE_MIN = 68.0

UNRELATED = "UNRELATED"
RELATED = "RELATED"
NEAR_DUP = "NEAR_DUPLICATE"
CLASSES = (UNRELATED, RELATED, NEAR_DUP)

OUTPUT_DIR = Path(__file__).resolve().parent / "eval_outputs"


def P(
    title, category, target_industry, problem, solution, unique, tech, users
) -> dict:
    return {
        "title": title,
        "category": category,
        "target_industry": target_industry,
        "problem_statement": problem,
        "proposed_solution": solution,
        "unique_features": unique,
        "technologies": tech,
        "target_users": users,
    }


# ===========================================================================
# Proposal pool
#   Block 1: the 17 proposals re-used verbatim from evaluate_similarity.py
#   Block 2: new proposals added to reach a balanced 30-pair set
# ===========================================================================

# --- Block 1: re-used from evaluate_similarity.py --------------------------
ER = P(
    "Emergency Room Patient Flow Optimization",
    "Data Science & Analytics", "Healthcare",
    "Hospital emergency departments suffer long wait times due to unpredictable congestion.",
    "Predict ED congestion and recommend staff and bed allocation to keep wait times manageable.",
    "Real-time congestion forecasting, bed allocation recommendations, triage dashboard.",
    "Python, FastAPI, scikit-learn, React, PostgreSQL",
    "Hospital administrators, ED nurses, triage staff",
)
ER_DUP = P(
    "Hospital Emergency Department Congestion Predictor",
    "Data Science & Analytics", "Healthcare",
    "Emergency departments face overcrowding and long patient waiting times that are hard to anticipate.",
    "A predictive dashboard that forecasts ER crowding and advises on bed and staff distribution to cut waiting.",
    "ED congestion prediction, staffing and bed recommendations, live wait-time dashboard.",
    "Python, scikit-learn, FastAPI, React, PostgreSQL",
    "Hospital management, emergency department staff",
)
HOSP_CHAT = P(
    "Hospital Appointment Booking Chatbot",
    "Artificial Intelligence / ML", "Healthcare",
    "Patients struggle to book the right specialist and often miss appointments.",
    "A conversational assistant that books appointments, sends reminders, and routes patients to the right department.",
    "NLP appointment booking, reminder system, department routing.",
    "Python, Rasa, NLP, React Native",
    "Outpatients, hospital reception staff",
)
DISASTER = P(
    "AI Disaster Impact Prediction System",
    "Artificial Intelligence / ML", "Disaster Management / Government",
    "Agencies lack intelligent decision support to predict disaster impact during floods and earthquakes.",
    "Predict disaster severity, recommend evacuation routes, and allocate rescue teams via a central dashboard.",
    "Disaster severity prediction, evacuation routing, rescue resource optimization.",
    "Python, TensorFlow, GIS, FastAPI, React",
    "Disaster management authorities, rescue agencies",
)
DISASTER_COORD = P(
    "Disaster Response Coordination Platform",
    "Mobile Application", "Disaster Management / Government",
    "During disasters, volunteers, resources and needs are poorly coordinated, slowing relief.",
    "Coordinate volunteers, resources and on-ground needs so help reaches affected people faster.",
    "Volunteer coordination, resource matching, needs mapping.",
    "React Native, Node.js, PostgreSQL, Google Maps API",
    "Relief organizations, volunteers, affected citizens",
)
CROP = P(
    "Crop Disease Detection from Leaf Images",
    "Artificial Intelligence / ML", "Agriculture",
    "Smallholder farmers cannot identify crop diseases early, causing yield loss.",
    "Detect crop diseases from leaf photos using a CNN and suggest treatment.",
    "Leaf-image disease classification, treatment suggestions, offline mobile use.",
    "Python, TensorFlow, CNN, Flutter",
    "Smallholder farmers, agriculture extension officers",
)
CROP_DUP = P(
    "Plant Leaf Disease Detection using Deep Learning",
    "Artificial Intelligence / ML", "Agriculture",
    "Farmers struggle to diagnose plant leaf diseases in time, leading to reduced harvests.",
    "A deep-learning model that classifies plant diseases from leaf images and recommends remedies.",
    "CNN leaf disease classification, remedy recommendations, mobile-first.",
    "Python, Keras, CNN, Flutter",
    "Farmers, agronomists",
)
IRRIGATION = P(
    "Smart Precision Irrigation System",
    "Internet of Things", "Agriculture",
    "Farmers over-water crops, wasting water and reducing efficiency.",
    "IoT soil sensors and weather data drive automated, precise irrigation scheduling.",
    "Soil-moisture sensing, weather-aware scheduling, automated valves.",
    "Arduino, IoT, Python, MQTT",
    "Farmers, irrigation managers",
)
ECOM = P(
    "E-commerce Product Recommendation Engine",
    "Data Science & Analytics", "Retail / E-commerce",
    "Online shoppers are overwhelmed by choice and miss relevant products.",
    "Recommend products from browsing and purchase history using collaborative filtering.",
    "Personalized recommendations, collaborative filtering, A/B testing.",
    "Python, scikit-learn, FastAPI, React",
    "Online shoppers, e-commerce merchants",
)
ECOM_DUP = P(
    "Online Shopping Personalized Recommendation System",
    "Data Science & Analytics", "Retail / E-commerce",
    "Shoppers on online stores find it hard to discover products that match their taste.",
    "A recommender that suggests products from user history and behavior using collaborative filtering.",
    "Behavior-based product recommendations, collaborative filtering, experiment framework.",
    "Python, scikit-learn, FastAPI, React",
    "Online customers, retailers",
)
FRAUD = P(
    "Banking Fraud Detection System",
    "Data Science & Analytics", "Finance / Banking",
    "Banks lose money to fraudulent transactions that rule-based systems miss.",
    "Detect fraudulent transactions in real time using anomaly detection models.",
    "Real-time anomaly detection, risk scoring, alerting.",
    "Python, scikit-learn, Kafka, PostgreSQL",
    "Bank risk teams, fraud analysts",
)
STOCK = P(
    "AI Stock Portfolio Advisor",
    "Artificial Intelligence / ML", "Finance / Banking",
    "Retail investors lack guidance to balance risk and return in their portfolios.",
    "Recommend portfolio allocations based on risk profile and market trends.",
    "Risk profiling, portfolio optimization, trend analysis.",
    "Python, pandas, scikit-learn, React",
    "Retail investors, financial advisors",
)
LANG = P(
    "Language Learning Mobile App",
    "Mobile Application", "Education",
    "Learners lack engaging, personalized ways to practice a new language daily.",
    "Gamified lessons with spaced repetition and speech feedback to learn languages.",
    "Spaced repetition, speech recognition feedback, gamified streaks.",
    "Flutter, Firebase, speech-to-text",
    "Language learners, students",
)
PLAGIARISM = P(
    "Academic Plagiarism Detection System",
    "Artificial Intelligence / ML", "Education",
    "Instructors struggle to detect paraphrased plagiarism in student submissions.",
    "Detect semantic plagiarism across submissions using text embeddings.",
    "Semantic similarity detection, cross-document comparison, report generation.",
    "Python, sentence-transformers, FastAPI",
    "University instructors, academic integrity offices",
)
PARKING = P(
    "Smart Parking Availability System",
    "Internet of Things", "Smart City",
    "Drivers waste time and fuel searching for available parking spots.",
    "IoT sensors detect free spots and guide drivers via a mobile app.",
    "Real-time spot detection, in-app navigation to free spaces.",
    "IoT, Arduino, Node.js, React Native",
    "City drivers, parking operators",
)
TRAFFIC = P(
    "Adaptive Traffic Signal Optimization",
    "Artificial Intelligence / ML", "Smart City",
    "Fixed-timing traffic signals cause congestion at busy intersections.",
    "Use reinforcement learning on live traffic feeds to adapt signal timing.",
    "RL-based signal control, live traffic adaptation, congestion reduction.",
    "Python, TensorFlow, computer vision",
    "City traffic departments, commuters",
)
MUSIC = P(
    "Music Streaming Recommendation App",
    "Mobile Application", "Entertainment / Media",
    "Listeners find it hard to discover new music matching their taste.",
    "Recommend songs and playlists from listening history.",
    "Personalized playlists, mood-based discovery, social sharing.",
    "Flutter, Python, scikit-learn",
    "Music listeners",
)

# --- Block 2: new proposals (3 near-duplicate variants + related/unrelated) ---
PLAGIARISM_DUP = P(
    "Semantic Plagiarism Checker for Student Essays",
    "Artificial Intelligence / ML", "Education",
    "Teachers cannot reliably catch reworded or paraphrased copying in essays.",
    "Compare student submissions using sentence embeddings to flag paraphrased plagiarism and produce a similarity report.",
    "Embedding-based similarity scoring, document-to-document comparison, originality report.",
    "Python, sentence-transformers, FastAPI, React",
    "Lecturers, academic integrity committees",
)
FRAUD_DUP = P(
    "Real-Time Credit Card Fraud Detector",
    "Data Science & Analytics", "Finance / Banking",
    "Card issuers keep losing money to fraudulent transactions that static rules cannot catch.",
    "Flag fraudulent card transactions as they happen using anomaly-detection models and risk scoring.",
    "Live anomaly detection, transaction risk scoring, real-time alerts.",
    "Python, scikit-learn, Kafka, PostgreSQL",
    "Bank fraud analysts, risk management teams",
)
TRAFFIC_DUP = P(
    "Reinforcement-Learning Traffic Light Controller",
    "Artificial Intelligence / ML", "Smart City",
    "Static signal timings create avoidable congestion at busy junctions.",
    "Adapt traffic light timing in real time with reinforcement learning over live traffic camera feeds.",
    "RL adaptive signal timing, live feed analysis, congestion minimization.",
    "Python, TensorFlow, computer vision, OpenCV",
    "Municipal traffic authorities, commuters",
)

# new "related" counterpart proposals (same domain, genuinely different problem)
RETAIL_INVENTORY = P(
    "Retail Demand Forecasting & Inventory Optimizer",
    "Data Science & Analytics", "Retail / E-commerce",
    "Retailers overstock slow items and run out of popular ones, hurting margins.",
    "Forecast product demand and recommend reorder quantities to balance stock levels.",
    "Time-series demand forecasting, automated reorder suggestions, stockout alerts.",
    "Python, Prophet, scikit-learn, FastAPI",
    "Store managers, supply-chain planners",
)
MOVIE_REC = P(
    "Movie Recommendation Streaming Platform",
    "Data Science & Analytics", "Entertainment / Media",
    "Viewers spend too long browsing and struggle to find films they will enjoy.",
    "Suggest movies from viewing history and ratings using collaborative and content-based filtering.",
    "Hybrid movie recommendations, watchlist personalization, trending discovery.",
    "Python, scikit-learn, FastAPI, React",
    "Streaming subscribers",
)
LOAN = P(
    "Loan Default Risk Prediction System",
    "Data Science & Analytics", "Finance / Banking",
    "Lenders approve loans with limited insight into an applicant's likelihood of default.",
    "Predict loan default probability from applicant and credit-history features to guide approval.",
    "Credit-risk scoring, explainable approval recommendations, applicant dashboard.",
    "Python, scikit-learn, XGBoost, FastAPI",
    "Loan officers, credit risk teams",
)
AIR_QUALITY = P(
    "Urban Air Quality Monitoring Network",
    "Internet of Things", "Smart City",
    "Cities lack fine-grained, real-time air pollution data across neighborhoods.",
    "Deploy IoT sensors to map air quality in real time and alert residents to pollution spikes.",
    "Distributed air-quality sensing, pollution heatmaps, health alerts.",
    "Arduino, IoT, Python, MQTT, React",
    "City residents, environmental agencies",
)
AUTO_GRADER = P(
    "Automated Short-Answer Essay Grading System",
    "Artificial Intelligence / ML", "Education",
    "Grading large volumes of short written answers is slow and inconsistent across markers.",
    "Automatically score short-answer responses against a rubric using NLP and give feedback.",
    "Rubric-based automatic scoring, feedback generation, marker-consistency checks.",
    "Python, transformers, FastAPI, React",
    "University instructors, teaching assistants",
)
YIELD = P(
    "Crop Yield Prediction from Weather & Soil Data",
    "Data Science & Analytics", "Agriculture",
    "Farmers cannot reliably estimate seasonal harvest, complicating planning and selling.",
    "Predict expected crop yield from weather, soil and historical data to support planning.",
    "Yield forecasting, scenario planning, seasonal advisory.",
    "Python, scikit-learn, pandas, FastAPI",
    "Farmers, agricultural cooperatives",
)


# ===========================================================================
# Labeled pairs:  (A, B, ground_truth, opus_prediction)
#
# - ground_truth: the hand-assigned label (the gold standard).
# - opus_prediction: an INDEPENDENT judgement made by the Opus LLM rater from
#   reading the two proposals only (blind to the engine's numeric score).
#
# Balance: 12 UNRELATED, 12 RELATED, 6 NEAR_DUPLICATE.
# ===========================================================================
PAIRS: list[tuple[dict, dict, str, str]] = [
    # ---- 6 NEAR-DUPLICATE (essentially the same project) ----
    (ER, ER_DUP, NEAR_DUP, NEAR_DUP),
    (CROP, CROP_DUP, NEAR_DUP, NEAR_DUP),
    (ECOM, ECOM_DUP, NEAR_DUP, NEAR_DUP),
    (PLAGIARISM, PLAGIARISM_DUP, NEAR_DUP, NEAR_DUP),
    (FRAUD, FRAUD_DUP, NEAR_DUP, NEAR_DUP),
    (TRAFFIC, TRAFFIC_DUP, NEAR_DUP, NEAR_DUP),

    # ---- 12 RELATED (same domain/theme, genuinely different problem) ----
    (ER, HOSP_CHAT, RELATED, RELATED),
    (DISASTER, DISASTER_COORD, RELATED, RELATED),
    (CROP, IRRIGATION, RELATED, RELATED),
    # Opus honestly disagrees here: a gamified language-learning app and an
    # embedding-based plagiarism checker share only the broad "education" tag
    # and almost no problem/solution overlap -> Opus reads it as UNRELATED.
    (LANG, PLAGIARISM, RELATED, UNRELATED),
    (FRAUD, STOCK, RELATED, RELATED),
    (PARKING, TRAFFIC, RELATED, RELATED),
    (ECOM, RETAIL_INVENTORY, RELATED, RELATED),
    (MUSIC, MOVIE_REC, RELATED, RELATED),
    (STOCK, LOAN, RELATED, RELATED),
    (TRAFFIC, AIR_QUALITY, RELATED, RELATED),
    (PLAGIARISM, AUTO_GRADER, RELATED, RELATED),
    (CROP, YIELD, RELATED, RELATED),

    # ---- 12 UNRELATED (different domain AND problem) ----
    (ER, MUSIC, UNRELATED, UNRELATED),
    (CROP, FRAUD, UNRELATED, UNRELATED),
    (LANG, PARKING, UNRELATED, UNRELATED),
    (DISASTER, ECOM, UNRELATED, UNRELATED),
    (PLAGIARISM, IRRIGATION, UNRELATED, UNRELATED),
    (TRAFFIC, STOCK, UNRELATED, UNRELATED),
    (HOSP_CHAT, RETAIL_INVENTORY, UNRELATED, UNRELATED),
    (MOVIE_REC, LOAN, UNRELATED, UNRELATED),
    (AIR_QUALITY, AUTO_GRADER, UNRELATED, UNRELATED),
    (YIELD, MUSIC, UNRELATED, UNRELATED),
    (DISASTER_COORD, STOCK, UNRELATED, UNRELATED),
    (CROP_DUP, PARKING, UNRELATED, UNRELATED),
]


def classify(sim: float) -> str:
    if sim >= HIGH_MIN:
        return NEAR_DUP
    if sim < LOW_MAX:
        return UNRELATED
    return RELATED


# ---------------------------------------------------------------------------
# Metric helpers (numpy-free, dependency-light)
# ---------------------------------------------------------------------------
def confusion_matrix(truth: list[str], pred: list[str]) -> list[list[int]]:
    idx = {c: i for i, c in enumerate(CLASSES)}
    m = [[0, 0, 0] for _ in CLASSES]
    for t, p in zip(truth, pred):
        m[idx[t]][idx[p]] += 1
    return m


def per_class_prf(matrix: list[list[int]]) -> dict[str, dict[str, float]]:
    """Precision/Recall/F1 per class from a confusion matrix (rows=truth)."""
    idx = {c: i for i, c in enumerate(CLASSES)}
    out: dict[str, dict[str, float]] = {}
    for c in CLASSES:
        i = idx[c]
        tp = matrix[i][i]
        fn = sum(matrix[i][j] for j in range(len(CLASSES))) - tp
        fp = sum(matrix[r][i] for r in range(len(CLASSES))) - tp
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
        out[c] = {"precision": precision, "recall": recall, "f1": f1, "support": tp + fn}
    return out


def cohens_kappa(a: list[str], b: list[str]) -> float:
    """Cohen's kappa between two raters over CLASSES."""
    n = len(a)
    if n == 0:
        return 0.0
    po = sum(1 for x, y in zip(a, b) if x == y) / n
    pe = 0.0
    for c in CLASSES:
        pa = sum(1 for x in a if x == c) / n
        pb = sum(1 for y in b if y == c) / n
        pe += pa * pb
    return (po - pe) / (1 - pe) if (1 - pe) else 1.0


# ---------------------------------------------------------------------------
# Figures
# ---------------------------------------------------------------------------
def make_figures(results: list[dict], engine_matrix: list[list[int]],
                 engine_prf: dict[str, dict[str, float]]) -> list[Path]:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np

    plt.rcParams.update({
        "figure.dpi": 170,
        "savefig.dpi": 170,
        "font.size": 11,
        "axes.titleweight": "bold",
        "axes.edgecolor": "#444444",
    })
    short = {UNRELATED: "Unrelated", RELATED: "Related", NEAR_DUP: "Near-dup"}
    labels = [short[c] for c in CLASSES]
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []

    # --- Figure 1: confusion matrix heatmap -------------------------------
    fig, ax = plt.subplots(figsize=(6.2, 5.2))
    mat = np.array(engine_matrix)
    im = ax.imshow(mat, cmap="Blues")
    ax.set_xticks(range(len(CLASSES)), labels)
    ax.set_yticks(range(len(CLASSES)), labels)
    ax.set_xlabel("Engine predicted class")
    ax.set_ylabel("Ground-truth class")
    ax.set_title("Engine Confusion Matrix\n(rows = truth, cols = prediction)")
    vmax = mat.max() if mat.max() else 1
    for i in range(len(CLASSES)):
        for j in range(len(CLASSES)):
            ax.text(j, i, str(mat[i, j]), ha="center", va="center",
                    fontsize=15, fontweight="bold",
                    color="white" if mat[i, j] > vmax * 0.55 else "#1a1a1a")
    cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.set_label("Pair count")
    fig.tight_layout()
    p1 = OUTPUT_DIR / "confusion_matrix.png"
    fig.savefig(p1)
    plt.close(fig)
    paths.append(p1)

    # --- Figure 2: grouped P/R/F1 bars ------------------------------------
    fig, ax = plt.subplots(figsize=(7.4, 4.8))
    metrics = ["precision", "recall", "f1"]
    metric_labels = ["Precision", "Recall", "F1"]
    # colorblind-friendly (Okabe-Ito)
    colors = ["#0072B2", "#E69F00", "#009E73"]
    x = np.arange(len(CLASSES))
    width = 0.26
    for k, (m, ml, col) in enumerate(zip(metrics, metric_labels, colors)):
        vals = [engine_prf[c][m] for c in CLASSES]
        bars = ax.bar(x + (k - 1) * width, vals, width, label=ml, color=col)
        for b, v in zip(bars, vals):
            ax.text(b.get_x() + b.get_width() / 2, v + 0.02, f"{v:.2f}",
                    ha="center", va="bottom", fontsize=8.5)
    ax.set_xticks(x, labels)
    ax.set_ylim(0, 1.15)
    ax.set_ylabel("Score")
    ax.set_title("Engine Precision / Recall / F1 per Class")
    ax.legend(loc="upper center", ncol=3, frameon=False)
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    p2 = OUTPUT_DIR / "precision_recall_f1.png"
    fig.savefig(p2)
    plt.close(fig)
    paths.append(p2)

    # --- Figure 3: similarity distribution per truth class (mean + range) -
    fig, ax = plt.subplots(figsize=(7.4, 4.8))
    class_colors = {UNRELATED: "#009E73", RELATED: "#E69F00", NEAR_DUP: "#D55E00"}
    means, mins, maxs = [], [], []
    for c in CLASSES:
        sims = [r["sim"] for r in results if r["truth"] == c]
        means.append(sum(sims) / len(sims))
        mins.append(min(sims))
        maxs.append(max(sims))
    means_a = np.array(means)
    lower = means_a - np.array(mins)
    upper = np.array(maxs) - means_a
    bars = ax.bar(labels, means_a, color=[class_colors[c] for c in CLASSES],
                  yerr=[lower, upper], capsize=8, alpha=0.9,
                  error_kw={"elinewidth": 1.6, "ecolor": "#333333"})
    # scatter the individual pair scores for transparency
    for i, c in enumerate(CLASSES):
        sims = [r["sim"] for r in results if r["truth"] == c]
        jitter = (np.random.RandomState(7 + i).rand(len(sims)) - 0.5) * 0.28
        ax.scatter(np.full(len(sims), i) + jitter, sims, color="#222222",
                   s=18, zorder=3, alpha=0.65)
    for b, m in zip(bars, means):
        ax.text(b.get_x() + b.get_width() / 2, m + 1.5, f"{m:.1f}",
                ha="center", va="bottom", fontsize=10, fontweight="bold")
    ax.axhline(LOW_MAX, ls="--", color="#888888", lw=1)
    ax.axhline(HIGH_MIN, ls="--", color="#888888", lw=1)
    ax.text(2.48, LOW_MAX + 0.5, f"Related ≥ {LOW_MAX:.0f}", fontsize=7.5,
            color="#666666", ha="right")
    ax.text(2.48, HIGH_MIN + 0.5, f"Near-dup ≥ {HIGH_MIN:.0f}", fontsize=7.5,
            color="#666666", ha="right")
    ax.set_ylim(0, 105)
    ax.set_ylabel("Engine similarity (%)")
    ax.set_title("Engine Similarity by Ground-Truth Class\n(bar = mean, whiskers = min/max, dots = pairs)")
    fig.tight_layout()
    p3 = OUTPUT_DIR / "similarity_distribution.png"
    fig.savefig(p3)
    plt.close(fig)
    paths.append(p3)

    return paths


# ---------------------------------------------------------------------------
def main() -> None:
    print("=" * 78)
    print("30-PAIR SIMILARITY ENGINE EVALUATION  +  INDEPENDENT OPUS RATER")
    print(f"Bands:  UNRELATED < {LOW_MAX}  |  RELATED {LOW_MAX}-{HIGH_MIN}  |  NEAR_DUPLICATE >= {HIGH_MIN}")
    print("=" * 78)

    results: list[dict] = []
    for i, (a, b, truth, opus) in enumerate(PAIRS, start=1):
        sim = similarity_between(build_semantic_text(a), build_semantic_text(b))
        results.append({
            "n": i,
            "a": a["title"],
            "b": b["title"],
            "truth": truth,
            "sim": sim,
            "engine": classify(sim),
            "opus": opus,
        })

    truth_list = [r["truth"] for r in results]
    engine_list = [r["engine"] for r in results]
    opus_list = [r["opus"] for r in results]
    total = len(results)

    # ---- per-pair table ----
    print(f"\n{'#':>2} {'TRUTH':<14}{'SIM%':>7}  {'ENGINE':<14}{'OPUS':<14}{'E?':<3}{'O?':<3} PAIR")
    print("-" * 78)
    for r in results:
        e_ok = "OK" if r["truth"] == r["engine"] else "XX"
        o_ok = "OK" if r["truth"] == r["opus"] else "XX"
        print(f"{r['n']:>2} {r['truth']:<14}{r['sim']:>7.2f}  {r['engine']:<14}"
              f"{r['opus']:<14}{e_ok:<3}{o_ok:<3}{r['a'][:20]} <> {r['b'][:20]}")

    # ---- per-class similarity stats ----
    print("\nPER-CLASS ENGINE SIMILARITY (sanity: NEAR_DUP > RELATED > UNRELATED)")
    print("-" * 78)
    class_stats = {}
    for c in CLASSES:
        sims = [r["sim"] for r in results if r["truth"] == c]
        class_stats[c] = {
            "n": len(sims),
            "mean": sum(sims) / len(sims),
            "min": min(sims),
            "max": max(sims),
        }
        s = class_stats[c]
        print(f"  {c:<15} n={s['n']:<3} mean={s['mean']:6.2f}  min={s['min']:6.2f}  max={s['max']:6.2f}")

    # ---- engine confusion matrix ----
    e_matrix = confusion_matrix(truth_list, engine_list)
    print("\nENGINE CONFUSION MATRIX (rows=truth, cols=predicted)")
    print("-" * 78)
    print("                 " + "".join(f"{c[:9]:>12}" for c in CLASSES))
    idx = {c: i for i, c in enumerate(CLASSES)}
    for c in CLASSES:
        print(f"  {c:<13}" + "".join(f"{v:>12}" for v in e_matrix[idx[c]]))

    # ---- engine P/R/F1 ----
    e_prf = per_class_prf(e_matrix)
    print("\nENGINE PER-CLASS PRECISION / RECALL / F1")
    print("-" * 78)
    print(f"  {'CLASS':<16}{'P':>8}{'R':>8}{'F1':>8}{'support':>10}")
    for c in CLASSES:
        m = e_prf[c]
        print(f"  {c:<16}{m['precision']:>8.2f}{m['recall']:>8.2f}{m['f1']:>8.2f}{int(m['support']):>10}")

    e_correct = sum(1 for r in results if r["truth"] == r["engine"])
    e_acc = e_correct / total
    macro_f1 = sum(e_prf[c]["f1"] for c in CLASSES) / len(CLASSES)
    print(f"\n  ENGINE 3-CLASS ACCURACY: {e_correct}/{total} = {100*e_acc:.1f}%")
    print(f"  ENGINE MACRO-F1: {macro_f1:.3f}")

    # ---- Opus vs ground truth ----
    o_matrix = confusion_matrix(truth_list, opus_list)
    o_prf = per_class_prf(o_matrix)
    o_correct = sum(1 for r in results if r["truth"] == r["opus"])
    o_acc = o_correct / total
    o_macro_f1 = sum(o_prf[c]["f1"] for c in CLASSES) / len(CLASSES)
    print("\nOPUS (INDEPENDENT RATER) vs GROUND TRUTH")
    print("-" * 78)
    print(f"  OPUS 3-CLASS ACCURACY: {o_correct}/{total} = {100*o_acc:.1f}%")
    print(f"  OPUS MACRO-F1: {o_macro_f1:.3f}")
    for c in CLASSES:
        sub = [r for r in results if r["truth"] == c]
        sub_ok = sum(1 for r in sub if r["opus"] == c)
        print(f"    {c:<15} {sub_ok}/{len(sub)} correct")

    # ---- engine vs Opus agreement ----
    agree = sum(1 for r in results if r["engine"] == r["opus"])
    kappa = cohens_kappa(engine_list, opus_list)
    print("\nENGINE vs OPUS AGREEMENT")
    print("-" * 78)
    print(f"  Agreement rate: {agree}/{total} = {100*agree/total:.1f}%")
    print(f"  Cohen's kappa : {kappa:.3f}")

    # ---- binary duplicate detection ----
    tp = sum(1 for r in results if r["truth"] == NEAR_DUP and r["sim"] >= DUPLICATE_MIN)
    fn = sum(1 for r in results if r["truth"] == NEAR_DUP and r["sim"] < DUPLICATE_MIN)
    fp = sum(1 for r in results if r["truth"] != NEAR_DUP and r["sim"] >= DUPLICATE_MIN)
    tn = sum(1 for r in results if r["truth"] != NEAR_DUP and r["sim"] < DUPLICATE_MIN)
    b_prec = tp / (tp + fp) if (tp + fp) else 0.0
    b_rec = tp / (tp + fn) if (tp + fn) else 0.0
    print(f"\nBINARY DUPLICATE DETECTION (positive = near-duplicate, threshold >= {DUPLICATE_MIN})")
    print("-" * 78)
    print(f"  TP={tp} FP={fp} TN={tn} FN={fn}")
    print(f"  precision={b_prec:.2f}  recall={b_rec:.2f}  accuracy={(tp+tn)/total:.2f}")

    # ---- figures ----
    print("\nGENERATING FIGURES ...")
    paths = make_figures(results, e_matrix, e_prf)
    for p in paths:
        print(f"  wrote {p}")

    # ---- machine-readable dump for the report ----
    summary = {
        "thresholds": {"low_max": LOW_MAX, "high_min": HIGH_MIN, "duplicate_min": DUPLICATE_MIN},
        "engine": {
            "accuracy": e_acc,
            "macro_f1": macro_f1,
            "confusion_matrix": e_matrix,
            "per_class": e_prf,
            "binary_duplicate": {"tp": tp, "fp": fp, "tn": tn, "fn": fn,
                                  "precision": b_prec, "recall": b_rec},
        },
        "opus": {"accuracy": o_acc, "macro_f1": o_macro_f1, "confusion_matrix": o_matrix},
        "engine_vs_opus": {"agreement": agree / total, "kappa": kappa},
        "class_stats": class_stats,
        "classes": list(CLASSES),
        "results": results,
    }
    dump = OUTPUT_DIR / "metrics_30.json"
    dump.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"  wrote {dump}")
    print("=" * 78)


if __name__ == "__main__":
    main()
