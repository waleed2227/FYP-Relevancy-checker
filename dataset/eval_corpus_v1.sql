-- Evaluation corpus v1 import
-- Run from repo root:
--   psql -U postgres -d fyp_relevancy_system -f dataset/eval_corpus_v1.sql
BEGIN;

-- Re-import cleanup (optional):
-- DELETE FROM project_ideas WHERE title LIKE '[EVAL-%';

-- EVAL-U01 | group=unrelated
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-U01] Drone-Based Crop Disease Detection for Smallholder Farms',
  'Python, TensorFlow, DJI SDK, OpenCV, Flask',
  'A computer-vision system that uses drone imagery to detect early signs of crop disease in wheat and rice fields, helping farmers reduce yield loss through timely intervention.',
  'Agriculture',
  'Agriculture',
  'Smallholder farmers in Pakistan often identify crop disease too late because field inspection is manual, slow, and covers large areas inconsistently. Late detection leads to pesticide overuse, yield loss, and food insecurity in rural communities.',
  'Deploy low-cost drones to capture multispectral field images, run a trained CNN classifier to flag diseased crop patches on a map, and send SMS alerts to farmers and agricultural extension officers with recommended treatment steps.',
  'Offline inference on edge devices for areas with poor connectivity; Urdu voice alerts; integration with local pesticide suppliers for treatment routing.',
  'Combines affordable drone hardware with a disease model tuned on South Asian crop varieties rather than generic ImageNet datasets, improving accuracy for local farming conditions.',
  'Smallholder farmers, agricultural extension workers, and rural cooperatives in Punjab and Sindh.',
  'Reduce crop loss by enabling early disease detection across large fields, lowering input costs and improving food security for rural communities.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-U01] Drone-Based Crop Disease Detection for Smallholder Farms'
);

-- EVAL-U02 | group=unrelated
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-U02] Blockchain Peer-to-Peer Renewable Energy Trading Platform',
  'Solidity, Ethereum, React, Node.js, Web3.js, IPFS',
  'A decentralized marketplace where households with solar panels can sell surplus electricity directly to neighbors using smart contracts and transparent ledger records.',
  'Energy & Utilities',
  'Energy & Utilities',
  'Homeowners with rooftop solar cannot easily sell excess energy to neighbors because utility billing systems are centralized, opaque, and lack peer-to-peer settlement mechanisms.',
  'Build a blockchain-based energy trading platform where smart meters report generation and consumption, smart contracts settle micro-payments, and participants view tamper-proof transaction history on a web dashboard.',
  'Micro-payment settlement in local currency tokens; dispute resolution workflow; carbon credit tracking for traded renewable units.',
  'Applies blockchain transparency to household-scale energy markets rather than industrial grid trading, enabling community-level renewable adoption.',
  'Residential solar owners, apartment communities, and municipal energy cooperatives.',
  'Increase renewable energy utilization and reduce grid dependency by enabling trusted neighbor-to-neighbor electricity exchange.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-U02] Blockchain Peer-to-Peer Renewable Energy Trading Platform'
);

-- EVAL-U03 | group=unrelated
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 2),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-U03] Real-Time Sign Language Interpreter for Video Conferencing',
  'Python, MediaPipe, TensorFlow, WebRTC, React, FastAPI',
  'A video-call plugin that recognizes Pakistani Sign Language gestures in real time and displays translated text for hearing participants during online meetings and lectures.',
  'Accessibility & EdTech',
  'Accessibility & EdTech',
  'Deaf and hard-of-hearing students face exclusion from online classes because video platforms lack accurate, low-latency sign language interpretation tailored to regional signing vocabularies.',
  'Capture webcam video, detect hand and body landmarks, classify sign sequences with a temporal neural model trained on regional signs, and overlay live captions for all meeting participants.',
  'Support for Pakistan Sign Language variants; speaker-aware caption placement; lecture recording with searchable sign transcripts.',
  'Focuses on regional sign vocabularies and classroom video latency constraints rather than generic gesture recognition demos.',
  'Deaf and hard-of-hearing university students, accessibility offices, and online educators.',
  'Improve inclusive participation in hybrid and online education by providing affordable real-time sign interpretation.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-U03] Real-Time Sign Language Interpreter for Video Conferencing'
);

-- EVAL-U04 | group=unrelated
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-U04] Phishing Email Detection System for Small Business Networks',
  'Python, Scikit-learn, NLP, SpamAssassin API, Docker, PostgreSQL',
  'An email gateway add-on that analyzes inbound messages for phishing indicators and quarantines suspicious emails before they reach employee inboxes at small and medium enterprises.',
  'Cybersecurity',
  'Cybersecurity',
  'SMEs lack affordable security tooling and suffer frequent phishing attacks because employees cannot distinguish spoofed emails from legitimate vendor and payroll messages.',
  'Parse email headers, links, and body text; score messages with an ensemble of NLP features and known threat patterns; quarantine high-risk mail and notify administrators with explainable reasons.',
  'Explainable quarantine reports in plain English; weekly threat digest; allow-list workflow for trusted senders.',
  'Targets SME constraints with lightweight deployment and explainable alerts rather than enterprise SOC tooling.',
  'IT administrators and employees at small and medium businesses with limited security staff.',
  'Reduce successful phishing incidents and data breaches for SMEs through automated pre-inbox filtering.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-U04] Phishing Email Detection System for Small Business Networks'
);

-- EVAL-U05 | group=unrelated
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-U05] Adaptive O-Level Mathematics Practice Platform',
  'React, Node.js, MongoDB, Python, Item Response Theory libraries',
  'A web platform that generates personalized mathematics practice sets for O-Level students based on skill gaps identified from quiz performance and syllabus topic mastery.',
  'Education',
  'Education',
  'O-Level students use generic question banks that do not adapt to individual weaknesses, causing repeated study of mastered topics while weak areas remain unaddressed before examinations.',
  'Track student responses per syllabus topic, estimate ability with item response models, and dynamically select the next question set targeting the lowest mastery areas with spaced repetition.',
  'Syllabus-aligned topic graph for Cambridge O-Level Math; teacher dashboard for class-level gap analysis; bilingual English/Urdu explanations.',
  'Applies adaptive testing theory to local O-Level syllabus structures rather than generic multiple-choice apps.',
  'O-Level students, private tutors, and secondary school mathematics teachers.',
  'Improve exam readiness by concentrating practice time on each student''s weakest syllabus topics.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-U05] Adaptive O-Level Mathematics Practice Platform'
);

-- EVAL-S01 | group=similar_domain
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 2),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-S01] Hospital Outpatient Queue and Appointment Management System',
  'React, FastAPI, PostgreSQL, Redis, SMS Gateway',
  'A digital queue system for hospital outpatient departments that lets patients book slots, receive wait-time updates, and reduces overcrowding in reception areas.',
  'Healthcare',
  'Healthcare',
  'Public hospital outpatient departments suffer long unpredictable waits because appointment scheduling is paper-based and staff cannot forecast queue length across clinics.',
  'Provide online appointment booking, digital check-in kiosks, real-time queue position updates via SMS, and a staff dashboard showing clinic load and average wait times.',
  'Walk-in and appointment blended queues; priority lane for elderly and emergency referrals; daily clinic load analytics.',
  'Optimizes queue flow with predictive wait estimates using historical clinic throughput rather than static ticket numbers alone.',
  'Outpatients, hospital reception staff, and clinic administrators at public hospitals.',
  'Reduce patient wait times and reception congestion while improving clinic scheduling visibility.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-S01] Hospital Outpatient Queue and Appointment Management System'
);

-- EVAL-S02 | group=similar_domain
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-S02] AI Symptom Triage Chatbot for Rural Telehealth Centers',
  'Python, FastAPI, LLM API, React, PostgreSQL, Twilio',
  'A conversational triage assistant that helps rural health workers classify patient symptoms and recommend whether to treat locally, refer, or escalate to a physician.',
  'Healthcare',
  'Healthcare',
  'Rural telehealth centers lack on-site specialists, so health workers must decide referral urgency without structured decision support, delaying critical cases.',
  'Guide workers through structured symptom questionnaires, map responses to triage categories with a rules-plus-ML hybrid engine, and generate referral recommendations with documented rationale.',
  'Offline-first questionnaire mode; Urdu voice input; audit log for medico-legal traceability.',
  'Combines clinical triage protocols with low-bandwidth deployment suitable for rural clinic infrastructure.',
  'Community health workers, rural clinic nurses, and telehealth coordinators.',
  'Improve referral accuracy and reduce delays for high-risk patients in underserved areas.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-S02] AI Symptom Triage Chatbot for Rural Telehealth Centers'
);

-- EVAL-S03 | group=similar_domain
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-S03] AI-Assisted Radiology Report Summarization for Junior Doctors',
  'Python, PyTorch, Hugging Face Transformers, FastAPI, DICOM libraries',
  'A tool that converts lengthy radiology scan reports into concise summaries highlighting critical findings for junior doctors reviewing cases during ward rounds.',
  'Healthcare',
  'Healthcare',
  'Junior doctors spend excessive time parsing verbose radiology reports under time pressure, increasing the risk of missing critical findings during patient handoffs.',
  'Ingest structured and free-text radiology reports, extract key findings with a fine-tuned summarization model, and present bullet-point summaries with severity flags on a secure web viewer.',
  'Critical-finding highlight mode; comparison with prior scan summaries; export to ward round notes.',
  'Tailors summarization to radiology lexicon and ward-round urgency rather than generic abstractive summarization.',
  'Junior doctors, radiology residents, and hospital ward teams.',
  'Accelerate clinical decision-making and reduce missed findings during high-volume rounds.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-S03] AI-Assisted Radiology Report Summarization for Junior Doctors'
);

-- EVAL-S04 | group=similar_domain
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 2),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-S04] Medication Adherence Reminder and Tracking App for Chronic Patients',
  'Flutter, Firebase, Node.js, PostgreSQL, Push Notifications',
  'A mobile application that sends personalized medication reminders, logs adherence, and shares summary reports with caregivers and physicians for chronic disease management.',
  'Healthcare',
  'Healthcare',
  'Patients with hypertension and diabetes frequently miss doses because paper pill charts are forgotten and physicians lack visibility into real-world adherence between visits.',
  'Schedule smart reminders based on prescription timing, confirm intake with one-tap logging, detect missed-dose patterns, and generate adherence reports for clinic follow-ups.',
  'Caregiver notification mode; drug interaction warnings; clinic portal for physician review.',
  'Links patient-facing reminders with clinician-facing adherence analytics in a single low-cost mobile workflow.',
  'Chronic disease patients, family caregivers, and primary care physicians.',
  'Improve treatment outcomes by increasing medication adherence and enabling data-informed follow-up care.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-S04] Medication Adherence Reminder and Tracking App for Chronic Patients'
);

-- EVAL-S05 | group=similar_domain
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-S05] Emergency Blood Donor Matching and Hospital Alert System',
  'React, FastAPI, PostgreSQL, Redis, SMS, Geolocation APIs',
  'A platform that matches emergency blood requests from hospitals with registered donors by blood type and proximity, sending urgent alerts to eligible volunteers.',
  'Healthcare',
  'Healthcare',
  'Hospitals struggle to locate compatible blood donors quickly during emergencies because donor lists are fragmented and outreach is manual via phone chains.',
  'Maintain a verified donor registry, publish hospital blood requests with urgency levels, notify matching donors by SMS and app push, and track response rates for logistics staff.',
  'Geo-radius donor search; donor availability calendar; hospital verification workflow.',
  'Real-time geo-matched donor alerting integrated with hospital blood bank dashboards rather than static donor directories.',
  'Hospital blood banks, registered blood donors, and emergency response coordinators.',
  'Reduce blood shortage delays during emergencies and improve coordination between donors and hospitals.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-S05] Emergency Blood Donor Matching and Hospital Alert System'
);

-- EVAL-P1A | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P1A] AI-Based Final Year Project Relevancy and Originality Checker',
  'Python, FastAPI, PostgreSQL, Scikit-learn, Sentence Transformers, React',
  'A university platform that evaluates FYP proposals for topical fit, innovation, and similarity to prior submissions to help supervisors and students improve project quality before approval.',
  'Higher Education',
  'Higher Education',
  'Universities receive hundreds of FYP proposals annually and lack scalable tools to detect overlap with existing ideas or assess whether a topic is suitable for final-year scope and learning outcomes.',
  'Collect structured proposal fields, compute relevancy and similarity scores against a corpus of past projects, flag potential duplicates, and present explainable feedback to students and reviewers.',
  'Weighted field analysis; duplicate risk scoring; role-based dashboards for students, professors, and administrators.',
  'Combines lexical and semantic similarity with structured proposal metadata rather than relying on title-only plagiarism checks.',
  'Final-year students, FYP supervisors, and department approval committees.',
  'Improve proposal quality, reduce duplicate project topics, and accelerate supervisor review workflows.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P1A] AI-Based Final Year Project Relevancy and Originality Checker'
);

-- EVAL-P1B | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 2),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P1B] Intelligent Academic Capstone Proposal Assessment Platform',
  'Python, FastAPI, PostgreSQL, NLP, Transformer Embeddings, React',
  'An institutional system that scores senior-year project pitches for alignment with program outcomes, distinctiveness, and overlap with previously approved capstone work.',
  'Higher Education',
  'Higher Education',
  'Faculty committees cannot manually compare each new capstone pitch against the full history of approved work, so repetitive topics and weak scope boundaries pass through undetected.',
  'Ingest multi-section pitch documents, embed them semantically, compare against archived submissions, produce originality and fit scores, and surface reviewer-ready summaries.',
  'Committee review queue; semantic duplicate alerts; student resubmission tracking after revision.',
  'Uses semantic document embeddings over structured pitch sections instead of keyword-only duplicate checks on project titles.',
  'Undergraduate students submitting capstone pitches, faculty advisors, and accreditation review staff.',
  'Raise capstone topic quality and give committees consistent, auditable assessment support at scale.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P1B] Intelligent Academic Capstone Proposal Assessment Platform'
);

-- EVAL-P2A | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P2A] Smart Waste Management System Using IoT Sensors and AI Routing',
  'Arduino, IoT, Python, TensorFlow, MQTT, React, PostgreSQL',
  'An IoT-enabled waste management solution that monitors bin fill levels and optimizes collection routes for municipal sanitation teams using predictive analytics.',
  'Smart Cities & Environment',
  'Smart Cities & Environment',
  'City waste collection follows fixed schedules regardless of bin capacity, causing overflow in busy areas and wasted fuel where bins are empty.',
  'Install ultrasonic fill sensors in public bins, transmit levels to a cloud dashboard, predict overflow risk, and generate dynamic collection routes for sanitation crews.',
  'Overflow heatmaps; fuel-saving route optimization; citizen reporting for illegal dumping hotspots.',
  'Integrates low-cost IoT sensing with route optimization tuned for dense urban neighborhoods rather than landfill-scale logistics alone.',
  'Municipal sanitation departments, city operations managers, and urban residents.',
  'Reduce overflow incidents, lower collection costs, and improve urban cleanliness through data-driven routing.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P2A] Smart Waste Management System Using IoT Sensors and AI Routing'
);

-- EVAL-P2B | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P2B] IoT-Enabled Intelligent Municipal Garbage Collection Optimizer',
  'Raspberry Pi, Sensors, Python, Machine Learning, LoRaWAN, Vue.js',
  'A connected sanitation platform that tracks public bin capacity in real time and recommends efficient pickup paths for city waste disposal fleets.',
  'Smart Cities & Environment',
  'Smart Cities & Environment',
  'Municipal garbage trucks operate on rigid timetables that ignore actual bin fullness, leading to street-side overflow and unnecessary trips to partially empty containers.',
  'Deploy capacity sensors on street bins, stream telemetry to a central platform, forecast fill rates, and dispatch crews along optimized paths based on urgency scores.',
  'Neighborhood-level fill forecasting; crew mobile app with turn-by-turn routes; landfill drop-off scheduling integration.',
  'Applies predictive fill modeling to street-level bins for emerging-market cities with limited smart infrastructure budgets.',
  'City waste operations teams, fleet supervisors, and environmental compliance officers.',
  'Cut unnecessary collection trips and prevent public health issues from uncollected overflowing waste.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P2B] IoT-Enabled Intelligent Municipal Garbage Collection Optimizer'
);

-- EVAL-P3A | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 2),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P3A] Smart Campus Navigation System with Indoor and Outdoor Routing',
  'React Native, Firebase, Google Maps API, BLE Beacons, Node.js',
  'A mobile navigation application that helps university students find buildings, classrooms, and facilities across campus using GPS outdoors and beacon positioning indoors.',
  'Higher Education',
  'Higher Education',
  'New and visiting students struggle to locate lecture halls and administrative offices because campus maps are static PDFs without turn-by-turn guidance or room-level detail.',
  'Provide interactive maps, searchable points of interest, indoor beacon routing for multi-floor buildings, and event-aware directions during orientation weeks.',
  'Accessible routes avoiding stairs; real-time room availability from timetable integration; AR waypoint markers.',
  'Combines outdoor GPS with low-cost BLE indoor positioning tailored to a single university campus layout.',
  'University students, visitors, and campus facilities management staff.',
  'Reduce orientation confusion, improve punctuality, and enhance campus accessibility for all users.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P3A] Smart Campus Navigation System with Indoor and Outdoor Routing'
);

-- EVAL-P3B | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P3B] University Wayfinding Mobile App for Indoor and Outdoor Campus Travel',
  'Flutter, Google Maps, iBeacon, FastAPI, PostgreSQL',
  'A student-facing wayfinding tool that guides users from campus gates to specific rooms using outdoor maps plus indoor location beacons in faculty blocks.',
  'Higher Education',
  'Higher Education',
  'Campus newcomers waste time searching for departments and labs because signage is inconsistent and no digital tool offers room-level directions inside large buildings.',
  'Let users search destinations by building and room number, compute walking paths across outdoor quads, hand off to beacon navigation indoors, and save favorite locations.',
  'Offline map tiles for low connectivity zones; wheelchair-friendly path preference; integration with exam seating assignments.',
  'Unified outdoor-indoor routing graph built from campus CAD floor plans rather than separate standalone map apps.',
  'First-year undergraduates, exchange students, and campus event organizers.',
  'Help students reach classes and services faster while lowering front-desk wayfinding inquiries.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P3B] University Wayfinding Mobile App for Indoor and Outdoor Campus Travel'
);

-- EVAL-P4A | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P4A] Automated Classroom Attendance System Using Facial Recognition',
  'Python, OpenCV, Face Recognition, FastAPI, React, PostgreSQL',
  'A contactless attendance system that verifies student presence in lectures by matching faces against enrolled profiles captured from classroom cameras.',
  'Higher Education',
  'Higher Education',
  'Manual roll calls consume lecture time and are prone to proxy attendance, undermining academic integrity and accurate participation records.',
  'Capture classroom entry frames, detect and match faces to enrolled students, log timestamps automatically, and provide instructors with exception reports for review.',
  'Liveness detection to reduce photo spoofing; privacy-preserving local processing option; LMS gradebook export.',
  'Balances automated verification with instructor override workflows and on-premise processing for privacy-sensitive institutions.',
  'University lecturers, class representatives, and registrar offices tracking participation.',
  'Save lecture time, deter proxy attendance, and produce reliable participation analytics.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P4A] Automated Classroom Attendance System Using Facial Recognition'
);

-- EVAL-P4B | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 2),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P4B] Contactless Student Presence Verification for Lecture Halls',
  'Python, Deep Learning, Computer Vision, Django, PostgreSQL, Redis',
  'A vision-based presence logging system that identifies enrolled learners as they enter teaching rooms and records attendance without paper registers.',
  'Higher Education',
  'Higher Education',
  'Paper-based attendance registers are slow, falsifiable, and create administrative backlog when participation data is needed for exams and audits.',
  'Use ceiling-mounted cameras to recognize enrolled faces at entry, write attendance events to a secure database, and flag unmatched or duplicate entries for staff confirmation.',
  'GDPR-style consent workflow; anonymized audit trails; integration with university SSO.',
  'Focuses on lecture-hall deployment constraints including lighting variation and partial occlusion handling.',
  'Teaching faculty, department administrators, and students required to meet attendance policies.',
  'Improve integrity of attendance records while reducing administrative overhead in large classes.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P4B] Contactless Student Presence Verification for Lecture Halls'
);

-- EVAL-P5A | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P5A] AI Mental Health Chatbot for University Students',
  'Python, FastAPI, LLM, React, PostgreSQL, Sentiment Analysis',
  'A confidential chatbot that offers coping strategies, mood check-ins, and counselor escalation for students experiencing exam stress and anxiety.',
  'Higher Education',
  'Higher Education',
  'University counseling services are understaffed and students delay seeking help due to stigma, long wait times, and lack of after-hours support.',
  'Provide 24/7 conversational support with evidence-based coping prompts, track mood trends, detect crisis language, and route urgent cases to human counselors.',
  'Anonymous mode; counselor handoff with conversation summary; culturally adapted response templates.',
  'Combines crisis detection guardrails with student-friendly UX designed for South Asian mental health stigma contexts.',
  'Undergraduate and postgraduate students, university counseling centers.',
  'Increase early help-seeking behavior and reduce counselor workload for routine check-ins.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P5A] AI Mental Health Chatbot for University Students'
);

-- EVAL-P5B | group=paraphrase_pair
INSERT INTO project_ideas (
  student_id, professor_id, title, technologies, description,
  category, target_industry, problem_statement, proposed_solution,
  unique_features, innovation_aspect, target_users, expected_impact,
  professor_email, status, submitted_date
) SELECT
  (SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 1),
  (SELECT p.id FROM professors p JOIN users u ON u.id = p.user_id WHERE u.email = 'professor@uol.edu.pk' LIMIT 1),
  '[EVAL-P5B] Conversational Wellbeing Support Assistant for Higher Education Students',
  'Node.js, Python, NLP, React Native, MongoDB, Crisis Hotline API',
  'A mobile wellbeing companion that conducts daily mood surveys, suggests stress-management exercises, and connects students to professional support when needed.',
  'Higher Education',
  'Higher Education',
  'Many students experience burnout and isolation but do not access campus wellbeing services because appointments are scarce and informal support is unavailable overnight.',
  'Deliver guided conversational check-ins, personalize self-help content from mood history, monitor risk phrases, and initiate warm handoffs to licensed counselors.',
  'Peer-support resource library; exam-period stress modules; privacy-first data retention controls.',
  'Integrates proactive mood tracking with escalation pathways rather than static self-help article repositories.',
  'College students, student affairs offices, and campus wellbeing counselors.',
  'Expand access to early emotional support and help universities identify population-level stress trends.',
  'professor@uol.edu.pk',
  'PENDING',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM project_ideas WHERE title = '[EVAL-P5B] Conversational Wellbeing Support Assistant for Higher Education Students'
);

COMMIT;

-- After import: run relevancy analysis via API or backfill script.