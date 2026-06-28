# University Proposal Audit

**Project:** AI-Based FYP Relevancy System  
**Source directory:** `dataset/university_proposals/`  
**Audit date:** June 2026  
**Method:** Automated text extraction (pypdf, python-docx) + section heuristics + TF-IDF cosine pairwise comparison  
**Database import:** **None** — audit only

---

## Executive Summary

| Metric | Value |
|--------|------:|
| **Total proposals** | **13** |
| PDF files | 9 |
| DOCX files | 4 |
| Pairwise comparisons | 78 |
| Exact duplicates (≥90% content) | **0** |
| Near-duplicate candidates (≥65% same domain) | **1 pair** |
| Similar-domain pairs (≥35%, same category/industry) | **10** |
| Import-ready (≥5/7 fields, ≥200 chars text) | **10 / 13** |

**Key finding:** Two career-coaching proposals (`Proposal CareerCraft V2.pdf` and `qaiser11 fyp perposol.pdf`) show **67% content similarity** and overlapping product scope — the strongest duplicate-risk pair in this corpus. Several high similarity scores (60–68%) are inflated by **shared UOL proposal template boilerplate** (student blocks, page headers, supervisor names).

---

## 1. Total Proposal Count

```
dataset/university_proposals/
├── ahad CipherPlay_Proposal.pdf
├── AI_Classroom_Noise_Notes_Proposal.pdf
├── Filled_FYP_Proposal_AI_Tuition_System.docx
├── Final year project.pdf
├── FYP Pre.docx
├── FYP Proposal.docx
├── FYP Proposal.pdf
├── FYP_C-PRMS 2.pdf
├── FYP_Proposal_1.docx
├── pixelwave (hrm) project proposal by group 2_260621_125121.pdf
├── Proposal CareerCraft V2.pdf
├── Proposal.pdf
└── qaiser11 fyp perposol.pdf
```

| Format | Count |
|--------|------:|
| PDF | 9 |
| DOCX | 4 |
| **Total** | **13** |

---

## 2. Summary Table

| # | File | Title (extracted) | Category | Industry | Fields OK | Text (chars) |
|---|------|-------------------|----------|----------|:---------:|-------------:|
| 1 | ahad CipherPlay_Proposal.pdf | CipherPlay — AI children's fitness game | Gaming & Entertainment | Entertainment | 7/7 | 18,192 |
| 2 | AI_Classroom_Noise_Notes_Proposal.pdf | Classroom Noise Detection & Auto Notes | Education & EdTech | Higher Education | 7/7 | 2,447 |
| 3 | Filled_FYP_Proposal_AI_Tuition_System.docx | AI Smart Tuition Recommendation System | Education & EdTech | Higher Education | 6/7 | 2,829 |
| 4 | Final year project.pdf | ScholarIQ — Scholarship discovery platform | Education & EdTech | Higher Education | 6/7 | 4,156 |
| 5 | FYP Pre.docx | Smart Relocation & Property Finder | General Software / AI | Information Technology | 6/7 | 2,922 |
| 6 | FYP Proposal.docx | AI Retinal Disease Detection (Deep Learning) | Healthcare & Medical AI | Healthcare | 5/7 | 1,630 |
| 7 | FYP Proposal.pdf | AI Smart Parking & Security System | Smart Cities & IoT | Information Technology | 4/7 | 17,033 |
| 8 | FYP_C-PRMS 2.pdf | Integrated Health Information System (IHIS) | Healthcare & Medical AI | Healthcare | 7/7 | 17,034 |
| 9 | FYP_Proposal_1.docx | AI “Can I Resell This?” Waste-to-Value | General Software / AI | Higher Education | 6/7 | 2,435 |
| 10 | pixelwave (hrm)...pdf | PixelWave Strategic HRM Framework | Human Resources & HRM | Human Resources | 4/7 | 4,879 |
| 11 | Proposal CareerCraft V2.pdf | CareerCraft AI — Interview & Resume Platform | Career & Employment | Career Services | 6/7 | 23,572 |
| 12 | Proposal.pdf | AI Weapon Detection (Thermal + RGB Fusion) | Education & EdTech* | Higher Education* | 4/7 | 8,572 |
| 13 | qaiser11 fyp perposol.pdf | AI Career Coaching & Job Preparation | General Software / AI | Career Services | 5/7 | 6,551 |

\* *Misclassified by keyword rules — content is Security & Surveillance, not EdTech (see Section 5).*

---

## 3. Extracted Fields (Per Proposal)

### 3.1 ahad CipherPlay_Proposal.pdf

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | CipherPlay — AI-powered children's indoor fitness game |
| **Description** | Mobile games fail to combine screen time with physical activity for ages 4–14 |
| **Problem Statement** | Sedentary screen time health risks; lack of indoor physical digital alternatives |
| **Proposed Solution** | YOLO object detection + physical entropy encryption + adaptive gameplay |
| **Technologies** | Python, YOLO, Android, hardware entropy module |
| **Target Users** | Children 4–14; parents seeking active screen alternatives |
| **Expected Impact** | Functional Android app with on-device AI and encryption |

### 3.2 AI_Classroom_Noise_Notes_Proposal.pdf

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | AI Classroom Noise Detection & Automatic Lecture Notes Generator |
| **Description** | Classroom noise reduces lecture recording quality |
| **Problem Statement** | Traditional recordings have noise, no summaries, unstructured notes |
| **Proposed Solution** | CNN noise classification → filtering → Whisper ASR → LLM summarization |
| **Technologies** | Python, PyTorch, Whisper, Transformers, Librosa, Streamlit/FastAPI |
| **Target Users** | Students and teachers |
| **Expected Impact** | Clean audio, transcripts, auto-generated notes |

### 3.3 Filled_FYP_Proposal_AI_Tuition_System.docx

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | AI Smart Tuition Recommendation System |
| **Description** | ML platform matching students to tutors by performance, budget, location |
| **Problem Statement** | Random tutor selection leads to poor outcomes and wasted money |
| **Proposed Solution** | AI/ML analysis of performance → personalized tutor recommendations & study plans |
| **Technologies** | React/Flutter, Node.js/Django, Python, Scikit-learn |
| **Target Users** | Students and parents |
| **Expected Impact** | *(not extracted — section missing in source)* |

### 3.4 Final year project.pdf (ScholarIQ)

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | ScholarIQ — AI scholarship recommendation platform |
| **Description** | Personalized international scholarship discovery by academic profile |
| **Problem Statement** | Scattered, outdated, fraudulent scholarship information |
| **Proposed Solution** | *(section header not matched — content in description)* |
| **Technologies** | React.js, Bootstrap 5 |
| **Target Users** | International students seeking scholarships |
| **Expected Impact** | Educational equity, reduced stress, improved application success |

### 3.5 FYP Pre.docx

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | Smart Relocation Assistance and Property Finder System |
| **Description** | Relocation challenges in Pakistan — property search, dealers, post-move services |
| **Problem Statement** | Unstructured search, untrusted dealers, no unified relocation platform |
| **Proposed Solution** | Web platform: property search, dealer connections, relocation services, ratings |
| **Technologies** | React.js *(partial — section truncated)* |
| **Target Users** | Property seekers relocating to new cities |
| **Expected Impact** | Functional web app with integrated relocation services |

### 3.6 FYP Proposal.docx

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | AI-Based Retinal Disease Detection Using Deep Learning |
| **Description** | *(embedded in title block — non-standard layout)* |
| **Problem Statement** | Manual retinal diagnosis is slow; rural access limited |
| **Proposed Solution** | CNN-based classification of diabetic retinopathy and glaucoma from fundus images |
| **Technologies** | Python, TensorFlow/Keras, OpenCV, React, FastAPI |
| **Target Users** | Patients, ophthalmologists, rural clinics |
| **Expected Impact** | Early disease detection, blindness prevention |

### 3.7 FYP Proposal.pdf (Smart Parking)

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | AI Powered Smart Parking and Security System |
| **Description** | *(not extracted — UOL template layout)* |
| **Problem Statement** | Manual parking causes wait times, inefficiency, security gaps |
| **Proposed Solution** | AI + IoT integrated parking and vehicle surveillance |
| **Technologies** | AI, IoT, CCTV integration *(partial)* |
| **Target Users** | Parking operators, residential societies, smart city authorities |
| **Expected Impact** | *(not extracted)* |

### 3.8 FYP_C-PRMS 2.pdf (IHIS)

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | Integrated Health Information System (IHIS) |
| **Description** | Pakistan digital health / EHR interoperability context |
| **Problem Statement** | Paper records, siloed institutions, no interoperability |
| **Proposed Solution** | Scrum-based IHIS with patient registration, EHR, interoperability |
| **Technologies** | Jira, Git, AWS/Azure, Docker, programming stack |
| **Target Users** | Healthcare institutions, patients, government |
| **Expected Impact** | National-scale health information integration |

### 3.9 FYP_Proposal_1.docx

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | AI “Can I Resell This?” Waste-to-Value System |
| **Description** | Image-based decision: sell, reuse, repair, or recycle used items |
| **Problem Statement** | Useful items discarded without knowing resale/recycling value |
| **Proposed Solution** | YOLO detection + condition analysis + price prediction + action recommendation |
| **Technologies** | React/Flutter, FastAPI, TensorFlow, PyTorch, OpenCV, Firebase |
| **Target Users** | General consumers, sustainability-focused users |
| **Expected Impact** | *(not extracted)* |

### 3.10 pixelwave (hrm) project proposal.pdf

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | Building a Strategic HRM Framework for PixelWave |
| **Description** | HRM system for tech startup talent and engagement |
| **Problem Statement** | *(not extracted)* |
| **Proposed Solution** | Structured HRM practices: talent acquisition, engagement, performance |
| **Technologies** | *(not extracted)* |
| **Target Users** | PixelWave employees and HR team |
| **Expected Impact** | *(not extracted)* |

### 3.11 Proposal CareerCraft V2.pdf

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | CareerCraft AI — Interview & Resume Mastery Platform |
| **Description** | AI interview simulator, resume optimization, NLP feedback |
| **Problem Statement** | *(in title block — not section-parsed)* |
| **Proposed Solution** | AI interview practice, resume ATS optimization, communication analysis |
| **Technologies** | Python (TensorFlow/PyTorch, OpenCV, spaCy), Flutter, Node.js |
| **Target Users** | Students, graduates, professionals, career centers |
| **Expected Impact** | Improved interview readiness and resume quality |

### 3.12 Proposal.pdf (Weapon Detection)

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | AI Real-Time Weapon Detection (Thermal + RGB Fusion) |
| **Description** | *(not extracted — template layout)* |
| **Problem Statement** | RGB-only detection fails in low light; expensive cloud systems |
| **Proposed Solution** | YOLOv8 + thermal/RGB fusion for real-time weapon detection |
| **Technologies** | YOLOv8, thermal imaging, image fusion, embedded systems |
| **Target Users** | Security organizations, schools, government agencies |
| **Expected Impact** | *(not extracted)* |

### 3.13 qaiser11 fyp perposol.pdf

| Field | Extracted value (summary) |
|-------|---------------------------|
| **Title** | AI-Powered Career Coaching and Job Preparation Platform |
| **Description** | Fragmented job prep tools yield generic results |
| **Problem Statement** | *(in problem identification block — not section-parsed)* |
| **Proposed Solution** | *(not extracted — content describes resume/cover letter/interview features inline)* |
| **Technologies** | Next.js, Gemini API, WebRTC, Vapi, Clerk, Prisma, PostgreSQL |
| **Target Users** | Students, fresh graduates, career switchers |
| **Expected Impact** | Tailored resumes, cover letters, mock interviews |

---

## 4. Duplicate Detection

### 4.1 Exact duplicates (content similarity ≥ 90%)

**None found.**

No two files share substantially identical proposal text.

### 4.2 Near-duplicate candidates (≥ 65% content, same product domain)

| Rank | File A | File B | Content Sim | Title Sim | Assessment |
|------|--------|--------|------------:|----------:|------------|
| **1** | Proposal CareerCraft V2.pdf | qaiser11 fyp perposol.pdf | **67.4%** | 2.4% | **Near duplicate — same career coaching domain** |
| 2 | FYP_C-PRMS 2.pdf | qaiser11 fyp perposol.pdf | 68.0% | 5.2% | **False positive** — UOL template boilerplate |
| 3 | FYP Proposal.pdf | Proposal CareerCraft V2.pdf | 65.4% | 27.5% | **False positive** — different domains (parking vs career) |

**Actionable near-duplicate:**

```
Proposal CareerCraft V2.pdf  ↔  qaiser11 fyp perposol.pdf
```

Both propose AI career preparation platforms with:
- Resume optimization
- Mock interviews / AI feedback
- Target users: students and graduates
- Similar tech stacks (Python AI + web/mobile frontend)

Different group members and branding, but **high semantic overlap** expected under Sentence Transformer V2.

### 4.3 Similar-domain clusters (same category or industry, ≥ 35% similarity)

| Cluster | Members | Domain |
|---------|---------|--------|
| **Career services** | CareerCraft V2, qaiser11 fyp perposol | Interview prep, resume, job readiness |
| **Education / EdTech** | AI Tuition, ScholarIQ, Classroom Noise, Weapon† | Learning platforms |
| **Healthcare** | Retinal Detection, IHIS | Clinical / hospital systems |
| **Smart city / security** | Smart Parking, Weapon Detection | Surveillance & IoT |

† Weapon Detection mis-tagged as EdTech by keyword classifier.

---

## 5. Classification

### 5.1 Project category (rule-based)

| Category | Count | Files |
|----------|------:|-------|
| Education & EdTech | 4 | Classroom Noise, Tuition, ScholarIQ, Weapon† |
| Healthcare & Medical AI | 2 | Retinal Detection, IHIS |
| General Software / AI | 2 | Relocation, Waste-to-Value, Qaiser† |
| Career & Employment | 1 | CareerCraft |
| Smart Cities & IoT | 1 | Smart Parking |
| Gaming & Entertainment | 1 | CipherPlay |
| Human Resources & HRM | 1 | PixelWave |

### 5.2 Target industry

| Industry | Count | Files |
|----------|------:|-------|
| Higher Education | 5 | Classroom, Tuition, ScholarIQ, Waste-to-Value, Weapon† |
| Healthcare | 2 | Retinal, IHIS |
| Career Services | 2 | CareerCraft, Qaiser |
| Information Technology | 2 | Relocation, Smart Parking |
| Entertainment | 1 | CipherPlay |
| Human Resources | 1 | PixelWave |

### 5.3 Classification corrections recommended

| File | Auto-classified | Recommended |
|------|-----------------|-------------|
| Proposal.pdf | Education / Higher Ed | **Security & Surveillance** |
| qaiser11 fyp perposol.pdf | General Software / AI | **Career & Employment** |
| FYP_Proposal_1.docx | General Software / Higher Ed | **Environment / Circular Economy** |

---

## 6. Missing Field Report

Fields audited: `title`, `description`, `problem_statement`, `proposed_solution`, `technologies`, `target_users`, `expected_impact`

| File | Missing fields | Notes |
|------|----------------|-------|
| ahad CipherPlay_Proposal.pdf | — | Complete |
| AI_Classroom_Noise_Notes_Proposal.pdf | — | Complete |
| Filled_FYP_Proposal_AI_Tuition_System.docx | expected_impact | Section absent in DOCX |
| Final year project.pdf | proposed_solution | Content merged into description |
| FYP Pre.docx | technologies | Only partial tech list extracted |
| FYP Proposal.docx | description, problem_statement | Non-standard single-block layout |
| **FYP Proposal.pdf** | description, problem_statement, expected_impact | UOL multi-page template |
| FYP_C-PRMS 2.pdf | — | Complete |
| FYP_Proposal_1.docx | expected_impact | Section absent |
| **pixelwave (hrm)...pdf** | problem_statement, technologies, expected_impact | Business/HRM format, not FYP template |
| Proposal CareerCraft V2.pdf | problem_statement | Present in title block, not parsed |
| **Proposal.pdf** | description, problem_statement, expected_impact | UOL template layout |
| qaiser11 fyp perposol.pdf | problem_statement, proposed_solution | Present inline, not section-parsed |

### Aggregate missing-field frequency

| Field | Missing in N files |
|-------|-------------------:|
| expected_impact | 5 |
| problem_statement | 5 |
| description | 3 |
| proposed_solution | 2 |
| technologies | 2 |

**Root cause:** Most gaps are **extraction/parsing failures**, not absent content — especially for UOL PDF templates with problem identification in non-standard blocks.

---

## 7. Pairwise Similarity — Top 15

| Rank | Pair | Content % | Same industry? | Notes |
|------|------|----------:|:--------------:|-------|
| 1 | IHIS ↔ Qaiser career | 68.0 | No | Template inflation |
| 2 | CareerCraft ↔ Qaiser career | **67.4** | **Yes** | **True similar-domain pair** |
| 3 | Smart Parking ↔ CareerCraft | 65.4 | No | Template inflation |
| 4 | IHIS ↔ CareerCraft | 62.9 | No | Template inflation |
| 5 | Weapon ↔ Qaiser career | 62.3 | No | Template inflation |
| 6 | Smart Parking ↔ Weapon | 61.8 | No | Both security/IoT-ish |
| 7 | IHIS ↔ Weapon | 61.5 | No | Template inflation |
| 8 | PixelWave HRM ↔ CareerCraft | 60.3 | No | Weak overlap |
| 9 | Tuition ↔ Waste-to-Value | 60.0 | Yes | Generic AI proposal language |
| 10 | Smart Parking ↔ IHIS | 58.7 | No | Template inflation |
| 11 | Tuition ↔ CareerCraft | 58.6 | No | — |
| 12 | Smart Parking ↔ Qaiser | 57.9 | No | — |
| 13 | CipherPlay ↔ Qaiser | 57.1 | No | — |
| 14 | IHIS ↔ PixelWave HRM | 56.5 | No | — |
| 15 | CareerCraft ↔ Weapon | 56.1 | No | — |

**Threshold guidance for relevancy engine:**

| Similarity | Interpretation (this corpus) |
|------------|------------------------------|
| ≥ 90% | Exact duplicate — none found |
| 65–89% | Investigate — likely same domain or template noise |
| 50–64% | Moderate — may share AI/education vocabulary |
| < 50% | Distinct projects |

---

## 8. Import Readiness Report

Criteria for **import-ready**: ≥ 5 of 7 fields extracted with ≥ 15 chars each, raw text ≥ 200 chars, no critical extraction failure.

| File | Fields | Ready? | Blockers |
|------|:------:|:------:|----------|
| ahad CipherPlay_Proposal.pdf | 7/7 | **Yes** | — |
| AI_Classroom_Noise_Notes_Proposal.pdf | 7/7 | **Yes** | — |
| Filled_FYP_Proposal_AI_Tuition_System.docx | 6/7 | **Yes** | Add expected_impact manually |
| Final year project.pdf | 6/7 | **Yes** | Map proposed_solution from description |
| FYP Pre.docx | 6/7 | **Yes** | Expand technologies field |
| FYP Proposal.docx | 5/7 | **Yes** | Manual section split recommended |
| FYP Proposal.pdf | 4/7 | **No** | 3 missing fields — manual curation required |
| FYP_C-PRMS 2.pdf | 7/7 | **Yes** | — |
| FYP_Proposal_1.docx | 6/7 | **Yes** | Add expected_impact |
| pixelwave (hrm)...pdf | 4/7 | **No** | HRM business doc — not standard FYP format |
| Proposal CareerCraft V2.pdf | 6/7 | **Yes** | problem_statement in title block |
| Proposal.pdf | 4/7 | **No** | UOL template — manual curation required |
| qaiser11 fyp perposol.pdf | 5/7 | **Yes** | Manual field mapping recommended |

### Import readiness summary

| Status | Count |
|--------|------:|
| **Ready** (with optional manual cleanup) | **10** |
| **Not ready** (needs manual curation) | **3** |
| **Recommended for eval corpus first** | CareerCraft + Qaiser pair, Classroom Noise, CipherPlay, IHIS, Tuition |

### Mapping to PostgreSQL `project_ideas`

| Source field | DB column | Ready proposals |
|--------------|-----------|----------------:|
| title | `title` | 13/13 |
| description | `description` | 10/13 reliable |
| problem_statement | `problem_statement` | 8/13 reliable |
| proposed_solution | `proposed_solution` | 11/13 reliable |
| technologies | `technologies` | 11/13 reliable |
| target_users | `target_users` | 13/13 (partial quality) |
| expected_impact | `expected_impact` | 8/13 reliable |

**Recommendation:** Do not bulk-import raw extractions. Use **10 ready files** with manual review of 3 blocked files. Tag CareerCraft + Qaiser as a **labeled paraphrase/near-duplicate pair** if added to eval corpus.

---

## 9. Recommendations

1. **Near-duplicate alert:** Flag `Proposal CareerCraft V2.pdf` ↔ `qaiser11 fyp perposol.pdf` if both are imported — expected V1 TF-IDF may under-detect (different titles); V2 semantic layer should catch this.
2. **Template de-noising:** Strip UOL boilerplate (student info tables, page headers) before similarity scoring to reduce false positives (IHIS ↔ unrelated proposals at 60–68%).
3. **Manual curation:** Prioritize fixing `FYP Proposal.pdf`, `Proposal.pdf`, and `pixelwave HRM` before import.
4. **Classification:** Override auto-tags for weapon detection and career proposals.
5. **Eval corpus expansion:** These 13 real proposals complement the synthetic `[EVAL-*]` corpus — especially the career pair for V2 validation.

---

## 10. Audit Methodology

| Step | Tool |
|------|------|
| PDF text extraction | `pypdf` |
| DOCX text extraction | `python-docx` |
| Section parsing | Regex header patterns |
| Category / industry | Keyword rule classifier |
| Pairwise similarity | TF-IDF bag-of-words cosine (0–100%) |
| Title similarity | `difflib.SequenceMatcher` |

**Limitations:**
- Scanned/image PDFs would fail extraction (all 13 files had extractable text)
- Section parser struggles with UOL multi-column templates
- Similarity scores include template boilerplate noise
- No Sentence Transformer semantic similarity in this audit (V1-style TF-IDF only)

---

## 11. Artifacts

| File | Purpose |
|------|---------|
| `UNIVERSITY_PROPOSAL_AUDIT.md` | This report |
| `dataset/university_proposals_audit.json` | Machine-readable audit output (supporting) |

**No data was imported into PostgreSQL.**

---

*Generated from read-only audit of `dataset/university_proposals/`.*
