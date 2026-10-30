/**
 * Core clinical types for ClinicScribe Voice Notes
 * Supporting Role-Based Workflow: Receptionist & Doctor
 */

export type UserRole = 'receptionist' | 'doctor';
export type Gender = 'male' | 'female' | 'other';
export type VisitType = 'new' | 'follow_up';
export type ClinicType = 'general' | 'fever' | 'ncd' | 'anc' | 'pediatric';
export type PatientConsultStatus =
  | 'waiting_for_doctor'
  | 'in_consultation'
  | 'consultation_completed'
  | 'report_delivered';

export interface Vitals {
  bp?: string;          // e.g. "130/84 mmHg"
  pulse?: string;       // e.g. "76 bpm"
  temp?: string;        // e.g. "100.8 °F"
  weight?: string;      // e.g. "62 kg"
  spo2?: string;        // e.g. "98%"
  bloodSugar?: string;  // e.g. "160 mg/dL (RBS)"
}

export interface ReceptionistTriage {
  fever?: string;
  bp?: string;
  bloodSugar?: string;
  weight?: string;
  pulse?: string;
  currentProblem: string;      // What current problem patient is here to consult
  priorProblems?: string;      // Known chronic/past conditions e.g. Diabetes, HTN, Asthma
  recordedAt: string;          // Date & Time intake occurred
  receptionistName?: string;
}

export interface Medication {
  id: string;
  drug: string;            // e.g. "Tab Paracetamol 500mg"
  dosage: string;          // e.g. "1 tablet"
  frequency: string;       // e.g. "TDS (Three times a day)"
  duration: string;        // e.g. "3 days"
  instructions?: string;   // e.g. "After meals"
}

export interface StructuredClinicalData {
  chiefComplaint: string;
  duration: string;
  history: string;
  vitals: Vitals;
  examination: string;
  impression: string;
  diagnosisCode: string;
  medications: Medication[];
  advice: string;
  followUpDays?: number;
}

export interface Patient {
  id: string;
  opdNumber: string;
  name: string;
  age: number;
  gender: Gender;
  phone?: string;
  abhaId?: string;
  registeredDate: string;
  visitCount: number;
  lastVisitDate?: string;
  lastDiagnosis?: string;
  triage: ReceptionistTriage;
  status: PatientConsultStatus;
  activeVisitId?: string;
}

export interface Visit {
  id: string;
  opdSlipNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: Gender;
  patientPhone?: string;
  visitDate: string;
  visitTime?: string;
  visitType: VisitType;
  clinicType: ClinicType;
  triageData?: ReceptionistTriage;
  rawTranscript: string;
  structured: StructuredClinicalData;
  freeTextSummary: string;
  isConfirmed: boolean;
  confirmedAt?: string;      // Date and time doctor locked and confirmed the visit
  confirmedByDoctor?: string;
  facilityName: string;
  doctorName: string;
  reportDeliveredToClient?: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  sublabel?: string;
  targetField: 'symptom' | 'examination' | 'diagnosis' | 'medication';
  textToAppend?: string;
  diagnosisCode?: string;
  medicationTemplate?: Omit<Medication, 'id'>;
}

export interface SpecialtyTemplate {
  id: ClinicType;
  name: string;
  hindiName: string;
  subtitle: string;
  iconName: string;
  cuePhrases: string[];
  symptoms: ChecklistItem[];
  diagnoses: ChecklistItem[];
  treatments: ChecklistItem[];
  vitalsToPrioritize: Array<keyof Vitals>;
  sampleDictation: {
    title: string;
    transcript: string;
  };
}

export interface FacilityProfile {
  name: string;
  subCentre?: string;
  block: string;
  district: string;
  state: string;
  doctorName: string;
  doctorDesignation: string;
  registrationNumber: string;
  receptionistName: string;
}
