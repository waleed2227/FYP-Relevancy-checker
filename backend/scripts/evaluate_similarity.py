"""
Similarity engine evaluation harness.

Runs a small, hand-labeled set of project pairs through the REAL similarity pipeline
(build_semantic_text + embeddings.similarity_between) and reports:

  - per-pair scores
  - mean/min/max similarity per expected class
  - a 3-class confusion matrix (UNRELATED / RELATED / NEAR_DUPLICATE)
  - overall accuracy
  - binary duplicate-detection precision/recall (near-duplicate = positive)

Run from backend/:
  python -m scripts.evaluate_similarity
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
assert _spec is not None and _spec.loader is not None, "Could not load _bootstrap.py"
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from app.ai.embeddings import similarity_between
from app.ai.relevancy_engine import build_semantic_text

# Classification bands (similarity %). Chosen up-front (not fitted to results).
LOW_MAX = 50.0       # < 50           -> UNRELATED
HIGH_MIN = 68.0      # >= 68          -> NEAR_DUPLICATE
                     # 50..68         -> RELATED

# Binary duplicate detection threshold (matches app duplicate_similarity_threshold band).
DUPLICATE_MIN = 68.0

UNRELATED = "UNRELATED"
RELATED = "RELATED"
NEAR_DUP = "NEAR_DUPLICATE"
CLASSES = (UNRELATED, RELATED, NEAR_DUP)


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


# ---------------------------------------------------------------------------
# Proposal pool
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Labeled pairs:  (A, B, expected_class)
# ---------------------------------------------------------------------------
PAIRS: list[tuple[dict, dict, str]] = [
    # --- 3 near-duplicate pairs ---
    (ER, ER_DUP, NEAR_DUP),
    (CROP, CROP_DUP, NEAR_DUP),
    (ECOM, ECOM_DUP, NEAR_DUP),

    # --- 6 same-domain, different-problem pairs ---
    (ER, HOSP_CHAT, RELATED),
    (DISASTER, DISASTER_COORD, RELATED),
    (CROP, IRRIGATION, RELATED),
    (LANG, PLAGIARISM, RELATED),
    (FRAUD, STOCK, RELATED),
    (PARKING, TRAFFIC, RELATED),

    # --- 6 unrelated pairs (different domain AND problem) ---
    (ER, MUSIC, UNRELATED),
    (CROP, FRAUD, UNRELATED),
    (LANG, PARKING, UNRELATED),
    (DISASTER, ECOM, UNRELATED),
    (PLAGIARISM, IRRIGATION, UNRELATED),
    (TRAFFIC, STOCK, UNRELATED),
]


def classify(sim: float) -> str:
    if sim >= HIGH_MIN:
        return NEAR_DUP
    if sim < LOW_MAX:
        return UNRELATED
    return RELATED


def main() -> None:
    print("=" * 72)
    print("SIMILARITY ENGINE EVALUATION")
    print(f"Bands:  UNRELATED < {LOW_MAX}   |   RELATED {LOW_MAX}-{HIGH_MIN}   |   NEAR_DUPLICATE >= {HIGH_MIN}")
    print("=" * 72)

    results = []
    for a, b, expected in PAIRS:
        sim = similarity_between(build_semantic_text(a), build_semantic_text(b))
        predicted = classify(sim)
        results.append((a["title"], b["title"], expected, sim, predicted))

    # Per-pair table
    print(f"\n{'EXPECTED':<15}{'SIM%':>7}  {'PREDICTED':<15} {'OK':<3} PAIR")
    print("-" * 72)
    for ta, tb, exp, sim, pred in results:
        ok = "OK" if exp == pred else "XX"
        print(f"{exp:<15}{sim:>7.2f}  {pred:<15} {ok:<3} {ta[:22]} <> {tb[:22]}")

    # Per-class stats
    print("\nPER-CLASS SIMILARITY (sanity: NEAR_DUP > RELATED > UNRELATED)")
    print("-" * 72)
    for cls in CLASSES:
        sims = [r[3] for r in results if r[2] == cls]
        if sims:
            print(f"  {cls:<15} n={len(sims)}  mean={sum(sims)/len(sims):6.2f}  min={min(sims):6.2f}  max={max(sims):6.2f}")

    # 3-class confusion matrix
    print("\nCONFUSION MATRIX (rows=expected, cols=predicted)")
    print("-" * 72)
    idx = {c: i for i, c in enumerate(CLASSES)}
    matrix = [[0, 0, 0] for _ in CLASSES]
    for _, _, exp, _, pred in results:
        matrix[idx[exp]][idx[pred]] += 1
    header = "                 " + "".join(f"{c[:9]:>12}" for c in CLASSES)
    print(header)
    for c in CLASSES:
        row = matrix[idx[c]]
        print(f"  {c:<13}" + "".join(f"{v:>12}" for v in row))

    correct = sum(1 for _, _, exp, _, pred in results if exp == pred)
    total = len(results)
    print(f"\n3-CLASS ACCURACY: {correct}/{total} = {100*correct/total:.1f}%")

    # Binary duplicate detection (positive = NEAR_DUPLICATE)
    tp = sum(1 for _, _, exp, sim, _ in results if exp == NEAR_DUP and sim >= DUPLICATE_MIN)
    fn = sum(1 for _, _, exp, sim, _ in results if exp == NEAR_DUP and sim < DUPLICATE_MIN)
    fp = sum(1 for _, _, exp, sim, _ in results if exp != NEAR_DUP and sim >= DUPLICATE_MIN)
    tn = sum(1 for _, _, exp, sim, _ in results if exp != NEAR_DUP and sim < DUPLICATE_MIN)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    print("\nBINARY DUPLICATE DETECTION (positive = near-duplicate, threshold "
          f">= {DUPLICATE_MIN})")
    print(f"  TP={tp} FP={fp} TN={tn} FN={fn}")
    print(f"  precision={precision:.2f}  recall={recall:.2f}  accuracy={(tp+tn)/total:.2f}")
    print("=" * 72)


if __name__ == "__main__":
    main()
