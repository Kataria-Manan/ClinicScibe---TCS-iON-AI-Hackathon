# ClinicScribe Voice Notes: Rapid PHC Clinical Documentation & Prescription Engine

ClinicScribe Voice Notes is a high-speed, mobile-and-tablet-first web application designed for Primary Health Centre (PHC) doctors and Medical Officers in high-volume outpatient clinics (2–3 minutes per patient). It enables hands-free voice dictation, instant clinical rule-based parsing, one-tap template checklists, 1-page bilingual printable prescription slips, and automated daily OPD epidemiological reporting—all operating with a zero-rupee infrastructure budget.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions have been confirmed based on your requirements and budget specification:

- **Confirmed Speech Recognition Engine**: Native browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for 100% free, real-time continuous dictation in Indian English (`en-IN`) and Hindi (`hi-IN`), with on-device fallback and simulation dictation audio clips for devices with restricted mic permissions.
- **Confirmed Clinical Specialty Templates**: All 5 core outpatient consultation templates will be implemented:
  1. *Fever & Acute Infection* (malaria/dengue/typhoid suspect, URTI, duration tracking, vitals alert)
  2. *Hypertension & Diabetes Follow-up* (BP/sugar tracking, adherence, lifestyle & dosage escalation)
  3. *Antenatal Care (ANC)* (gestational age, fundal height, tetanus toxoid, iron/folic acid, red flags)
  4. *Child with Cough & Diarrhea* (IMNCI signs, hydration status, ORS/Zinc, chest indrawing checks)
  5. *General Adult OPD* (with customizable quick-symptom, diagnosis, and treatment tags)
- **Confirmed Prescription & Summary Output Modes**: Dual output format:
  1. *Printable 1-Page Indian PHC OPD Prescription Slip*: Standardized government-style prescription layout (clinic header, Rx medications, investigations, warning signs, follow-up date) ready for browser printing or PDF saving.
  2. *Digital Summary Card with One-Tap WhatsApp/SMS Text Copy*: Formatted, patient-friendly plain text summary that doctors or nurses can copy or dispatch via WhatsApp in one tap.
- **Confirmed Zero-Rupee Tech Stack**: Client React 19 + TypeScript + Tailwind CSS, browser Web Speech API, offline IndexedDB/LocalStorage for persistent records, and server-side Gemini 2.5 Flash proxy (using included AI Studio quota) for enhanced SOAP clinical extraction.

---

## 1. Overview & Core Concept

### What It Does
ClinicScribe captures a doctor's spoken notes during or immediately following a 2-minute OPD consultation. It continuously transcribes speech in real time, applies an intelligent rule engine (detecting cue phrases like *"chief complaint"*, *"on examination"*, *"impression"*, *"plan"*) to categorize findings into structured clinical fields, lets doctors enhance notes with one-tap rapid checklists, and immediately generates both a printable 1-page patient prescription slip and an automated daily OPD epidemiology summary.

### Target Audience & Persona
- **Primary**: PHC Medical Officers and rural health clinic doctors handling 60–100 patients per OPD session.
- **Secondary**: Staff Nurses & Auxiliary Nurse Midwives (ANMs) verifying treatment orders, and patients receiving clear printed advice.
- **Tertiary**: Block/District Medical Health Officers extracting disease surveillance statistics (e.g. fever spikes, hypertension registry).

### Key Value Delivered
- Eliminates manual double-entry into paper OPD registers.
- Reduces post-consultation documentation time from 3–5 minutes down to under 45 seconds.
- Guarantees zero recurring software licensing or cloud API costs.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│ 1. Clinic & OPD │ ──> │ 2. Quick Patient Reg  │ ──> │ 3. Real-Time Dictate  │
│    Setup        │     │    (New / Follow-up)  │     │    or Audio Waveform  │
└─────────────────┘     └───────────────────────┘     └───────────────────────┘
                                                                  │
                                                                  ▼
┌─────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│ 6. OPD Registry │ <── │ 5. 1-Page Slip Print  │ <── │ 4. Rules Parsing &    │
│    & Reporting  │     │    & WhatsApp Share   │     │    1-Tap Checklists   │
└─────────────────┘     └───────────────────────┘     └───────────────────────┘
```

1. **Facility & Shift Start**: Doctor selects facility name (e.g., *PHC Rampur - General OPD*), doctor name, and default clinic mode.
2. **Patient Queue / Registration**: Minimal 10-second entry (OPD Slip #, Patient Name, Age, Gender, Visit Type: New vs Follow-up). Quick-search bar to load previous visit history for returning patients.
3. **Voice Consultation Desk**:
   - Prominent microphone toggle with pulsating wave animation and live interim transcript stream.
   - Live cue hints showing medical landmarks: *"Chief complaint..."*, *"History..."*, *"Vitals/Exam..."*, *"Diagnosis..."*, *"Rx..."*.
   - Quick-toggle for Indian English (`en-IN`) and Hindi (`hi-IN`).
4. **Structured Review & One-Tap Checklists**:
   - Interactive segmented cards for Chief Complaint, History, Examination/Vitals, Impression/Diagnosis, and Plan/Rx.
   - Template-specific checklist drawer: tapping symptoms (e.g., *"High grade with chills"*, *"No hemoptysis"*) or standard medications (e.g., *"Paracetamol 500mg TDS x 3d"*, *"ORS + Zinc 20mg x 14d"*) automatically appends to the structured note.
5. **Confirmation & Dual Output**:
   - Single-page OPD prescription preview formatted for standard A4/A5 print.
   - WhatsApp/SMS summary card with quick copy button.
6. **OPD Surveillance & Analytics**:
   - Top morbidities bar chart, daily patient count, age/gender demographics, and 1-click CSV/JSON export for National Health Mission (NHM) HMIS reporting.

### Visual Identity & Theme
- **Aesthetic Direction**: Clean, authoritative, utilitarian clinical dashboard engineered for high legibility under harsh clinic fluorescent lighting and glare-prone tablet screens.
- **Color Palette (60-30-10 Rule)**:
  - *Canvas (60%)*: Crisp surgical white (`#FFFFFF`) / calm slate neutral (`#F8FAFC`) with dark mode support (`#0F172A`).
  - *Structural Surfaces (30%)*: Bordered medical cards with hairline dividers (`#E2E8F0` / dark: `#1E293B`), subtle medical teal/emerald accents for clinical stability.
  - *Accent Budget (10%)*: Deep clinical sapphire (`#0284C7` / `#0369A1`) for primary actions; coral amber (`#F59E0B`) for critical alerts/vitals warnings.
- **Typography**:
  - Display & Headings: `Plus Jakarta Sans` for clean, modern clinical legibility.
  - Body & Form Fields: `Plus Jakarta Sans` / `DM Sans` with high contrast.
  - Vitals & Quantitative Metrics: `JetBrains Mono` / tabular numerals (`tabular-nums`) for blood pressure, pulse, temperature, and dosages.
- **Ergonomics & Touch Targets**:
  - Minimum 48px touch targets for mobile/tablet thumbs.
  - Sticky bottom action bar during active consultation with primary *"Stop & Process Note"* button.

---

## 3. Key Product Decisions & Trade-Offs

### 1. Dual Speech Engine Architecture (Web Speech API + Simulation Fallback)
- **Chosen Approach**: Use the W3C standard `webkitSpeechRecognition` / `SpeechRecognition` API running entirely on-device inside modern browsers.
- **Why**: Zero cost, zero latency, no audio file upload limits, and native support for Indian English and Hindi phonetics.
- **Fallback**: Includes interactive audio voice simulation clips and sample pre-recorded clinical dictations so the doctor can test the entire workflow even on devices without microphone permissions.

### 2. Hybrid Clinical Rules Parser (Instant Regex + Server-Side Gemini)
- **Chosen Approach**: Two-tier parser:
  - *Tier 1 (Instant / Offline)*: Regex pattern matcher identifying standard clinical markers (`chief complaint`, `c/o`, `h/o`, `o/e`, `bp`, `temp`, `rx`, `tab`, `syp`) that pre-populates fields in under 50ms.
  - *Tier 2 (AI Assistant)*: Server-side Gemini 2.5 Flash endpoint (leveraging AI Studio's built-in quota at ₹0 cost) to synthesize messy vernacular dictations into pristine SOAP clinical notes.
- **Why**: Allows instant offline response even in rural PHCs with spotty cellular networks, while providing superior AI structuring when connected.

### 3. Client-Side Persistent Storage (IndexedDB + LocalStorage)
- **Chosen Approach**: Browser-native IndexedDB for patient records, visit archives, and template definitions with zero external database subscriptions.
- **Why**: 100% free, private to the health centre's device, works seamlessly without internet connectivity, and supports export/backup.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Browser Client (React 19)                        │
│                                                                             │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │   Navigation & Header │  │ Active Visit Header  │  │  Facility Switch │  │
│  └───────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Voice Capture & Dictation                      │  │
│  │  - Web Speech API (en-IN / hi-IN)    - Live Audio Waveform Visualizer │  │
│  │  - Interim Transcription Stream      - Quick Voice Command Prompts    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │     Structured Clinical Note    │   │      One-Tap Quick Checklists   │  │
│  │  - Chief Complaint & Duration   │   │  - Symptoms (Positives/Negs)    │  │
│  │  - History of Present Illness   │   │  - Common Diagnoses             │  │
│  │  - Vitals & Physical Exam       │   │  - Standard PHC Essential Drugs │  │
│  │  - Impression & Diagnosis Code  │   │  - Preventive Care & Advice     │  │
│  │  - Rx Treatment & Instructions  │   │                                 │  │
│  └─────────────────────────────────┘   └─────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │  1-Page Printable OPD Slip (CSS)│   │  WhatsApp / SMS Patient Summary │  │
│  └─────────────────────────────────┘   └─────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │   Offline Data Store (IndexedDB / LocalStorage)                       │  │
│  │   - Patients  - Visit Records  - Drug Master  - Daily Aggregate Stats │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ /api/gemini/parse-clinical
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Express Backend Proxy (server.ts)                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Google GenAI SDK (gemini-3.8-flash) via AI Studio Environment Key     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Data Models

- **Patient**:
  ```ts
  interface Patient {
    id: string; // e.g. "PHC-2026-0042"
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    phone?: string;
    registeredDate: string;
    visitCount: number;
    lastVisitDate?: string;
  }
  ```

- **Visit**:
  ```ts
  interface Visit {
    id: string;
    patientId: string;
    patientName: string;
    patientAge: number;
    patientGender: 'male' | 'female' | 'other';
    visitDate: string;
    visitType: 'new' | 'follow_up';
    clinicType: 'general' | 'fever' | 'ncd' | 'anc' | 'pediatric';
    rawTranscript: string;
    structured: {
      chiefComplaint: string;
      duration: string;
      history: string;
      vitals: { bp?: string; pulse?: string; temp?: string; weight?: string; spo2?: string };
      examination: string;
      impression: string;
      diagnosisCode: string;
      plan: string;
      medications: Array<{ drug: string; dosage: string; frequency: string; duration: string }>;
      advice: string;
      followUpDays?: number;
    };
    freeTextSummary: string;
    isConfirmed: boolean;
  }
  ```

- **Template Definition**:
  ```ts
  interface SpecialtyTemplate {
    id: string;
    name: string;
    clinicType: string;
    promptGuides: string[];
    symptomChecklist: Array<{ id: string; label: string; field: 'history'; text: string }>;
    diagnosisChecklist: Array<{ id: string; label: string; code: string }>;
    treatmentChecklist: Array<{ id: string; label: string; drug: string; dosage: string; freq: string; dur: string }>;
  }
  ```

---

## Verification & Execution Steps

1. **Phase 1 Code Verification**:
   - Implement `server.ts` Express backend with Vite middleware and `/api/gemini/parse-clinical` route.
   - Build client services: Web Speech recognition manager, regex clinical rules engine, IndexedDB repository.
   - Construct templates for Fever, NCD (HTN/DM), Antenatal Care, Child Illness, and General OPD.
   - Build UI components: Patient Queue, Live Dictation Station, Structured SOAP Note editor, One-Tap Checklist Drawer, 1-Page Printable OPD Slip, WhatsApp Sharer, and Epidemiology Reports.
2. **Quality Checks**:
   - Test speech dictation stream and interim text rendering.
   - Test offline fallback with pre-loaded medical consultation dictations.
   - Test CSS print layout (`@media print`) ensuring strict 1-page fit without awkward page splits.
   - Run `compile_applet` and verify zero TypeScript or linting errors.
