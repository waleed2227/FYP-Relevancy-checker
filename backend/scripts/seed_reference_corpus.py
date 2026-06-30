"""
Seed 50 full-featured APPROVED projects as the relevancy reference corpus.

Every project is inserted with ALL proposal fields populated and status=APPROVED,
so it becomes part of the approved comparison pool. Relevancy analysis is then run
on each project using the existing pipeline (project_service.run_relevancy_analysis).

This does NOT change AI scoring, embeddings, or the database schema. It only inserts
data and runs the existing analysis.

Run from backend/:
  python -m scripts.seed_reference_corpus
  python -m scripts.seed_reference_corpus --force      # re-run relevancy if result exists
  python -m scripts.seed_reference_corpus --dry-run    # list what would be inserted
  python -m scripts.seed_reference_corpus --no-analyze # insert only, skip relevancy
"""

from __future__ import annotations

import argparse
import asyncio
import importlib.util
from datetime import date, timedelta
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_bootstrap)

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.auth.security import hash_password
from app.database import AsyncSessionLocal
from app.models.department import Department
from app.models.professor import Professor
from app.models.project import ProjectIdea, ProjectStatus
from app.models.relevancy import RelevancyResult
from app.models.student import Student
from app.models.user import User, UserRole
from app.services.project_service import run_relevancy_analysis

PROFESSOR_EMAIL = "professor@uol.edu.pk"

# Corpus author students created on demand so matched-project authors look realistic.
CORPUS_AUTHORS = [
    ("Ayesha Khan", "ayesha.khan", "C00001"),
    ("Bilal Ahmed", "bilal.ahmed", "C00002"),
    ("Sana Malik", "sana.malik", "C00003"),
    ("Hamza Raza", "hamza.raza", "C00004"),
    ("Maryam Tariq", "maryam.tariq", "C00005"),
    ("Usman Javed", "usman.javed", "C00006"),
    ("Fatima Noor", "fatima.noor", "C00007"),
    ("Zain Abbas", "zain.abbas", "C00008"),
]


def _idea(
    title: str,
    category: str,
    industry: str,
    tech: str,
    desc: str,
    problem: str,
    solution: str,
    unique: str,
    innovation: str,
    users: str,
    impact: str,
) -> dict:
    return {
        "title": title,
        "category": category,
        "target_industry": industry,
        "technologies": tech,
        "description": desc,
        "problem_statement": problem,
        "proposed_solution": solution,
        "unique_features": unique,
        "innovation_aspect": innovation,
        "target_users": users,
        "expected_impact": impact,
    }


# 50 distinct project ideas. A few are intentional near-duplicates (clusters) so the
# relevancy engine produces meaningful matched_projects and similarity scores.
IDEAS: list[dict] = [
    _idea(
        "AI-Powered Crop Disease Detection for Smallholder Farms",
        "Artificial Intelligence / ML", "Agriculture",
        "Python, TensorFlow, OpenCV, Flask, React",
        "A computer-vision platform that detects early crop disease from leaf images so farmers can act before yield loss spreads across their fields.",
        "Smallholder farmers identify crop disease too late because manual field inspection is slow, inconsistent, and cannot cover large areas reliably, leading to avoidable yield loss.",
        "Farmers photograph affected leaves, a trained CNN classifies the disease, and the app returns treatment guidance with severity mapping and SMS alerts to extension officers.",
        "Offline edge inference for low-connectivity villages and Urdu voice guidance for low-literacy users.",
        "Disease model fine-tuned on South Asian crop varieties rather than generic datasets, improving local accuracy.",
        "Smallholder farmers, agricultural extension workers, and rural cooperatives across Punjab and Sindh.",
        "Reduces crop loss through early detection, lowers pesticide overuse, and improves rural food security.",
    ),
    _idea(
        "Drone Imagery Plant Disease Monitoring System",
        "Artificial Intelligence / ML", "Agriculture",
        "Python, PyTorch, DJI SDK, OpenCV, FastAPI",
        "An aerial monitoring system using drone multispectral imagery to flag diseased crop patches across large farms on an interactive field map.",
        "Large farms cannot inspect every acre manually, so disease outbreaks spread undetected and cause significant yield and revenue loss before any intervention happens.",
        "Drones capture field imagery on schedule, a segmentation model highlights diseased zones, and agronomists receive prioritized treatment routes through a dashboard.",
        "Automated flight scheduling and treatment routing integrated with local pesticide suppliers.",
        "Combines affordable drone hardware with crop-specific segmentation tuned for regional conditions.",
        "Commercial farm operators, agronomists, and agricultural cooperatives managing large fields.",
        "Cuts large-scale crop loss and input cost through timely, map-based disease intervention.",
    ),
    _idea(
        "CareerCraft AI — Interview and Resume Mastery Platform",
        "Education", "Career & EdTech",
        "Python, FastAPI, React, OpenAI API, PostgreSQL",
        "An AI career coach that reviews resumes, runs mock interviews, and gives tailored feedback so students can prepare confidently for the job market.",
        "Graduating students lack affordable, personalized interview and resume coaching, so they enter the job market underprepared and struggle to convert applications into offers.",
        "Students upload a resume and target role; the system scores it, suggests rewrites, runs adaptive mock interviews, and tracks improvement across practice sessions.",
        "Role-specific question banks and quantified readiness scoring with progress tracking over time.",
        "Adaptive interview difficulty driven by a candidate model that personalizes practice to weak areas.",
        "University students, fresh graduates, and career-services offices at higher-education institutions.",
        "Improves graduate employability and interview success through accessible personalized coaching.",
    ),
    _idea(
        "SmartHire — AI Resume Screening and Interview Prep Assistant",
        "Education", "Career & EdTech",
        "Node.js, Express, React, OpenAI API, MongoDB",
        "A platform that helps job seekers polish resumes and rehearse interviews with AI-generated feedback aligned to specific job descriptions.",
        "Job seekers cannot easily tell whether their resume matches a role or how to answer likely interview questions, leaving them underprepared for competitive hiring rounds.",
        "Users paste a job description and resume; the assistant highlights gaps, rewrites bullet points, and conducts targeted mock interviews with scored feedback.",
        "Job-description matching with keyword gap analysis and rewrite suggestions.",
        "Feedback grounded in the specific posting rather than generic interview tips.",
        "Final-year students, early-career professionals, and university placement cells.",
        "Raises interview conversion rates by aligning candidate preparation with real job requirements.",
    ),
    _idea(
        "MediTrack — AI Symptom Triage and Appointment Assistant",
        "Healthcare", "Healthcare",
        "Python, FastAPI, React Native, scikit-learn, PostgreSQL",
        "A mobile health assistant that triages patient symptoms, suggests urgency levels, and books the right clinic appointment to reduce unnecessary ER visits.",
        "Patients struggle to judge whether symptoms need urgent care, so emergency rooms get overcrowded with non-urgent cases while serious cases face dangerous delays.",
        "Patients describe symptoms in a guided flow; a triage model estimates urgency and routes them to self-care, a clinic appointment, or emergency services with clear reasoning.",
        "Explainable urgency scoring and direct integration with clinic appointment slots.",
        "Triage logic validated against clinical guidelines with transparent reason codes for each recommendation.",
        "Patients, primary-care clinics, and hospital outpatient departments.",
        "Reduces ER overcrowding and improves timely access to appropriate levels of care.",
    ),
    _idea(
        "Emergency Room Patient Flow Optimization System",
        "Healthcare", "Healthcare",
        "Python, Django, React, pandas, PostgreSQL",
        "A hospital dashboard that predicts emergency department congestion and recommends staff and bed allocation to keep wait times manageable.",
        "Emergency departments cannot anticipate surges, so patients face long waits and staff are allocated reactively, harming care quality and patient outcomes.",
        "The system ingests live admission data, forecasts congestion, and recommends staffing and bed reallocation with alerts when thresholds are about to be breached.",
        "Surge forecasting with actionable staffing recommendations rather than passive monitoring.",
        "Combines queueing analysis with historical admission patterns for proactive resource planning.",
        "Hospital administrators, emergency department managers, and nursing supervisors.",
        "Shortens emergency wait times and improves patient outcomes through proactive resource planning.",
    ),
    _idea(
        "EcoRoute — Carbon-Aware Delivery Route Planner",
        "Smart Cities & Environment", "Logistics",
        "Python, FastAPI, React, OR-Tools, Mapbox",
        "A logistics tool that plans delivery routes optimizing for both time and carbon emissions, helping fleets cut fuel use and meet sustainability targets.",
        "Delivery fleets optimize only for distance or time, ignoring emissions, so companies miss sustainability targets and incur higher fuel costs than necessary.",
        "The planner ingests orders and vehicle data, computes routes that balance time and CO2 using constraint optimization, and reports emissions saved per route.",
        "Dual time-and-carbon optimization with per-route emissions reporting.",
        "Applies vehicle-specific emission models inside the routing optimizer rather than as an afterthought.",
        "Logistics companies, last-mile delivery operators, and sustainability managers.",
        "Lowers fleet fuel costs and carbon footprint while maintaining delivery service levels.",
    ),
    _idea(
        "Smart Waste Collection Routing for Municipalities",
        "Smart Cities & Environment", "Smart Cities",
        "Python, Flask, React, IoT sensors, OR-Tools",
        "An IoT-driven system that routes garbage trucks based on real-time bin fill levels to cut fuel use and avoid overflowing bins in cities.",
        "Municipal waste trucks follow fixed routes regardless of how full bins are, wasting fuel on empty bins while full bins overflow and create public-health issues.",
        "Smart bin sensors report fill levels, the system computes dynamic collection routes, and crews receive optimized daily schedules through a mobile app.",
        "Sensor-driven dynamic routing that adapts daily to actual bin demand.",
        "Closes the loop between low-cost fill sensors and route optimization for measurable fuel savings.",
        "City sanitation departments, municipal planners, and waste-collection contractors.",
        "Reduces collection fuel costs and prevents bin overflow, improving urban cleanliness.",
    ),
    _idea(
        "FinGuard — AI Fraud Detection for Mobile Wallets",
        "Artificial Intelligence / ML", "FinTech",
        "Python, FastAPI, React, XGBoost, Kafka, PostgreSQL",
        "A real-time fraud detection engine for mobile wallets that flags suspicious transactions before they complete, protecting users from financial loss.",
        "Mobile wallet fraud grows faster than manual review can handle, so users lose money to fraudulent transactions that slip through static rule-based filters.",
        "Each transaction is scored in real time by a model combining behavioral and device signals; high-risk transactions trigger step-up verification before completion.",
        "Real-time behavioral scoring with adaptive step-up authentication.",
        "Online learning that adapts to new fraud patterns instead of relying on fixed rules.",
        "Mobile wallet providers, digital banks, and payment processors.",
        "Reduces financial fraud losses and increases user trust in digital payments.",
    ),
    _idea(
        "Personal Finance Coach with Spending Insights",
        "Artificial Intelligence / ML", "FinTech",
        "Flutter, Firebase, Python, scikit-learn",
        "A budgeting app that categorizes spending, forecasts cash flow, and nudges users toward savings goals using personalized insights.",
        "People lose track of where their money goes and fail to save consistently because manual budgeting is tedious and generic advice does not fit their habits.",
        "The app auto-categorizes transactions, forecasts month-end balances, and sends personalized nudges and savings challenges based on individual spending patterns.",
        "Cash-flow forecasting paired with behavioral savings nudges.",
        "Personalization driven by each user's transaction history rather than fixed budgeting rules.",
        "Young professionals, students, and households managing monthly budgets.",
        "Improves personal savings rates and financial awareness through tailored guidance.",
    ),
    _idea(
        "Real-Time Sign Language Interpreter for Online Classes",
        "Accessibility & EdTech", "Accessibility",
        "Python, MediaPipe, TensorFlow, WebRTC, React",
        "A video-call plugin that recognizes sign-language gestures in real time and shows live captions, making online lectures accessible to deaf students.",
        "Deaf and hard-of-hearing students are excluded from online classes because video platforms lack accurate, low-latency sign interpretation for regional sign vocabularies.",
        "The plugin captures webcam video, detects hand and body landmarks, classifies sign sequences with a temporal model, and overlays live captions for all participants.",
        "Support for regional sign variants and lecture recordings with searchable sign transcripts.",
        "Targets classroom latency and regional vocabularies rather than generic gesture demos.",
        "Deaf and hard-of-hearing students, accessibility offices, and online educators.",
        "Improves inclusive participation in online and hybrid education for deaf learners.",
    ),
    _idea(
        "Voice-Controlled Smart Home Hub for the Elderly",
        "Internet of Things", "Assistive Technology",
        "Python, Raspberry Pi, MQTT, React, TensorFlow Lite",
        "An accessible smart-home hub that lets elderly users control appliances, lighting, and emergency alerts entirely by voice in their local language.",
        "Elderly people living alone struggle with complex app-based smart-home controls and cannot quickly call for help during falls or medical emergencies.",
        "A local voice assistant controls home devices, detects distress phrases, and triggers caregiver alerts with location and context during emergencies.",
        "Local-language voice control with built-in emergency distress detection.",
        "On-device wake-word and distress detection that protects privacy without cloud dependence.",
        "Elderly residents living independently, their families, and assisted-living facilities.",
        "Increases independence and safety for elderly users through accessible voice control.",
    ),
    _idea(
        "Blockchain Academic Credential Verification",
        "Blockchain", "Education",
        "Solidity, Ethereum, React, Node.js, IPFS",
        "A tamper-proof platform where universities issue digital diplomas on blockchain and employers verify credentials instantly without contacting the institution.",
        "Employers cannot quickly verify academic credentials and fake degrees circulate widely, so hiring is slowed by manual verification and fraud risk.",
        "Universities issue signed credentials anchored on-chain; graduates share a verifiable link, and employers confirm authenticity instantly through a public verifier.",
        "Instant public verification with revocable, university-signed credentials.",
        "Selective-disclosure credentials that prove authenticity without exposing full records.",
        "Universities, employers, and graduates entering the job market.",
        "Eliminates credential fraud and speeds up hiring verification for institutions.",
    ),
    _idea(
        "Peer-to-Peer Renewable Energy Trading Platform",
        "Blockchain", "Energy & Utilities",
        "Solidity, Ethereum, React, Node.js, Web3.js",
        "A decentralized marketplace where households with solar panels sell surplus electricity directly to neighbors through transparent smart contracts.",
        "Homeowners with rooftop solar cannot easily sell surplus energy to neighbors because utility billing is centralized, opaque, and lacks peer settlement mechanisms.",
        "Smart meters report generation and consumption, smart contracts settle micro-payments automatically, and participants track tamper-proof trades on a dashboard.",
        "Local-token micro-payment settlement with carbon-credit tracking for traded units.",
        "Brings blockchain transparency to household-scale energy markets rather than industrial grids.",
        "Residential solar owners, apartment communities, and municipal energy cooperatives.",
        "Increases renewable energy use and reduces grid dependency via trusted neighbor trading.",
    ),
    _idea(
        "AI Mental Health Companion Chatbot",
        "Artificial Intelligence / ML", "Healthcare",
        "Python, FastAPI, React Native, Transformers, PostgreSQL",
        "A supportive chatbot that offers guided coping exercises, mood tracking, and escalation to professionals when it detects signs of crisis.",
        "Students face rising stress and anxiety but cannot always access counselors, so early distress goes unaddressed until it becomes a serious mental-health crisis.",
        "The companion runs evidence-based coping conversations, tracks mood trends, and escalates to human counselors with consent when crisis indicators appear.",
        "Mood-trend tracking with safe crisis escalation pathways.",
        "Crisis detection grounded in validated screening cues with mandatory human handoff.",
        "University students, campus counseling centers, and student wellbeing offices.",
        "Expands early mental-health support access and routes at-risk students to help sooner.",
    ),
    _idea(
        "Smart Attendance System Using Face Recognition",
        "Computer Vision", "Education",
        "Python, OpenCV, dlib, Flask, PostgreSQL",
        "A classroom attendance system that marks students present automatically from a single camera frame, removing manual roll-call and proxy attendance.",
        "Manual attendance wastes class time and is easily faked through proxies, so attendance records are unreliable and administratively costly to maintain.",
        "A camera captures the class, a face-recognition model matches enrolled students, and attendance is recorded automatically with anti-spoofing checks.",
        "Single-frame group recognition with liveness anti-spoofing.",
        "Combines group face detection with liveness checks to prevent photo-based proxies.",
        "University instructors, department administrators, and examination cells.",
        "Saves class time and produces reliable, tamper-resistant attendance records.",
    ),
    _idea(
        "AI-Based Plagiarism and AI-Content Detector for Assignments",
        "Natural Language Processing", "Education",
        "Python, FastAPI, Transformers, React, PostgreSQL",
        "A submission-checking tool that detects both copied text and AI-generated content in student assignments with explainable highlights.",
        "Instructors cannot reliably tell whether assignments are plagiarized or AI-generated, undermining academic integrity and fair assessment.",
        "Submissions are compared against sources and scored for AI-generation likelihood, with passage-level highlights and similarity reports for instructors.",
        "Combined plagiarism and AI-content detection with passage-level explanations.",
        "Stylometric signals fused with similarity matching for transparent integrity scoring.",
        "University instructors, teaching assistants, and academic integrity committees.",
        "Strengthens academic integrity with explainable, instructor-friendly reports.",
    ),
    _idea(
        "Intelligent Tutoring System for Programming",
        "Education", "EdTech",
        "Python, FastAPI, React, CodeMirror, PostgreSQL",
        "An adaptive tutor that gives students personalized programming exercises and hints based on the specific mistakes they make while coding.",
        "Beginner programmers get stuck without immediate guidance, and large classes make individual help impossible, so students disengage and fall behind.",
        "The tutor analyzes a student's code submissions, identifies misconception patterns, and serves targeted exercises and progressive hints to close skill gaps.",
        "Misconception-aware hinting tied to each student's error history.",
        "Skill modeling that adapts exercise difficulty to individual learning curves.",
        "Programming students, coding bootcamps, and computer-science departments.",
        "Improves learning outcomes and retention in large programming courses.",
    ),
    _idea(
        "AR Indoor Navigation for Large Campuses",
        "Augmented Reality", "Smart Campus",
        "Unity, ARCore, C#, Firebase, Mapbox",
        "An augmented-reality app that guides visitors through complex university buildings with on-screen arrows overlaid on the live camera view.",
        "Visitors and new students get lost in large multi-building campuses because static maps and signage fail to give clear turn-by-turn indoor guidance.",
        "Users select a destination and follow AR arrows overlaid on the camera feed, with indoor positioning using visual markers and Wi-Fi signals.",
        "Marker-assisted indoor positioning with live AR wayfinding.",
        "Fuses visual markers and Wi-Fi fingerprints for reliable indoor localization without GPS.",
        "New students, campus visitors, and event attendees navigating large facilities.",
        "Reduces confusion and saves time for visitors navigating complex campuses.",
    ),
    _idea(
        "Smart Parking Availability and Reservation System",
        "Internet of Things", "Smart Cities",
        "Python, Flask, React, IoT sensors, PostgreSQL",
        "A city parking app showing real-time available spots and letting drivers reserve a space in advance to cut congestion from circling cars.",
        "Drivers waste fuel and time circling for parking in busy areas, adding to congestion and pollution while available spots go unfilled.",
        "Sensors detect spot occupancy, the app shows live availability on a map, and drivers reserve and pay for spaces before arriving.",
        "Live availability map with advance reservation and payment.",
        "Combines occupancy sensing with demand-based reservation to reduce search traffic.",
        "City drivers, parking operators, and municipal transport authorities.",
        "Cuts traffic congestion and emissions caused by drivers searching for parking.",
    ),
    _idea(
        "AI Legal Document Summarizer and Q&A",
        "Natural Language Processing", "LegalTech",
        "Python, FastAPI, Transformers, React, PostgreSQL",
        "A tool that summarizes long legal documents and answers plain-language questions about clauses, helping non-lawyers understand contracts.",
        "Ordinary people sign contracts they do not understand because legal language is dense and professional review is expensive and slow.",
        "Users upload a contract; the system produces a plain-language summary, flags risky clauses, and answers questions grounded in the document text.",
        "Clause risk flagging with grounded document question answering.",
        "Retrieval-grounded answers that cite the exact clause to avoid hallucination.",
        "Small businesses, freelancers, and individuals reviewing contracts.",
        "Makes legal documents understandable and reduces risk from unread clauses.",
    ),
    _idea(
        "Crowdsourced Real-Time Road Hazard Reporting",
        "Mobile Application", "Smart Cities",
        "Flutter, Firebase, Google Maps API, Python",
        "A driver app where users report potholes, accidents, and hazards in real time, warning others nearby and informing city maintenance teams.",
        "Drivers hit unexpected road hazards because there is no real-time shared warning system, and cities learn about damage slowly through manual complaints.",
        "Drivers report hazards with one tap, nearby users get proximity warnings, and a city dashboard aggregates reports for maintenance prioritization.",
        "Proximity hazard alerts with a city maintenance prioritization dashboard.",
        "Crowdsourced verification that ranks hazards by report density and severity.",
        "Daily commuters, ride-hailing drivers, and municipal road-maintenance teams.",
        "Improves road safety and speeds municipal repair through real-time reports.",
    ),
    _idea(
        "AI Recruitment Bias Auditing Tool",
        "Artificial Intelligence / ML", "HR Tech",
        "Python, FastAPI, scikit-learn, React, PostgreSQL",
        "A tool that audits hiring pipelines for bias across gender and background, giving HR teams measurable fairness reports and mitigation suggestions.",
        "Hiring processes can unintentionally discriminate, but companies lack tools to measure bias, exposing them to unfair outcomes and legal risk.",
        "The tool analyzes anonymized hiring data, computes fairness metrics across groups, and recommends concrete process changes to reduce measured disparities.",
        "Quantified fairness metrics with actionable mitigation recommendations.",
        "Applies established fairness criteria to real pipeline data rather than abstract audits.",
        "HR departments, recruitment agencies, and diversity-and-inclusion officers.",
        "Promotes fairer hiring and reduces legal exposure through measurable bias audits.",
    ),
    _idea(
        "Smart Greenhouse Climate Control System",
        "Internet of Things", "Agriculture",
        "Python, Raspberry Pi, MQTT, React, InfluxDB",
        "An automated greenhouse controller that optimizes temperature, humidity, and irrigation to maximize crop yield while conserving water and energy.",
        "Greenhouse growers manually adjust climate controls, leading to inconsistent conditions, wasted water and energy, and suboptimal crop yields.",
        "Sensors monitor conditions, a controller automatically adjusts ventilation, heating, and irrigation, and growers tune targets through a dashboard.",
        "Closed-loop climate control with water and energy conservation logic.",
        "Crop-stage-aware control profiles that adapt setpoints as plants grow.",
        "Commercial greenhouse operators, agritech startups, and research farms.",
        "Increases yield and reduces resource waste through automated climate control.",
    ),
    _idea(
        "Personalized E-Learning Recommendation Engine",
        "Artificial Intelligence / ML", "EdTech",
        "Python, FastAPI, React, scikit-learn, PostgreSQL",
        "A learning platform that recommends the next best lesson for each student based on their progress, performance, and learning goals.",
        "Learners on open courses face overwhelming content with no guidance on what to study next, leading to drop-off and incomplete learning paths.",
        "The engine models each learner's mastery and goals, then sequences recommended lessons and quizzes to keep difficulty in the optimal learning zone.",
        "Goal-aware lesson sequencing with mastery-based pacing.",
        "Knowledge-tracing model that adapts recommendations to evolving learner mastery.",
        "Online learners, MOOC platforms, and corporate training teams.",
        "Improves course completion and learning efficiency through personalized paths.",
    ),
    _idea(
        "Real-Time Air Quality Monitoring Network",
        "Internet of Things", "Environment",
        "Python, ESP32, MQTT, React, TimescaleDB",
        "A low-cost sensor network that maps city air quality in real time and alerts residents about pollution hotspots and health risks.",
        "Cities have sparse air-quality data, so residents cannot avoid pollution hotspots and authorities lack the granular information needed to act.",
        "Distributed low-cost sensors stream readings to a platform that maps pollution, detects hotspots, and pushes health alerts to nearby residents.",
        "Dense low-cost sensing with hotspot detection and resident alerts.",
        "Calibration models that make low-cost sensors reliable enough for actionable mapping.",
        "City residents, environmental agencies, and public-health departments.",
        "Empowers residents and authorities to reduce pollution exposure with live data.",
    ),
    _idea(
        "AI-Powered Inventory Demand Forecasting for Retail",
        "Artificial Intelligence / ML", "Retail",
        "Python, FastAPI, Prophet, React, PostgreSQL",
        "A forecasting tool that predicts product demand for small retailers so they stock the right items and avoid both shortages and overstock.",
        "Small retailers over- or under-stock because they rely on intuition, tying up cash in unsold goods or losing sales to stockouts.",
        "The tool learns from sales history and seasonality to forecast demand per product and recommends reorder quantities and timing.",
        "Per-product reorder recommendations with seasonality awareness.",
        "Lightweight forecasting tuned for sparse small-retailer sales data.",
        "Small and medium retailers, shop owners, and supply managers.",
        "Reduces stockouts and overstock, improving retailer cash flow and sales.",
    ),
    _idea(
        "Telemedicine Platform with Remote Vitals Monitoring",
        "Healthcare", "Healthcare",
        "React, Node.js, WebRTC, Python, PostgreSQL",
        "A telehealth platform connecting patients and doctors over video while streaming vitals from home devices for remote monitoring.",
        "Rural patients struggle to reach specialists and chronic patients lack continuous monitoring, leading to late interventions and worse outcomes.",
        "Patients consult doctors via secure video while wearable and home devices stream vitals, with alerts when readings cross clinical thresholds.",
        "Integrated vitals streaming with threshold-based clinician alerts.",
        "Device-agnostic vitals pipeline with clinically defined alerting rules.",
        "Rural patients, chronic-disease patients, and remote healthcare providers.",
        "Expands specialist access and enables continuous remote chronic-care monitoring.",
    ),
    _idea(
        "Smart Energy Consumption Dashboard for Homes",
        "Internet of Things", "Energy & Utilities",
        "Python, ESP32, MQTT, React, InfluxDB",
        "A home energy dashboard that breaks down appliance-level electricity use and suggests changes to cut bills and waste.",
        "Households see only a single monthly electricity bill, so they cannot identify which appliances drive cost and waste energy.",
        "Smart plugs and a main-line sensor disaggregate usage by appliance, and the dashboard recommends behavior changes with projected savings.",
        "Appliance-level disaggregation with projected savings recommendations.",
        "Non-intrusive load monitoring that infers appliance usage from aggregate signals.",
        "Homeowners, tenants, and utility energy-efficiency programs.",
        "Lowers household electricity bills and energy waste through actionable insights.",
    ),
    _idea(
        "AI Customer Support Ticket Router and Assistant",
        "Natural Language Processing", "SaaS",
        "Python, FastAPI, Transformers, React, PostgreSQL",
        "A support tool that classifies incoming tickets, routes them to the right team, and drafts suggested replies for agents to speed resolution.",
        "Support teams manually triage every ticket, causing delays and inconsistent routing that frustrate customers and overload agents.",
        "Incoming tickets are auto-classified by intent and urgency, routed to the correct queue, and agents receive draft replies grounded in the knowledge base.",
        "Intent-based routing with knowledge-grounded reply drafting.",
        "Reply drafts grounded in company documentation to reduce agent edits.",
        "SaaS support teams, help-desk managers, and customer-success agents.",
        "Speeds ticket resolution and improves consistency in customer support.",
    ),
    _idea(
        "Wearable Fall Detection and Alert System",
        "Internet of Things", "Assistive Technology",
        "Python, Arduino, BLE, React Native, TensorFlow Lite",
        "A wearable device that detects falls using motion sensors and instantly alerts caregivers with the user's location.",
        "Elderly people who fall while alone may lie unattended for hours, turning recoverable incidents into serious medical emergencies.",
        "An accelerometer-and-gyroscope wearable runs an on-device fall classifier and triggers caregiver alerts with location when a fall is detected.",
        "On-device fall classification with instant located caregiver alerts.",
        "Edge model tuned to minimize false alarms while catching real falls.",
        "Elderly individuals, caregivers, and assisted-living facilities.",
        "Reduces harm from unattended falls through fast, automatic alerts.",
    ),
    _idea(
        "AI-Based News Credibility and Bias Analyzer",
        "Natural Language Processing", "Media",
        "Python, FastAPI, Transformers, React, PostgreSQL",
        "A browser tool that scores news articles for credibility and political bias, helping readers evaluate sources critically.",
        "Readers struggle to judge whether online news is credible or biased, making them vulnerable to misinformation and one-sided narratives.",
        "The tool analyzes article text and source reputation to produce credibility and bias indicators with explanations and links to corroborating coverage.",
        "Combined credibility and bias scoring with corroboration links.",
        "Source-reputation signals fused with linguistic bias cues for transparent scoring.",
        "General news readers, students, and media-literacy educators.",
        "Improves media literacy and reduces misinformation spread among readers.",
    ),
    _idea(
        "Smart Irrigation Scheduling Using Weather Data",
        "Internet of Things", "Agriculture",
        "Python, Raspberry Pi, MQTT, React, OpenWeather API",
        "An irrigation controller that schedules watering using soil moisture and weather forecasts to save water without stressing crops.",
        "Farmers over-irrigate on fixed schedules, wasting scarce water and increasing costs while sometimes still stressing crops during heat spikes.",
        "Soil sensors and weather forecasts feed a controller that schedules irrigation only when needed and skips watering before forecast rain.",
        "Forecast-aware scheduling that skips watering before rain.",
        "Combines soil moisture with weather prediction to optimize water use per field.",
        "Farmers, agricultural cooperatives, and water-management authorities.",
        "Conserves water and reduces irrigation cost while protecting crop health.",
    ),
    _idea(
        "Gamified Fitness App with AI Form Correction",
        "Computer Vision", "Health & Fitness",
        "Python, MediaPipe, Flutter, TensorFlow, Firebase",
        "A fitness app that uses the phone camera to check exercise form in real time and gamifies workouts to keep users motivated.",
        "Home exercisers perform movements with poor form and lose motivation quickly, risking injury and abandoning fitness goals.",
        "The app tracks body pose during exercises, gives real-time form corrections, and awards streaks and challenges to sustain motivation.",
        "Real-time form correction combined with motivational gamification.",
        "On-device pose analysis that gives immediate, private form feedback.",
        "Home fitness enthusiasts, beginners, and remote personal trainers.",
        "Reduces workout injury risk and improves adherence to fitness routines.",
    ),
    _idea(
        "Blockchain-Based Supply Chain Traceability",
        "Blockchain", "Supply Chain",
        "Solidity, Hyperledger, React, Node.js, PostgreSQL",
        "A traceability platform that records every step of a product's journey on blockchain so buyers can verify origin and authenticity.",
        "Consumers and businesses cannot verify product origin or detect counterfeits because supply-chain records are fragmented and easily falsified.",
        "Each supply-chain event is recorded immutably, and buyers scan a code to view a product's verified journey from source to shelf.",
        "End-to-end provenance with consumer-facing verification scanning.",
        "Immutable event logging that links physical goods to verifiable digital records.",
        "Manufacturers, retailers, and quality-conscious consumers.",
        "Reduces counterfeiting and builds trust through verifiable product provenance.",
    ),
    _idea(
        "AI Resume-to-Job Matching Portal",
        "Artificial Intelligence / ML", "Career & EdTech",
        "Python, FastAPI, React, Sentence Transformers, PostgreSQL",
        "A job portal that semantically matches candidate resumes to relevant openings and explains why each match was suggested.",
        "Keyword-based job boards miss good matches and bury candidates in irrelevant listings, wasting time for both seekers and employers.",
        "The portal embeds resumes and job posts, ranks matches by semantic fit, and shows the skills driving each recommendation for transparency.",
        "Semantic matching with explainable skill-level match reasoning.",
        "Embedding-based matching that captures meaning beyond exact keyword overlap.",
        "Job seekers, employers, and university placement offices.",
        "Improves job-match quality and reduces search effort for seekers and recruiters.",
    ),
    _idea(
        "Disaster Response Coordination Platform",
        "Mobile Application", "Public Safety",
        "Flutter, Firebase, Node.js, Google Maps API",
        "A platform that coordinates volunteers, resources, and needs during disasters so help reaches affected people faster.",
        "During disasters, relief efforts are chaotic and uncoordinated, so resources are duplicated in some areas while other affected people are missed entirely.",
        "Affected people post needs, volunteers and NGOs see a live map of requests and resources, and the system matches help to needs by location and urgency.",
        "Live need-and-resource matching with location-based prioritization.",
        "Crowdsourced situational map that coordinates dispersed responders in real time.",
        "Disaster-affected communities, volunteers, and relief organizations.",
        "Speeds and balances disaster relief by coordinating resources with real needs.",
    ),
    _idea(
        "AI-Powered Code Review Assistant",
        "Artificial Intelligence / ML", "Developer Tools",
        "Python, FastAPI, Transformers, React, GitHub API",
        "A tool that reviews pull requests for bugs, style issues, and security risks, leaving inline comments to speed up code review.",
        "Manual code review is slow and inconsistent, so bugs and security issues slip through while reviewers spend time on repetitive checks.",
        "On each pull request, the assistant analyzes the diff, flags likely bugs and vulnerabilities, and posts inline suggestions for the author and reviewers.",
        "Inline pull-request feedback covering bugs, style, and security.",
        "Diff-aware analysis that prioritizes high-risk changes for human reviewers.",
        "Software development teams, open-source maintainers, and engineering leads.",
        "Speeds code review and catches defects earlier in the development cycle.",
    ),
    _idea(
        "Smart Traffic Signal Optimization System",
        "Artificial Intelligence / ML", "Smart Cities",
        "Python, FastAPI, OpenCV, React, PostgreSQL",
        "An adaptive traffic-signal controller that adjusts light timing based on real-time vehicle flow to reduce congestion at intersections.",
        "Fixed-timing traffic signals cause needless waiting and congestion because they ignore real-time traffic, increasing travel time and emissions.",
        "Cameras estimate vehicle queues per direction, and an adaptive controller adjusts signal timing in real time to maximize intersection throughput.",
        "Real-time queue-aware adaptive signal timing.",
        "Vision-based flow estimation feeding an optimization loop per intersection.",
        "City traffic authorities, urban planners, and commuters.",
        "Reduces intersection congestion, travel time, and vehicle emissions.",
    ),
    _idea(
        "Virtual Lab Simulator for Science Education",
        "Education", "EdTech",
        "JavaScript, Three.js, React, Node.js, PostgreSQL",
        "An interactive virtual laboratory where students safely perform chemistry and physics experiments through realistic simulations.",
        "Many schools lack lab equipment and safe facilities, so students miss hands-on experiments essential to understanding science concepts.",
        "Students perform simulated experiments with realistic apparatus, observe outcomes, and receive guided feedback tied to curriculum objectives.",
        "Curriculum-aligned simulations with guided experiment feedback.",
        "Physics-faithful simulation that mirrors real lab cause-and-effect.",
        "School students, science teachers, and under-resourced institutions.",
        "Expands access to hands-on science learning where labs are unavailable.",
    ),
    _idea(
        "AI Chatbot for Government Service Information",
        "Natural Language Processing", "GovTech",
        "Python, FastAPI, Transformers, React, PostgreSQL",
        "A multilingual chatbot that answers citizens' questions about government services, documents, and procedures in plain language.",
        "Citizens struggle to navigate complex government websites and procedures, wasting time and missing entitlements due to unclear information.",
        "Citizens ask questions in their language; the chatbot answers with grounded steps, required documents, and links to the right official services.",
        "Multilingual, grounded answers with step-by-step procedure guidance.",
        "Retrieval grounding on official sources to keep answers accurate and current.",
        "Citizens, government help desks, and public-service agencies.",
        "Improves citizen access to public services and reduces administrative load.",
    ),
    _idea(
        "Smart Water Leak Detection for Buildings",
        "Internet of Things", "Smart Buildings",
        "Python, ESP32, MQTT, React, InfluxDB",
        "A monitoring system that detects water leaks early using flow and acoustic sensors to prevent damage and water waste in buildings.",
        "Hidden water leaks in buildings go unnoticed until they cause expensive damage and waste large volumes of water over time.",
        "Flow and acoustic sensors monitor pipes, detect anomalies indicating leaks, and alert facility managers with the likely location before damage spreads.",
        "Acoustic-plus-flow anomaly detection with localized leak alerts.",
        "Anomaly models that distinguish leaks from normal usage patterns.",
        "Facility managers, building owners, and property-management firms.",
        "Prevents water damage and waste through early leak detection.",
    ),
    _idea(
        "AI Nutrition Analyzer from Food Photos",
        "Computer Vision", "Health & Fitness",
        "Python, TensorFlow, Flutter, FastAPI, PostgreSQL",
        "An app that estimates calories and nutrients from a photo of a meal, helping users track diet without manual logging.",
        "Manual food logging is tedious and inaccurate, so people abandon diet tracking and lose sight of their nutritional intake.",
        "Users photograph meals; a recognition model identifies foods and portions and estimates calories and macros, building an effortless food diary.",
        "Photo-based portion and macro estimation for effortless logging.",
        "Food-and-portion recognition tuned to regional cuisines for accuracy.",
        "Health-conscious users, dietitians, and fitness coaches.",
        "Makes diet tracking effortless, improving nutrition awareness and adherence.",
    ),
    _idea(
        "Predictive Maintenance for Industrial Machines",
        "Artificial Intelligence / ML", "Manufacturing",
        "Python, FastAPI, scikit-learn, React, TimescaleDB",
        "A system that predicts industrial machine failures from sensor data so factories can schedule maintenance before breakdowns occur.",
        "Unplanned machine breakdowns halt production and cause costly downtime because factories maintain equipment reactively rather than predictively.",
        "Vibration and temperature sensors stream data to models that forecast failures and recommend maintenance windows before equipment fails.",
        "Failure forecasting with recommended maintenance scheduling.",
        "Sensor-fusion models that detect early degradation signatures.",
        "Factory operators, maintenance engineers, and plant managers.",
        "Reduces downtime and maintenance cost through predictive scheduling.",
    ),
    _idea(
        "Community Skill-Sharing and Microlearning App",
        "Mobile Application", "EdTech",
        "Flutter, Firebase, Node.js, PostgreSQL",
        "A mobile app where community members teach and learn short practical skills from one another through bite-sized lessons.",
        "People want to learn practical skills affordably but formal courses are costly and long, while local expertise goes untapped and unshared.",
        "Members publish short skill lessons, learners book sessions or follow microlearning tracks, and ratings surface trusted local mentors.",
        "Peer-to-peer microlearning with trust ratings for local mentors.",
        "Community-driven skill marketplace that turns local expertise into structured lessons.",
        "Lifelong learners, hobbyists, and local skilled community members.",
        "Expands affordable practical skill learning through community knowledge sharing.",
    ),
    _idea(
        "AI Early Warning System for Student Dropout",
        "Artificial Intelligence / ML", "Education",
        "Python, FastAPI, scikit-learn, React, PostgreSQL",
        "A system that flags students at risk of dropping out using attendance and performance signals so advisors can intervene early.",
        "Universities identify struggling students too late, after grades collapse, missing the window where timely support could keep them enrolled.",
        "The system analyzes attendance, grades, and engagement to flag at-risk students and recommends interventions for academic advisors.",
        "Early risk flags with recommended advisor interventions.",
        "Risk modeling on multi-signal academic data with explainable risk factors.",
        "Academic advisors, student-success offices, and university administrators.",
        "Improves student retention through timely, targeted academic support.",
    ),
    _idea(
        "Smart Library Book Recommendation and Locator",
        "Mobile Application", "Education",
        "React Native, Node.js, PostgreSQL, Elasticsearch",
        "A library app that recommends books to readers and guides them to the exact shelf location within the building.",
        "Library users struggle to discover relevant books and to physically locate them among thousands of shelves, reducing library usage.",
        "The app recommends titles from reading history and search, then provides shelf-level directions to each book inside the library.",
        "Personalized recommendations with in-library shelf navigation.",
        "Combines recommendation with indoor locating for end-to-end discovery.",
        "Students, librarians, and academic library visitors.",
        "Increases library usage by making book discovery and retrieval effortless.",
    ),
    _idea(
        "AI Voice Assistant for Visually Impaired Navigation",
        "Computer Vision", "Accessibility",
        "Python, OpenCV, TensorFlow, Flutter, FastAPI",
        "A mobile assistant that describes surroundings and obstacles aloud to help visually impaired users navigate safely.",
        "Visually impaired people face daily navigation risks because existing aids cannot describe dynamic surroundings or warn of obstacles in real time.",
        "The phone camera detects obstacles, signs, and objects, and the assistant narrates the scene and warns of hazards through audio guidance.",
        "Real-time scene narration with spoken obstacle warnings.",
        "On-device scene understanding tuned for low-latency audio guidance.",
        "Visually impaired individuals, accessibility organizations, and caregivers.",
        "Increases safe independent mobility for visually impaired users.",
    ),
    _idea(
        "Smart Classroom Engagement Analytics",
        "Computer Vision", "Education",
        "Python, OpenCV, FastAPI, React, PostgreSQL",
        "A system that measures classroom engagement from anonymized cues so instructors can adapt teaching to keep students attentive.",
        "Instructors cannot tell in real time when students disengage in large classes, so teaching does not adapt and learning suffers.",
        "Anonymized attention cues are aggregated into engagement trends, giving instructors live and post-class feedback to adjust pacing and delivery.",
        "Privacy-preserving aggregate engagement analytics for instructors.",
        "Aggregate-only analysis that protects individual privacy while informing teaching.",
        "University instructors, instructional designers, and teaching-quality offices.",
        "Helps instructors improve engagement and learning through actionable feedback.",
    ),
    _idea(
        "AI Chatbot for University Admission Guidance",
        "Natural Language Processing", "Education",
        "Python, FastAPI, Transformers, React, PostgreSQL",
        "A conversational assistant that answers prospective students' admission questions about programs, deadlines, eligibility, and fees in plain language.",
        "Prospective students are overwhelmed by scattered admission information and slow help-desk responses, so they miss deadlines and make poorly informed program choices.",
        "Applicants ask questions in natural language and receive grounded answers about programs, requirements, and deadlines, with handoff to staff for complex cases.",
        "Grounded admission answers with smart handoff to human counselors.",
        "Retrieval grounding on official prospectus data to keep guidance accurate and current.",
        "Prospective students, parents, and university admission offices.",
        "Improves applicant experience and reduces repetitive load on admission staff.",
    ),
]


def _make_full_project(idea: dict) -> dict:
    """Expand a core idea into a complete proposal with all fields populated."""
    title = idea["title"]
    industry = idea["target_industry"]
    users = idea["target_users"]
    return {
        "title": title,
        "technologies": idea["technologies"],
        "description": idea["description"],
        "category": idea["category"],
        "target_industry": industry,
        "problem_statement": idea["problem_statement"],
        "current_challenges": (
            f"Current approaches in {industry.lower()} are manual, fragmented, or costly, "
            f"which limits adoption and leaves the core problem behind {title} unresolved at scale."
        ),
        "existing_solutions": (
            f"A few generic tools touch parts of this space, but most {industry.lower()} teams "
            "still rely on manual processes or spreadsheets that do not address the full workflow."
        ),
        "existing_solution_limitations": (
            "Existing options are expensive, not localized, hard to integrate, or lack the accuracy "
            "and explainability needed for users to trust and adopt them in daily operations."
        ),
        "proposed_solution": idea["proposed_solution"],
        "project_scope": (
            f"The project delivers a working {title} with core features, a user-facing interface, "
            "a backend service, data storage, and an evaluation of accuracy and usability on realistic data."
        ),
        "unique_features": idea["unique_features"],
        "innovation_aspect": idea["innovation_aspect"],
        "competitive_advantage": (
            f"{title} differentiates through localization, explainability, and a focus on real {industry.lower()} "
            "workflows rather than generic demos, giving it a practical edge over existing alternatives."
        ),
        "market_gap": (
            f"There is no affordable, locally adapted solution that fully addresses this need in {industry.lower()}, "
            "leaving a clear gap this project targets."
        ),
        "target_users": users,
        "secondary_target_users": (
            "Administrators, analysts, and support staff who configure the system and act on its outputs."
        ),
        "ai_technologies_used": idea["technologies"],
        "technical_feasibility": (
            "The solution uses mature, well-documented libraries and proven architectures, making it "
            "technically feasible within a final-year project timeline using available hardware."
        ),
        "financial_feasibility": (
            "Development relies on open-source tools and low-cost infrastructure, keeping the budget modest "
            "and within reach for a student project or early-stage deployment."
        ),
        "operational_feasibility": (
            "The system is designed for straightforward deployment and minimal maintenance, so target users "
            "can operate it without specialized technical expertise."
        ),
        "expected_impact": idea["expected_impact"],
        "academic_impact": (
            f"This project demonstrates applied research in {idea['category'].lower()} and contributes a reusable, "
            f"evaluated approach to the problem addressed by {title}, suitable for academic study and extension."
        ),
        "business_impact": (
            f"Adopters can reduce cost and improve outcomes in {industry.lower()}, creating a viable basis for "
            "a product or service offering."
        ),
        "social_impact": (
            f"By improving access and efficiency, {title} benefits the wider community served by {industry.lower()}, "
            "including underserved or resource-constrained users."
        ),
        "future_enhancements": (
            "Future work includes broader data coverage, mobile and offline support, multilingual interfaces, "
            "and tighter integration with existing third-party systems."
        ),
        "scalability_opportunities": (
            "The architecture supports horizontal scaling and additional data sources, enabling growth from a pilot "
            "to institution-wide or city-wide deployment."
        ),
        "commercialization_potential": (
            "The solution can be offered as a subscription service or licensed to institutions, with clear paths to "
            "revenue once validated with early adopters."
        ),
        "privacy_concerns": (
            "Personal and sensitive data are minimized, access-controlled, and stored securely, with user consent "
            "obtained before any data collection or processing."
        ),
        "security_concerns": (
            "The system enforces authentication, encrypts data in transit and at rest, and follows secure coding "
            "practices to protect against common vulnerabilities."
        ),
        "ethical_considerations": (
            "The design considers fairness, transparency, and accountability, avoiding harmful bias and keeping "
            "humans in control of consequential decisions."
        ),
        "future_scope": (
            f"{title} can expand into adjacent use cases and integrate emerging techniques as the underlying "
            "technology and available data continue to mature."
        ),
        "risk_assessment": (
            "Key risks include data quality, model accuracy, and user adoption; these are mitigated through careful "
            "evaluation, iterative feedback, and fallback manual workflows."
        ),
    }


async def _ensure_corpus_students(db) -> list[int]:
    """Create corpus author students if missing; return all student ids."""
    dept_result = await db.execute(select(Department).limit(1))
    dept = dept_result.scalar_one_or_none()
    dept_id = dept.id if dept else None

    for full_name, handle, student_id in CORPUS_AUTHORS:
        email = f"{handle}@student.uol.edu.pk"
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            continue
        user = User(
            email=email,
            hashed_password=hash_password("Corpus123"),
            full_name=full_name,
            role=UserRole.STUDENT,
            phone="+920000000000",
        )
        db.add(user)
        await db.flush()
        db.add(
            Student(
                user_id=user.id,
                student_id=student_id,
                department_id=dept_id,
                major="Computer Science",
                year="4th Year",
            )
        )
    await db.flush()

    ids = [r[0] for r in (await db.execute(select(Student.id).order_by(Student.id))).all()]
    return ids


async def seed_corpus(*, force: bool = False, dry_run: bool = False, analyze: bool = True) -> None:
    inserted = 0
    skipped = 0
    analyzed = 0
    failed = 0

    async with AsyncSessionLocal() as db:
        prof_result = await db.execute(
            select(Professor).join(Professor.user).where(User.email == PROFESSOR_EMAIL)
        )
        professor = prof_result.scalar_one_or_none()
        if not professor:
            raise RuntimeError(f"{PROFESSOR_EMAIL} not found — run `python -m scripts.seed` first")

        student_ids = await _ensure_corpus_students(db)
        if not student_ids:
            raise RuntimeError("No students available — run `python -m scripts.seed` first")

        base_date = date.today() - timedelta(days=len(IDEAS))
        new_project_ids: list[int] = []

        for i, idea in enumerate(IDEAS):
            full = _make_full_project(idea)
            title = full["title"]

            exists = await db.execute(select(ProjectIdea.id).where(ProjectIdea.title == title))
            existing_id = exists.scalar_one_or_none()
            if existing_id:
                skipped += 1
                # Resumable: re-analyze existing corpus projects that have no relevancy
                # result yet (or all of them under --force).
                if analyze:
                    has_rel = await db.scalar(
                        select(RelevancyResult.id).where(RelevancyResult.project_id == existing_id)
                    )
                    if force or not has_rel:
                        new_project_ids.append(existing_id)
                if dry_run:
                    print(f"  [SKIP   ] {title[:60]}")
                continue

            if dry_run:
                print(f"  [INSERT ] {title[:60]}")
                inserted += 1
                continue

            project = ProjectIdea(
                student_id=student_ids[i % len(student_ids)],
                professor_id=professor.id,
                professor_email=PROFESSOR_EMAIL,
                status=ProjectStatus.APPROVED,
                submitted_date=base_date + timedelta(days=i),
                feedback="Approved as part of the reference project corpus.",
                **full,
            )
            db.add(project)
            await db.flush()
            new_project_ids.append(project.id)
            inserted += 1
            print(f"  [INSERT ] id={project.id}  {title[:55]}")

        if dry_run:
            print(f"\nDry run: would insert {inserted}, skip {skipped}.")
            return

        await db.commit()

    if analyze and new_project_ids:
        print(f"\nRunning relevancy analysis on {len(new_project_ids)} approved projects...")
        for pid in new_project_ids:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(ProjectIdea)
                    .where(ProjectIdea.id == pid)
                    .options(selectinload(ProjectIdea.student).selectinload(Student.user))
                )
                project = result.scalar_one_or_none()
                if not project:
                    continue
                try:
                    rel = await run_relevancy_analysis(db, project)
                    await db.commit()
                    analyzed += 1
                    matches = len(rel.matched_projects or [])
                    print(
                        f"  [OK     ] id={pid}  score={rel.overall_score:.2f}  "
                        f"similarity={rel.similarity_score:.2f}  matches={matches}"
                    )
                except Exception as exc:  # noqa: BLE001
                    failed += 1
                    print(f"  [FAIL   ] id={pid}  {exc}")

    print("\n" + "=" * 56)
    print(f"Inserted:  {inserted}")
    print(f"Skipped:   {skipped} (already existed)")
    if analyze:
        print(f"Analyzed:  {analyzed}")
        print(f"Failed:    {failed}")
    print("All seeded projects are status=APPROVED (relevancy reference corpus).")
    print("=" * 56)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed 50 approved reference-corpus projects")
    parser.add_argument("--force", action="store_true", help="re-run relevancy for existing corpus projects")
    parser.add_argument("--dry-run", action="store_true", help="list actions without writing")
    parser.add_argument("--no-analyze", action="store_true", help="insert only; skip relevancy analysis")
    args = parser.parse_args()

    asyncio.run(
        seed_corpus(force=args.force, dry_run=args.dry_run, analyze=not args.no_analyze)
    )


if __name__ == "__main__":
    main()
