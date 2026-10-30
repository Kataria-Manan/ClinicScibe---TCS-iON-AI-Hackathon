## 1. Problem Statement

Primary Health Centre (PHC) doctors in high‑volume outpatient settings typically have 2–3 minutes per patient. Current documentation tools and workflows are:

- Optimized for **administrative reporting and throughput**, not for how doctors **think and work** during a consultation.
- Fragmented across **paper OPD registers**, manual notes, and basic EMR forms.
- Time‑consuming to fill, so doctors:
  - Rely on **memory** rather than detailed notes.
  - Capture **minimal or inconsistent clinical details**.
  - Rarely produce clear, **patient‑friendly visit summaries**.

Consequences:

- Important clinical details (e.g., duration of symptoms, past episodes, red‑flag signs) are often missing.
- Follow‑up visits are harder because prior context is unclear.
- Patients leave without a clear record of **what was found** and **what was advised**.
- Data captured for administrative reports does not easily reflect **real clinical content**.

There is a need for a tool that:

- Fits **into** the real 2–3 minute PHC consultation flow.
- Supports the **doctor’s cognitive workflow** (history → exam → impression → plan).
- Produces both **clinically meaningful notes** and **basic reporting data**.
- Generates a **one‑page summary** that can be stored digitally or printed for the patient and future visits.

---

## 2. Solution Overview – ClinicScribe Voice Notes

ClinicScribe Voice Notes is a mobile/tablet app that:

- Lets PHC doctors **speak naturally** during or right after a consultation.
- Uses **real-time voice-to-text conversion** to transcribe what the doctor says.
- Runs a **simple rules engine** on the transcript to extract:
  - Chief complaint  
  - History of present illness / past history  
  - Examination findings  
  - Impression / diagnosis  
  - Treatment and follow‑up plan
- Applies **specialty-specific templates** (e.g., fever, antenatal, NCD follow-up) to guide the doctor.
- Provides **one-tap checklists** for common symptoms, diagnoses, and treatments to speed up data entry.
- Automatically builds:
  - A **structured clinical note** for the PHC record and reporting.
  - A **concise, editable free-text summary** on a single page that:
    - The doctor can review and confirm at the end.
    - Can be **stored** in the facility’s system or **printed** for the patient.

The app is designed for **offline-first** use with intermittent sync and built using **off‑the‑shelf speech-to-text APIs** plus light-weight NLP/rules for structuring content.

---

## 3. Target Users

### Primary Users: PHC Doctors / Medical Officers

Needs:
- Capture **accurate, structured notes** without slowing down consultations.
- Support their **thinking process** (history → exam → plan) instead of rigid forms.
- Quickly recall the patient’s last condition in **follow‑up visits** from a one‑page view.
- Produce **basic reporting data** automatically from routine documentation.

### Secondary Users

1. **Nurses / ANMs / OPD staff**
   - Need clear notes to:
     - Prepare injections / medications.
     - Educate patients on treatment and follow-up.
   - May help with printing and filing summaries.

2. **Patients & Caregivers**
   - Need a **simple paper summary**:
     - What was the problem?
     - What did the doctor find?
     - What medicines and instructions were given?
     - When to return or seek urgent care?

3. **PHC Administrators / Program Officers**
   - Need **aggregate data** on:
     - Common diagnoses, age/sex patterns.
     - Services provided (e.g., NCD follow-ups, antenatal visits).
   - Prefer minimal **extra work** for doctors.

---

## 4. Key Features

You must build **all** of these features in the prototype and reference them throughout:

1. **Real-time Voice-to-Text Conversion**
   - Use an off-the-shelf **speech-to-text API** to transcribe the doctor’s voice notes **as they speak**.
   - Support accented English and optionally local languages (start with English + one Indian language if possible).
   - Show live transcription so doctors can trust and correct it.

2. **Structured Data Parsing (Rules Engine)**
   - After transcription, apply a **simple rules engine** that:
     - Detects and segments text into:
       - Chief complaint  
       - History (HPI, relevant past history)  
       - Examination findings  
       - Impression / diagnosis  
       - Plan (medications, tests, advice, follow-up)
     - Uses:
       - **Cue phrases** (“chief complaint is…”, “on examination…”, “impression…”, “plan is…”).
       - **Template prompts** to capture missing data.

3. **Specialty-specific Templates**
   - Predefined templates for common PHC cases, for example:
     - Fever / acute infection  
     - Hypertension / diabetes follow-up  
     - Antenatal visit  
     - Child with cough / diarrhea  
   - Each template:
     - Shows **relevant fields** and prompts in the structured note.
     - Guides the doctor how to speak (e.g., “Please mention duration of fever and associated symptoms”).

4. **Free-text Summary Generation**
   - Automatically generate a **brief, readable summary** such as:
     - “35-year-old male with 3-day history of fever and cough, no breathlessness, vitals stable, likely viral URTI; started on paracetamol and advised fluids, return if worsening.”
   - The summary:
     - Is derived from the **structured fields**.
     - Can be **edited** by the doctor before finalization.
     - Appears on a **single page** along with key structured info.

5. **One-tap Checklist Integration**
   - For each template, provide **checklists** for:
     - Common symptoms (e.g., fever, cough, vomiting).
     - Likely diagnoses (e.g., URTI, malaria suspect, hypertensive urgency).
     - Common treatments / investigations.
   - Tapping a checklist item:
     - **Auto-populates** the relevant structured fields.
     - Updates the **free-text summary** accordingly.
     - Adds to **basic reporting data** (e.g., count of “URTI” cases).

6. **Basic Reporting Data Output**
   - From each completed visit, extract key fields:
     - Age, sex (optional for prototype).
     - Chief complaint category.
     - Final diagnosis (coded with simple categories).
     - Visit type (new vs follow-up).
   - Provide:
     - A simple **export** (CSV/JSON).
     - A **basic dashboard** (e.g., counts per diagnosis per day/week).
   - Ensure this is generated **without extra typing** beyond the voice note + checklists.

---

## 5. User Flow

### 5.1 Setup (One-time or Infrequent)

1. **Login / Access**
   - Doctor opens the app on a **tablet or phone**.
   - Logs in (for prototype, simple PIN or username-only login).

2. **Facility & Specialty Selection**
   - Doctor selects:
     - Facility name (e.g., “PHC X”).
     - Primary specialty / clinic for the session (e.g., General OPD, NCD Clinic, ANC).
   - This sets the **default specialty-specific templates** for the session.

---

### 5.2 New Patient Consultation Flow

1. **Patient Registration (Basic)**
   - Staff or doctor taps **“New Visit”**.
   - Minimal fields (for prototype):
     - Patient name (or ID).
     - Age / sex.
     - New vs follow-up visit toggle.

2. **Template Selection**
   - App suggests a **template** based on:
     - Selected clinic type (e.g., ANC → antenatal template).
     - Or doctor manually chooses from a list:
       - “Fever / Acute illness”
       - “Hypertension/Diabetes Follow-up”
       - “ANC Visit”
       - “Child with cough”
   - Template loads with:
     - Relevant **structured fields** (history, exam, plan sections).
     - **One-tap checklists** for that condition.

3. **Real-time Voice-to-Text During Consultation**
   - Doctor taps **“Start Voice Note”**.
   - Doctor speaks as they see the patient, following the template hints at the top:
     - “Chief complaint…”
     - “History: …”
     - “On examination: …”
     - “Impression: …”
     - “Plan: …”
   - The app:
     - Streams audio to the **speech-to-text API**.
     - Displays **live transcription**.
     - (Optional) Allows doctor to quickly tap words to correct big errors.

4. **Automatic Structuring (Parsing)**
   - When done, doctor taps **“Stop & Process”**.
   - Rules engine runs on the transcript:
     - Uses keywords / patterns to **segment** the text.
     - Fills in:
       - Chief complaint (e.g., “fever since 3 days”).
       - History (e.g., associated cough, no SOB, no chest pain).
       - Exam findings (e.g., temp 101°F, lungs clear).
       - Impression (e.g., “probable viral URTI”).
       - Plan (e.g., paracetamol 500 mg, fluids, return if breathlessness).
   - Doctor sees a **structured form view** with fields auto-populated.

5. **Checklist Enhancements**
   - If something was missed or is easier to tap:
     - Doctor uses **one-tap checklists** to add:
       - Additional symptoms (e.g., “no weight loss”, “no night sweats”).
       - Diagnosis (e.g., tick “URTI”).
       - Standard treatments (e.g., “Paracetamol 500 mg TDS x 3 days”).
   - Selecting items:
     - Updates the **structured fields**.
     - Triggers **regeneration / augmentation of the summary**.

6. **Review Auto-generated Summary**
   - App shows a **single-page summary** combining:
     - Key structured elements:
       - Name, age/sex, date, visit type.
       - Chief complaint.
       - Diagnosis.
       - Prescribed medications / advice.
     - **Free-text summary** sentence(s).
   - Doctor can:
     - Tap to **edit** the summary text.
     - Edit any structured field if needed.

7. **Doctor Confirmation**
   - Before ending the session:
     - Doctor reviews everything on this **one page**.
     - Makes any final edits using voice (short additional note) or typing.
   - Doctor taps **“Confirm & Save”**.

8. **Storage & Output**
   - On confirmation, app:
     - Saves the structured note and summary to local storage (with visit ID).
     - Queues it for **sync** to server when online (for prototype, can be local-only).
   - Staff can:
     - Tap **“Print Patient Summary”**:
       - Generates a printable one-page PDF/text.
       - Contains: diagnosis, medicines, instructions, next visit date.
     - Hand this to the patient.

---

### 5.3 Follow-up Visit Flow

1. **Search Existing Patient**
   - Staff/doctor selects **“Existing Patient”**.
   - Searches by:
     - Name, ID, or phone number (if available).

2. **View Last Visit One-pager**
   - App displays:
     - Previous visit’s **single-page summary**.
     - Key structured fields (diagnosis, meds, findings).

3. **New Voice Note & Update**
   - Doctor starts a **new visit**:
     - Chooses a follow-up template (e.g., “HTN/DM follow-up”).
   - Repeats the **voice note → structured parsing → checklist → summary** steps.
   - The system (optionally) shows **comparison** with last visit (e.g., BP readings).

---

## 6. Technical Approach

### 6.1 Overall Architecture

- **Client:** Mobile-first web app (PWA) or React Native app targeting Android tablets/phones.
- **Backend:** Lightweight REST API for:
  - User/session management.
  - Storage of visits and templates.
  - Reporting endpoints.
- **Data Storage:** 
  - For prototype: SQLite or Postgres on server; IndexedDB/local storage on client for offline.
- **Third-party Services:**
  - **Speech-to-text API** (e.g., Google Speech-to-Text, Azure Cognitive Services, or OpenAI Whisper API).
  
Keep architecture modular so speech/NLP components can be swapped.

---

### 6.2 Frontend Implementation

Suggested stack: **React / React Native + TypeScript**.

Key UI components:

1. **Login / Setup Screen**
   - Simple login form.
   - Dropdowns: Facility, Clinic Type.

2. **Patient List / Search**
   - Search bar: by name/ID.
   - List of recent patients.

3. **Visit Screen**
   - Header with:
     - Patient name, age/sex, date.
     - New/Follow-up badge.
   - Tabs or sections:
     - Voice Capture.
     - Structured Note.
     - Summary Preview.

4. **Voice Capture Component**
   - Start/Stop button.
   - Live transcription text area.
   - Visual indicator for recording.
   - Sends audio stream/chunks to **speech-to-text API**.

5. **Structured Note Component**
   - Form fields grouped as:
     - Chief Complaint.
     - History.
     - Examination.
     - Impression/Diagnosis.
     - Plan.
   - Fields are **auto-filled** by parsing module.
   - Allow inline edits.

6. **Template & Checklist Component**
   - Template selection dropdown.
   - Checklist panels:
     - Symptoms.
     - Diagnoses.
     - Treatments/Investigations.
   - Each checklist item has:
     - Display label.
     - Mapping to specific structured fields & codes.

7. **Summary View & Print**
   - Shows:
     - Basic structured data in bullet/table form.
     - Free-text summary paragraph(s).
   - “Edit Summary” text area.
   - “Confirm & Save” button.
   - “Print / Download” button to generate PDF (use libraries like `jspdf` or browser print).

8. **Reporting Dashboard (Basic)**
   - Simple table/charts:
     - Visits per day.
     - Top diagnoses.
   - Export button (CSV/JSON).

---

### 6.3 Backend Implementation

Suggested stack: **Node.js + Express** or **Python (FastAPI/Flask)**.

APIs:

1. **Auth & Doctor Profile**
   - `POST /login` – mock/simple auth.
   - `GET /me` – doctor details, default facility, default templates.

2. **Patient & Visit APIs**
   - `POST /patients` – create minimal patient record.
   - `GET /patients?query=...` – search.
   - `POST /visits` – create a visit with:
     - Raw transcript.
     - Parsed structured data.
     - Summary text.
   - `GET /visits/:id` – fetch visit + summary for display/print.

3. **Templates & Checklists**
   - `GET /templates` – list templates by clinic type.
   - `GET /templates/:id` – template details (fields, checklists).

4. **Reporting**
   - `GET /reports/overview?from=&to=` – summary counts.
   - `GET /reports/export?from=&to=` – CSV/JSON output.

---

### 6.4 Speech-to-Text Integration

- On the client:
  - Record audio in short chunks (e.g., 5–10 seconds) using WebRTC/MediaRecorder.
  - Send chunks to backend: `POST /stt` or directly to provider if allowed.
- On the backend:
  - Proxy calls to external **speech-to-text API**.
  - Accept:
    - Audio file or audio chunks.
    - Language/code (e.g., `en-IN`, `hi-IN`).
  - Return:
    - Final transcript text.
    - (Optional) word-level timestamps.

For faster prototyping, you can initially send the **entire recording** at once rather than streaming.

Suggested APIs:
- Google Cloud Speech-to-Text (has good support for Indian English & Indic languages).
- Azure Speech Service.
- OpenAI Whisper API.

---

### 6.5 Structured Data Parsing (Rules Engine)

A simple rules engine (no heavy ML needed for prototype):

1. **Input:** Raw transcript string.

2. **Processing steps:**
   - Normalize:
     - Lowercase.
     - Remove filler words (“uh”, “hmm”).
   - Split transcript using:
     - **Cue phrases**: 
       - `chief complaint`, `history`, `on examination`, `examination`, `impression`, `diagnosis`, `plan`, `advice`, `treatment`.
   - Map segments to fields:
     - Text between “chief complaint” and “history” → Chief Complaint.
     - Text between “history” and “examination” → History.
     - And so on.

3. **Fallback rules:**
   - If no cue phrases:
     - First 1–2 sentences → Chief Complaint/History.
     - Phrases with vitals keywords (`bp`, `pulse`, `temperature`) → Examination.
     - Phrases with diagnosis keywords (from template) → Impression.
     - Phrases with medication words (`tablet`, `mg`, `take`) → Plan.

4. **Template-aware parsing:**
   - Use template metadata:
     - Fever template expects duration, associated symptoms.
     - If transcript contains “since X days” → map to duration field.
   - Use regex patterns for:
     - Numeric vitals (`bp 140 by 90`, `temperature 101`).
     - Age (`35-year-old male`).

5. **Output:**
   - JSON object with:
     - `chief_complaint: string`
     - `history: string`
     - `examination: string`
     - `impression: string`
     - `plan: string`
     - `codes: { diagnosis_code, complaint_category, visit_type }`

The client receives this and pre-fills the structured form.

---

### 6.6 Specialty-specific Templates

Data model for a template:

```json
{
  "id": "fever_template",
  "name": "Fever / Acute Illness",
  "sections": [
    {
      "name": "Chief Complaint",
      "fields": [
        {"id": "chief_complaint", "label": "Chief Complaint", "type": "text"}
      ]
    },
    {
      "name": "History",
      "fields": [
        {"id": "duration", "label": "Duration of symptoms", "type": "text"},
        {"id": "associated_symptoms", "label": "Associated symptoms", "type": "text"}
      ]
    }
  ],
  "checklists": {
    "symptoms": [
      {"id": "fever", "label": "Fever"},
      {"id": "cough", "label": "Cough"},
      {"id": "sore_throat", "label": "Sore throat"}
    ],
    "diagnoses": [
      {"id": "urti", "label": "Upper respiratory tract infection"},
      {"id": "malaria_suspect", "label": "Malaria suspect"}
    ],
    "treatments": [
      {"id": "paracetamol_500mg", "label": "Paracetamol 500 mg TDS x 3 days"}
    ]
  }
}
```

- Each checklist item is mapped to **structured fields** and **reporting codes**.

---

### 6.7 Free-text Summary Generation

Use a template-based or light NLP approach:

1. **Inputs:**
   - Patient demographics.
   - Structured fields: chief complaint, duration, key symptoms, vitals, impression, plan.

2. **Logic:**
   - Conditionally compose a sentence:
     - `[Age]-year-old [sex] with [duration] history of [chief complaint], [key positives], [key negatives if present]. On examination, [salient findings]. Assessment: [impression]. Plan: [treatments] and advised [follow-up / warning signs].`
   - For prototype, implement as a deterministic string builder on the backend.

3. **Output:**
   - Plain text summary that can be:
     - Displayed and edited on the client.
     - Included on the printable one-page summary.

---

### 6.8 One-tap Checklist Integration

Implementation details:

- Each checklist item has:
  - `id`, `label`, `section_field_target`, `append_text`, `reporting_code`.
- On tap:
  - Update corresponding field:
    - Append `append_text` to `history`, `examination`, or `plan`.
  - Add or update `diagnosis` if relevant.
  - Add its `reporting_code` to visit metadata.

Example:
- Tapping “URTI” in Diagnoses:
  - Sets `impression = "Upper respiratory tract infection"`.
  - Adds `diagnosis_code = "URTI"` for reporting.

---

### 6.9 Basic Reporting Data Output

1. **Data captured from every visit:**
   - `visit_date`
   - `facility_id`
   - `patient_age`, `patient_sex`
   - `visit_type` (new / follow-up)
   - `chief_complaint_category` (mapped from template/checklist)
   - `diagnosis_code` (from impression/checklist)
   - `is_ANC`, `is_NCD`, etc. (booleans based on template)

2. **Backend Aggregation:**
   - Simple SQL queries or in-memory aggregation to compute:
     - Total visits by day.
     - Visits by diagnosis.
     - Visits by template type.

3. **Exports:**
   - `GET /reports/export` returns CSV with the above columns for a date range.
   - For the prototype, show this in a downloadable link.

---

## 7. Success Metrics

For a hackathon prototype, simulate or test with a few doctors or medical students.

### 7.1 Clinical Workflow & Usability

- **Time per documentation:**
  - Measure average time from **Start Voice Note** to **Confirm & Save**.
  - Target: ≤ 60–90 seconds additional to normal consultation.

- **Adoption intent:**
  - % of test doctors who say they would use this in real OPD:
    - Target: ≥ 70% positive after a short demo.

- **Perceived cognitive support:**
  - Likert scale (1–5) on:
    - “Helps me not forget important clinical details.”
    - Target average: ≥ 4.

### 7.2 Documentation Quality

- **Completeness of key fields:**
  - For a sample of visits, check if there is:
    - Chief complaint, duration, basic exam, diagnosis, plan.
  - Compare **voice-driven structured notes** vs typical paper notes (even if simulated).
  - Target: ≥ 20–30% improvement in completeness score.

- **Accuracy of summaries:**
  - Doctor rates generated summary vs their own understanding:
    - “Accurately reflects visit” (Yes/No).
    - Target: ≥ 80% Yes after minor edits.

### 7.3 Technical Performance

- **Speech-to-text reliability:**
  - Doctor ratings on transcription quality (1–5).
  - Target: ≥ 4 with Indian English.

- **App responsiveness:**
  - Time to show processed structured note after pressing “Stop & Process”.
  - Target: ≤ 3–5 seconds.

### 7.4 Reporting Utility

- **Reporting completeness:**
  - Check that basic fields (date, diagnosis_code, template type) are present for ≥ 95% of visits.

- **Ease of data export:**
  - Can a non-technical admin generate a CSV summary in ≤ 2 clicks.

---

This plan contains enough detail for an AI prototyping tool (e.g., Lovable, Bolt) to:

- Scaffold the **frontend** (visit flow, voice capture, structured note, summary, checklists).
- Build a basic **backend** (patients, visits, templates, reports).
- Integrate with a **speech-to-text API**.
- Implement the **rules engine**, **template system**, **summary generation**, and **report export** so that ClinicScribe Voice Notes can function end-to-end as a working hackathon prototype.