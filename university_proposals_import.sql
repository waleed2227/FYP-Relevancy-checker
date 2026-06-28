-- University proposals import (10 ready proposals)
-- Run: psql -U postgres -d fyp_relevancy_system -f university_proposals_import.sql
-- Prefer: python -m scripts.import_university_proposals (handles escaping safely)
BEGIN;

-- Source: AI_Classroom_Noise_Notes_Proposal.pdf
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'AI-Powered Real-Time Classroom Noise Detection and Automatic Lecture Notes Generator',
  'Python, PyTorch, Whisper, Transformers, Librosa, Streamlit, FastAPI',
  'An AI classroom assistant that classifies noise in real time, filters audio, transcribes teacher speech with Whisper, and generates summarized lecture notes.',
  'Education & EdTech',
  'Higher Education',
  'Traditional lecture recordings contain background noise, poor audio quality, and lack structured summaries, forcing students to re-listen to long recordings.',
  'Pipeline: noise classification (CNN/CRNN) → real-time filtering → Whisper ASR → LLM summarization, delivered via Python backend and web UI.',
  'Real-time noise classification; combined filtering, transcription, and summarization',
  'Integrates audio AI, speech recognition, and NLP summarization in one classroom tool',
  'University students and lecturers',
  'Clean audio recordings, searchable transcripts, and auto-generated lecture notes',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'AI-Powered Real-Time Classroom Noise Detection and Automatic Lecture Notes Generator'
);

-- Source: FYP Pre.docx
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'Smart Relocation Assistance and Property Finder System',
  'React.js, Node.js, PostgreSQL, Google Maps API',
  'In Pakistan, individuals often face significant challenges when relocating to a new city for residence or investment purposes. Finding suitable property in unfamiliar areas, identifying reliable dealers, and managing post-move services such as transportation, utilities, and maintenance can be time-consuming and inefficient. While platforms like Zameen.com provide property listings, they do not fully address the complete relocation experience, particularly in terms of local service integration and user feedback mechanisms. 2. Problem Statement Users searching for property in another city face: Unstructured property search Difficulty finding trusted dealers Lack of relocation services in one platform No reliable rating system Poor access to local service information',
  'General Software / AI',
  'Information Technology',
  'Users searching for property in another city face: Unstructured property search Difficulty finding trusted dealers Lack of relocation services in one platform No reliable rating system Poor access to local service information',
  '',
  'Structured property search; dealer ratings; integrated relocation services',
  'Combines property discovery with relocation logistics in one platform',
  'Individuals relocating to new cities in Pakistan for residence or investment',
  's Functional web application Structured property search system Integrated relocation services Transparent rating system 10. Novelty / Contribution Combines property + relocation services',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'Smart Relocation Assistance and Property Finder System'
);

-- Source: FYP Proposal.docx
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 2),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'AI-Based Retinal Disease Detection System Using Deep Learning',
  'Python, TensorFlow, Keras, OpenCV, React, FastAPI',
  'A deep learning system to detect diabetic retinopathy and glaucoma from retinal fundus images, supporting early diagnosis especially in underserved areas.',
  'Healthcare & Medical AI',
  'Healthcare',
  'Manual retinal diagnosis is time-consuming and inaccessible in rural areas, delaying treatment for diabetic retinopathy and glaucoma.',
  'The proposed system will use Deep Learning and Convolutional Neural Networks (CNN) to automatically detect retinal diseases from fundus images. The system will preprocess retinal images, extract important features, and classify whether the patient has diabetic retinopathy, glaucoma, or a normal retina. Poor access to local service information 3. Main Features',
  'Fundus image upload; CNN classification; remote monitoring support',
  'Automated CNN-based retinal screening accessible via a web application',
  'Patients, ophthalmologists, and rural clinic staff',
  's',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'AI-Based Retinal Disease Detection System Using Deep Learning'
);

-- Source: FYP_C-PRMS 2.pdf
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'Integrated Health Information System (IHIS)',
  'Jira, Git, AWS/Azure, Docker, Python, PostgreSQL',
  'The healthcare system of Pakistan is still suffering from serious issues, and one of the most significant is fragmented patient data. Paper-based records, confined to individual health care institutions, create barriers for seamless patient care, hinder research, and the government''s capacity to plan and deliver public health services. Relevance: • Fragmented data leads to delayed diagnoses, medication errors, and inconsistent treatment plans, thereby affecting the outcome for patients. The University of Lahore – Final Year Project Proposal Page 3 • Lack of interoperability is one of the challenges facing public health initiatives, where tracking disease outbreaks, planning resource allocation, and effective public health surveillance are hard to achieve. • Poor data management bur',
  'Healthcare & Medical AI',
  'Healthcare',
  'The current healthcare system in Pakistan suffers a lot of inefficiency due to lack of interoperability. Paper-based records, siloed within individual healthcare institutions, hinder seamless patient care, impede research, and limit the government''s ability to effectively plan and deliver public health services Day Month Year DATE – – The University of Lahore – Final Year Project Proposal Page 2 EXECUTIVE SUMMARY This project aims to develop a secure and interoperable Web application and Mobile app(for patient portal) for Centralized Patient Record Management System (C-PRMS) for government healthcare institutions in Pakistan. Recognizing the limitation of fragmented patient data, the C-PRMS is expected to improve healthcare delivery by empowering healthcare prof',
  'Develop an interoperable health information system with patient registration, EHR modules, and Scrum-based iterative delivery for Pakistani healthcare institutions.',
  'Patient registration; EHR interoperability; sprint-based delivery',
  'National-scale health information integration addressing paper-record silos',
  'Healthcare institutions, patients, and government health planners',
  '',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'Integrated Health Information System (IHIS)'
);

-- Source: FYP_Proposal_1.docx
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'AI-Based "Can I Resell This?" System for Waste-to-Value Optimization',
  'React, Flutter, FastAPI, TensorFlow, PyTorch, OpenCV, Firebase',
  'Similarity Index Problems with Existing Solutions Existing solutions mainly focus on selling products only. They do not provide intelligent recommendations about recycling, repairing, or reusing items. Users also have to manually estimate item condition and pricing. Our Approach Our project uses AI and image processing techniques to automatically detect items, analyze their condition, estimate resale value, and suggest the best action such as selling, repairing, reusing, or recycling.',
  'General Software / AI',
  'Environment & Sustainability',
  ': People often throw away useful items without knowing their resale or recycling value, which increases waste and causes financial and environmental loss. Major Functionalities Object Detection using image input Condition Analysis of used items Resale Price Prediction Sell, Reuse, or Recycle Recommendation Targeted Users Households Students',
  'Our project uses AI and image processing techniques to automatically detect items, analyze their condition, estimate resale value, and suggest the best action such as selling, repairing, reusing, or recycling.',
  'Image-based object detection; condition analysis; resale price prediction',
  'Combines YOLO detection with resale/recycle decision support in one workflow',
  'General consumers and sustainability-conscious households',
  'Reduce waste and financial loss by guiding users to sell, reuse, repair, or recycle items based on AI condition and value analysis',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'AI-Based "Can I Resell This?" System for Waste-to-Value Optimization'
);

-- Source: Filled_FYP_Proposal_AI_Tuition_System.docx
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 2),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'AI Smart Tuition Recommendation System',
  'React, Flutter, Node.js, Django, Python, Scikit-learn',
  '1. Similarity Index 2. Problems with Existing Solutions Existing tutoring platforms mainly connect students with tutors but do not analyze student weaknesses, learning styles, budget limitations, or academic performance before making recommendations. Most platforms also lack localized support and personalized study planning. 3. Your Approach The proposed system will use Artificial Intelligence and Machine Learning algorithms to analyze student performance data and recommend tutors according to the student''s academic weaknesses, preferred learning style, budget, and location. The system will also generate personalized study plans and monitor progress over time. Learning 1. Technologies to be Used a. React / Flutter for frontend development b. Node.js / Django for backend development c. Pyt',
  'Education & EdTech',
  'Higher Education',
  ': Students and parents often select tutors randomly without proper academic analysis, leading to poor educational outcomes and wasted time and money. 5. Major Functionality a. AI-based tutor recommendation system b. Student performance and weak subject analysis c. Personalized study planner and reminders d. Progress tracking and analytics dashboard 6. Targeted Users • School and college students • Parents • Tutors and academies • Educational institutions 7. Domain/Research Area ✓ Artificial Intelligence (AI), Machine Learning (ML), and Deep Learning ✓ Web Development ✓ Mobile Application Development ✓ Data Science & Big Data Background 1. Similarity Index 2. Problems with Existing Solutions Existing tutoring platforms mainly connect students with tutors but do not analyze student weaknesse',
  'The proposed system will use Artificial Intelligence and Machine Learning algorithms to analyze student performance data and recommend tutors according to the student''s academic weaknesses, preferred learning style, budget, and location. The system will also generate personalized study plans and monitor progress over time. Learning 1. Technologies to be Used a. React / Flutter for frontend development b. Node.js / Django for backend development c. Python and Scikit-learn for AI model development 2. Skill to Learn During Project Building and training recommendation systems using Machine Learning algorithms and implementing AI-based educational analytics. SAP ID | Student Name | Email Address 70135427 | Ramish Iqbal | 70135427@student.uol.edu.pk 70136956 | Hussnain murtaza | 70136956@studen',
  'AI tutor matching; weak-subject analysis; personalized study planner',
  'ML-driven tutor recommendation using performance, budget, and location constraints',
  'Students, parents, and private tutors seeking matched tuition arrangements',
  'Improved tutor-student matching, better academic outcomes, and reduced wasted tuition spending',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'AI Smart Tuition Recommendation System'
);

-- Source: Final year project.pdf
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'ScholarIQ — AI Scholarship Recommendation Platform',
  'React.js, Bootstrap 5, Python, FastAPI, PostgreSQL',
  's',
  'Education & EdTech',
  'Higher Education',
  'Students across the world struggle to find genuine and relevant scholarships. Information is often scattered across various websites, outdated, or even fraudulent. Many students miss important deadlines or apply to irrelevant opportunities due to the lack of a centralized, smart platform. The absence of real-time tracking, personalization, and AI-driven tools leads to inefficiencies and missed academic opportunities. Targeted Audience 1. Students seeking international undergraduate or postgraduate scholarships 2. Students from developing countries (e.g., Pakistan, India, Nigeria, Egypt, etc.) 3. Academic counselors and advisors 4. NGOs and educational platforms supporting global education access Scientific Area / Project Type  Artificial Intelligence (AI)  Web Development  Recommender Systems  Natural Language Processing (NLP)  Educational Technology (EdTech) References (Websites & Tools)  ScholarshipsAds.com  OpportunityDesk.org  DAAD.de  Erasmus+  OpenAI  Twilio',
  'An AI-powered web platform that recommends genuine international scholarships based on academic profile, nationality, and goals, with deadline alerts and fraud filtering.',
  'Profile-based scholarship matching; deadline alerts; fraud filtering',
  'Centralized intelligent scholarship discovery instead of scattered manual search',
  'International students seeking scholarships',
  '',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'ScholarIQ — AI Scholarship Recommendation Platform'
);

-- Source: Proposal CareerCraft V2.pdf
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'CareerCraft AI — Intelligent Interview and Resume Mastery Platform',
  'Python, TensorFlow, PyTorch, OpenCV, spaCy, NLTK, Flutter, Node.js',
  'CareerCraft AI provides AI interview simulation, resume ATS optimization, and communication feedback for job seekers.',
  'Career & Employment',
  'Career Services',
  'Job seekers lack realistic interview practice, personalized resume feedback, and communication coaching beyond generic online resources.',
  'Build an AI platform with adaptive mock interviews, resume optimization, skill-gap detection, and progress dashboards for students and professionals.',
  'AI mock interviews; ATS resume scoring; verbal and non-verbal feedback',
  'Holistic career readiness combining NLP interview analysis and resume optimization',
  'University students, graduates, and career-switching professionals',
  '',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'CareerCraft AI — Intelligent Interview and Resume Mastery Platform'
);

-- Source: ahad CipherPlay_Proposal.pdf
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 2),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'CipherPlay — AI-Powered Children''s Indoor Fitness Game',
  'Python, YOLO, Android, PyTorch, OpenCV',
  'CipherPlay is a mobile game that combines real-time YOLO object detection with physical movement challenges for children aged 4–14, turning screen time into indoor physical activity under parental supervision.',
  'Gaming & Entertainment',
  'Entertainment',
  'Children aged 4–14 average high daily passive screen time, leading to sedentary behaviour and reduced physical activity. Existing mobile games provide entertainment but fail to bridge screen time with physical engagement indoors.',
  'Build an Android application using on-device YOLO object detection, adaptive gameplay tied to detected objects, and physical entropy-based encryption for secure in-game rewards.',
  'On-device YOLO detection; physical entropy encryption; indoor-safe gameplay without GPS',
  'Applies YOLO object detection and true random encryption to children''s indoor fitness gaming — a combination not present in mainstream AR outdoor games.',
  'Children aged 4–14 and parents seeking active screen-time alternatives',
  'A functional Android app combining real-time AI object detection, adaptive gameplay, and hardware-backed encryption to promote physical activity.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'CipherPlay — AI-Powered Children''s Indoor Fitness Game'
);

-- Source: qaiser11 fyp perposol.pdf
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  'AI-Powered Career Coaching and Job Preparation Platform',
  'Next.js, Gemini API, WebRTC, Vapi, Clerk, Prisma, PostgreSQL',
  'A unified career platform for resume building, cover letter generation, and AI mock interviews using modern web and voice AI stack.',
  'Career & Employment',
  'Career Services',
  'Job preparation is fragmented across separate tools for resumes, cover letters, and interviews, producing generic results for candidates.',
  'Integrate resume rewriting, tailored cover letters, dynamic interview question banks, and voice-based mock interviews in a single Next.js application.',
  'Resume builder; cover letter generator; voice mock interviews',
  'Single platform replacing fragmented career prep tools with AI personalization',
  'Students, fresh graduates, and career switchers',
  'Higher-quality applications and interview readiness through personalized AI coaching',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = 'AI-Powered Career Coaching and Job Preparation Platform'
);

COMMIT;
