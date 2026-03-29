OFTWARE REQUIREMENTS SPECIFICATION (SRS)
Project Title:

Aprender Jugando – Aplicativo Móvil Educativo para Insulinoterapia

1. Introduction
1.1 Purpose

This document defines the functional and non-functional requirements for the development of a mobile educational application aimed at supporting insulin therapy education in patients with Diabetes Mellitus.

The system will be developed using React Native, targeting Android and iOS platforms.

This SRS serves as:

A contractual reference for development
A validation baseline
A usability and evaluation framework
A foundation for future scalability
1.2 Scope

The application is an educational and behavioral support tool, not a diagnostic or medical decision-making system.

The system will:

Provide structured educational content about insulin therapy
Debunk myths and negative perceptions
Teach safe injection techniques
Promote adherence through gamification
Reinforce learning via microlearning modules
Provide progress tracking

The application will NOT:

Calculate medical insulin doses
Replace medical consultation
Integrate with electronic health records
Provide real-time telemedicine
1.3 Intended Audience
Developers
UI/UX Designers
Academic evaluators
Healthcare validators
Project supervisors
Future scalability stakeholders
1.4 Definitions
Term	Definition
DM	Diabetes Mellitus
Insulinotherapy	Exogenous insulin treatment
DSMES	Diabetes Self-Management Education and Support
MVP	Minimum Viable Product
mHealth	Mobile health technologies
Microlearning	Short structured learning units
Gamification	Application of game mechanics to non-game contexts
2. Overall Description
2.1 Product Perspective

The application is a standalone mobile system developed with:

JavaScript
Component-based architecture
Native UI rendering through React Native bridge

It follows:

DSMES framework
Behavioral science principles
Design Thinking
PMBOK 7 value-oriented principles
2.2 Product Functions (High-Level)

The system shall:

Deliver structured insulin therapy educational modules
Provide interactive microlearning content
Include gamification elements (progress, streaks, rewards)
Debunk myths via interactive activities
Track educational progress
Display reminders for learning continuity
Provide a digital consent process
Store minimal user data securely
2.3 User Classes
1. Primary User – Patient
Adults with Type 1 or Type 2 Diabetes
Beginner to intermediate insulin users
Medium to low health literacy
2. Secondary User – Caregiver
Family members assisting in insulin administration
3. Validator – Healthcare Professional
Evaluates content accuracy
Participates in usability evaluation
2.4 Operating Environment
Android 8.0+
iOS 13+
Developed in React Native
Offline-first architecture (educational modules cached locally)
2.5 Constraints
Compliance with:
Ley 1581 de 2012
Ley 1751 de 2015
Ley 23 de 1982
MVP scope only
No cloud-based EHR integration
No AI medical dosage algorithms
2.6 Assumptions
Users possess a smartphone
Users have basic digital literacy
Content validated by healthcare professional
Internet required only for updates
3. Functional Requirements
3.1 User Registration and Consent
FR-01 Digital Consent

The system shall display a mandatory consent form explaining:

Educational purpose
Non-replacement of medical advice
Data collection policies

User must accept before proceeding.

FR-02 User Profile (Optional Minimal Data)

The system may collect:

Nickname
Age range (optional)
Type of diabetes (optional)

No clinical data shall be required.

3.2 Educational Modules
FR-03 Structured Learning Modules

The system shall provide modules including:

What is insulin?
Types of insulin
Safe injection technique
Injection site rotation
Storage of insulin
Myths and misconceptions
Hypoglycemia basics (educational only)
FR-04 Microlearning Unlock System

Modules shall unlock progressively after:

Completing previous module
Passing interactive activity
FR-05 Multimedia Content

The system shall support:

Infographics
Illustrations
Short animations
Interactive quizzes
3.3 Gamification
FR-06 Points System

Users shall earn points after:

Completing modules
Correct quiz answers
Daily learning streak
FR-07 Streak Tracking

System shall track consecutive days of usage.

FR-08 Achievement Badges

System shall display milestone achievements.

3.4 Myth Debunking Module
FR-09 Interactive Myth Resolution

Users shall:

Select myth statements
Review scientific explanation
Complete comprehension activity
3.5 Behavioral Support
FR-10 Encouragement Messaging

System shall display motivational feedback after:

Module completion
Correct answers
Maintaining streak
3.6 Usability Evaluation Module (Research Phase Only)
FR-11 Survey Integration

The system shall integrate a usability survey using:

Likert-scale questions
Structured feedback

Data exported for analysis.

3.7 Data Storage
FR-12 Local Storage

User progress shall be stored locally using secure device storage.

FR-13 Data Minimization

System shall not collect:

Glucose values
Insulin doses
Medical records
3.8 Legal Compliance
FR-14 Legal Disclaimer Reminder

System shall periodically remind user:

"This application does not replace medical consultation."

4. Non-Functional Requirements
4.1 Usability
Simple navigation
Large touch targets
Reading level adapted to general population
Spanish native language
Accessible color contrast
4.2 Performance
App launch time < 3 seconds
Screen transitions < 1 second
Offline module access
4.3 Security
Encrypted local storage
No transmission of sensitive health data
Secure update mechanism
4.4 Reliability
Crash rate < 2%
State persistence across sessions
4.5 Maintainability
Modular component architecture
Reusable React components
Clean separation between:
UI
Content
Gamification logic
4.6 Scalability (Future)

Architecture shall allow:

Future CGM integration
Future tele-education modules
Future AI-based personalization
5. System Architecture
5.1 Architectural Pattern

Component-Based Architecture (React paradigm)

Layers:

Presentation Layer (UI Components)
Business Logic Layer
Local Storage Layer
Content Engine Layer
5.2 Core Modules
Authentication & Consent Module
Educational Content Engine
Gamification Engine
Progress Tracker
Survey & Evaluation Module
6. User Interface Requirements
6.1 Design Principles
Design Thinking
Empathy-centered design
Low cognitive load
Visual guidance
6.2 Navigation Structure

Home
→ Learning Modules
→ Myth Busters
→ Progress Dashboard
→ Profile
→ Legal & About

7. Ethical & Safety Requirements

The system must enforce:

Privacy by design
Evidence-based content
Cultural adaptability
No substitution of standard of care
8. Acceptance Criteria

The MVP shall be considered successful if:

All core modules functional
Educational flow operational
Gamification working
Survey implemented
Legal compliance screens active
Usability rating ≥ 4/5 (Likert scale average)
9. Future Expansion Roadmap

Phase 2 may include:

Adaptive personalization
Glucose tracking integration
Clinician dashboard
AI behavioral nudges
Institutional deployment
10. Deliverables
React Native MVP
UI/UX design documentation
Educational content documentation
Usability evaluation report
Legal compliance checklist
Final academic documentation