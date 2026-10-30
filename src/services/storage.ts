import { Patient, Visit, FacilityProfile, Gender, PatientConsultStatus, ReceptionistTriage } from '../types/clinical';

const STORAGE_KEYS = {
  FACILITY: 'clinicscribe_facility',
  PATIENTS: 'clinicscribe_patients_v2',
  VISITS: 'clinicscribe_visits_v2',
  ACTIVE_PATIENT: 'clinicscribe_active_patient_id',
};

export const DEFAULT_FACILITY: FacilityProfile = {
  name: 'Primary Health Centre (PHC) Rampur',
  subCentre: 'Sector 4 Sub-Health Centre',
  block: 'Rampur Block',
  district: 'Varanasi',
  state: 'Uttar Pradesh',
  doctorName: 'Dr. Aarav Sharma',
  doctorDesignation: 'Medical Officer (MBBS, MD)',
  registrationNumber: 'MCI-UP-78942',
  receptionistName: 'Pooja Verma (OPD Desk)',
};

const INITIAL_TRIAGE_1: ReceptionistTriage = {
  fever: '102.2 °F',
  bp: '136/84 mmHg',
  bloodSugar: '148 mg/dL',
  weight: '64 kg',
  pulse: '96 bpm',
  currentProblem: 'High grade fever with severe bodyache and chills since 4 days; burning sensation in eyes.',
  priorProblems: 'Known Hypertensive on medication for 2 years; no history of asthma or allergy.',
  recordedAt: '2026-10-29 09:30 AM',
  receptionistName: 'Pooja Verma',
};

const INITIAL_TRIAGE_2: ReceptionistTriage = {
  fever: '98.6 °F',
  bp: '148/92 mmHg',
  bloodSugar: '210 mg/dL (RBS)',
  weight: '72 kg',
  pulse: '78 bpm',
  currentProblem: 'Routine NCD checkup; feeling generalized fatigue and frequent urination at night.',
  priorProblems: 'Type 2 Diabetes since 6 years on Metformin, Essential Hypertension on Amlodipine.',
  recordedAt: '2026-10-29 10:15 AM',
  receptionistName: 'Pooja Verma',
};

const INITIAL_TRIAGE_3: ReceptionistTriage = {
  fever: '100.4 °F',
  bp: '110/72 mmHg',
  bloodSugar: '92 mg/dL',
  weight: '12 kg',
  pulse: '112 bpm',
  currentProblem: '3-year-old child with loose watery stools 5 times since morning and mild runny nose.',
  priorProblems: 'Immunizations up to date according to national schedule. No prior admissions.',
  recordedAt: '2026-10-29 10:45 AM',
  receptionistName: 'Pooja Verma',
};

const SEED_PATIENTS: Patient[] = [
  {
    id: 'pat_001',
    opdNumber: 'OPD-2026-1041',
    name: 'Rameshwar Prasad',
    age: 48,
    gender: 'male',
    phone: '9876543210',
    abhaId: '91-4458-1290-7841',
    registeredDate: '2026-10-29',
    visitCount: 2,
    lastVisitDate: '2026-10-29',
    lastDiagnosis: 'Essential Hypertension & T2DM',
    triage: INITIAL_TRIAGE_2,
    status: 'consultation_completed',
  },
  {
    id: 'pat_002',
    opdNumber: 'OPD-2026-1042',
    name: 'Sunita Devi',
    age: 26,
    gender: 'female',
    phone: '9845123456',
    abhaId: '91-3321-7782-9012',
    registeredDate: '2026-10-29',
    visitCount: 1,
    lastVisitDate: '2026-10-29',
    triage: {
      fever: '98.4 °F',
      bp: '112/70 mmHg',
      bloodSugar: '94 mg/dL',
      weight: '55 kg',
      pulse: '74 bpm',
      currentProblem: '2nd Trimester routine ANC consultation (24 weeks); requests fetal check & supplements.',
      priorProblems: 'G2P1L1, previous normal vaginal delivery; no history of gestational diabetes.',
      recordedAt: '2026-10-29 11:00 AM',
      receptionistName: 'Pooja Verma',
    },
    status: 'waiting_for_doctor',
  },
  {
    id: 'pat_003',
    opdNumber: 'OPD-2026-1043',
    name: 'Aarush Kumar',
    age: 3,
    gender: 'male',
    phone: '9712345678',
    registeredDate: '2026-10-29',
    visitCount: 1,
    triage: INITIAL_TRIAGE_3,
    status: 'waiting_for_doctor',
  },
  {
    id: 'pat_004',
    opdNumber: 'OPD-2026-1044',
    name: 'Mohan Lal Verma',
    age: 36,
    gender: 'male',
    phone: '9822334455',
    registeredDate: '2026-10-29',
    visitCount: 1,
    triage: INITIAL_TRIAGE_1,
    status: 'waiting_for_doctor',
  },
];

const SEED_VISITS: Visit[] = [
  {
    id: 'vis_001',
    opdSlipNumber: 'SLIP-2026-8801',
    patientId: 'pat_001',
    patientName: 'Rameshwar Prasad',
    patientAge: 48,
    patientGender: 'male',
    patientPhone: '9876543210',
    visitDate: '2026-10-29',
    visitTime: '10:35 AM',
    visitType: 'follow_up',
    clinicType: 'ncd',
    triageData: INITIAL_TRIAGE_2,
    rawTranscript:
      'Doctor: Rameshwar ji, how are you feeling with Telmisartan and Metformin? Patient: Doctor sahab, I have some dizziness in the morning and excessive urination. BP measured is 148/92, blood sugar 210. Doctor: On examination, no pedal edema, heart and lungs clear. We need to titrate your Metformin to 1000mg BD and continue Telmisartan 40mg. Restrict dietary sugar and salt. Review after 15 days.',
    structured: {
      chiefComplaint: 'Uncontrolled blood sugar and morning dizziness with hypertension follow-up',
      duration: '2 weeks',
      history: 'Known Type 2 Diabetic and Hypertensive. Reports nocturnal polyuria and mild morning lightheadedness.',
      vitals: { bp: '148/92 mmHg', pulse: '78 bpm', temp: '98.6 °F', weight: '72 kg', bloodSugar: '210 mg/dL (RBS)' },
      examination: 'Conscious, oriented, no pedal edema, bilateral chest clear, S1 S2 normal.',
      impression: 'Type 2 Diabetes Mellitus (Uncontrolled) & Essential Hypertension Stage 1',
      diagnosisCode: 'T2DM-UNCTRL',
      medications: [
        { id: 'm1', drug: 'Tab Metformin 1000mg SR', dosage: '1 tab', frequency: 'BD (Twice daily)', duration: '15 days', instructions: 'With breakfast and dinner' },
        { id: 'm2', drug: 'Tab Telmisartan 40mg', dosage: '1 tab', frequency: 'OD (Morning)', duration: '15 days', instructions: 'Empty stomach with water' },
      ],
      advice: 'Strict avoidance of refined sugars and sweets. Limit daily salt to under 5g. 30 mins brisk walking. Check Fasting and PP sugar next visit.',
      followUpDays: 15,
    },
    freeTextSummary: '48-year-old male with Type 2 Diabetes and Hypertension; presenting with elevated RBS 210 mg/dL and BP 148/92 mmHg. Titrated Metformin to 1000mg BD and continued Telmisartan 40mg. Advised diabetic diet and follow-up in 15 days.',
    isConfirmed: true,
    confirmedAt: '2026-10-29 10:45 AM',
    confirmedByDoctor: 'Dr. Aarav Sharma (MBBS, MD)',
    facilityName: 'Primary Health Centre (PHC) Rampur',
    doctorName: 'Dr. Aarav Sharma',
    reportDeliveredToClient: false,
  },
];

export function getFacilityProfile(): FacilityProfile {
  const data = localStorage.getItem(STORAGE_KEYS.FACILITY);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.FACILITY, JSON.stringify(DEFAULT_FACILITY));
    return DEFAULT_FACILITY;
  }
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_FACILITY;
  }
}

export function saveFacilityProfile(profile: FacilityProfile): void {
  localStorage.setItem(STORAGE_KEYS.FACILITY, JSON.stringify(profile));
}

export function getPatients(): Patient[] {
  const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(SEED_PATIENTS));
    return SEED_PATIENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_PATIENTS;
  }
}

export function savePatient(
  patientData: Omit<Patient, 'id' | 'opdNumber' | 'registeredDate' | 'visitCount' | 'status'> & {
    id?: string;
    status?: PatientConsultStatus;
  }
): Patient {
  const patients = getPatients();
  const today = new Date().toISOString().split('T')[0];

  if (patientData.id) {
    const index = patients.findIndex((p) => p.id === patientData.id);
    if (index !== -1) {
      patients[index] = {
        ...patients[index],
        ...patientData,
      };
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
      return patients[index];
    }
  }

  const newOpdNum = `OPD-2026-${(1045 + patients.length).toString()}`;
  const newPatient: Patient = {
    id: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    opdNumber: newOpdNum,
    name: patientData.name,
    age: patientData.age,
    gender: patientData.gender,
    phone: patientData.phone,
    abhaId: patientData.abhaId,
    registeredDate: today,
    visitCount: 1,
    lastVisitDate: today,
    triage: patientData.triage,
    status: patientData.status || 'waiting_for_doctor',
  };

  patients.unshift(newPatient);
  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  return newPatient;
}

export function updatePatientStatus(patientId: string, status: PatientConsultStatus, activeVisitId?: string): void {
  const patients = getPatients();
  const index = patients.findIndex((p) => p.id === patientId);
  if (index !== -1) {
    patients[index].status = status;
    if (activeVisitId) patients[index].activeVisitId = activeVisitId;
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }
}

export function getVisits(): Visit[] {
  const data = localStorage.getItem(STORAGE_KEYS.VISITS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(SEED_VISITS));
    return SEED_VISITS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_VISITS;
  }
}

export function saveVisit(visit: Visit): void {
  const visits = getVisits();
  const index = visits.findIndex((v) => v.id === visit.id);
  if (index !== -1) {
    visits[index] = visit;
  } else {
    visits.unshift(visit);
  }
  localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

  // Sync patient status & metadata
  const patients = getPatients();
  const pIndex = patients.findIndex((p) => p.id === visit.patientId);
  if (pIndex !== -1) {
    patients[pIndex].lastVisitDate = visit.visitDate;
    patients[pIndex].lastDiagnosis = visit.structured.impression;
    patients[pIndex].visitCount = (patients[pIndex].visitCount || 1) + 1;
    if (visit.isConfirmed) {
      patients[pIndex].status = 'consultation_completed';
      patients[pIndex].activeVisitId = visit.id;
    }
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }
}

export function markReportDelivered(visitId: string): void {
  const visits = getVisits();
  const vIndex = visits.findIndex((v) => v.id === visitId);
  if (vIndex !== -1) {
    visits[vIndex].reportDeliveredToClient = true;
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

    const patients = getPatients();
    const pIndex = patients.findIndex((p) => p.id === visits[vIndex].patientId);
    if (pIndex !== -1) {
      patients[pIndex].status = 'report_delivered';
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    }
  }
}

export function getVisitsForPatient(patientId: string): Visit[] {
  return getVisits().filter((v) => v.patientId === patientId);
}

export function getReportAnalytics() {
  const visits = getVisits();
  const patients = getPatients();
  const today = new Date().toISOString().split('T')[0];

  const todayVisits = visits.filter((v) => v.visitDate === today);
  const totalPatients = patients.length;
  const newVisits = visits.filter((v) => v.visitType === 'new').length;
  const followUpVisits = visits.filter((v) => v.visitType === 'follow_up').length;

  const diagnosisCounts: Record<string, number> = {};
  for (const v of visits) {
    const code = v.structured.diagnosisCode || 'OTHER';
    diagnosisCounts[code] = (diagnosisCounts[code] || 0) + 1;
  }

  const clinicCounts: Record<string, number> = {};
  for (const v of visits) {
    clinicCounts[v.clinicType] = (clinicCounts[v.clinicType] || 0) + 1;
  }

  const genderCounts: Record<Gender, number> = { male: 0, female: 0, other: 0 };
  for (const p of patients) {
    if (genderCounts[p.gender] !== undefined) {
      genderCounts[p.gender]++;
    }
  }

  return {
    todayVisitsCount: todayVisits.length,
    totalVisitsCount: visits.length,
    totalPatientsCount: totalPatients,
    newVisitsRatio: totalPatients > 0 ? Math.round((newVisits / (newVisits + followUpVisits || 1)) * 100) : 0,
    diagnosisCounts,
    clinicCounts,
    genderCounts,
  };
}

export function exportVisitsToCsv(): string {
  const visits = getVisits();
  const headers = [
    'Date',
    'Time',
    'OPD_Slip_No',
    'Patient_Name',
    'Age',
    'Gender',
    'Phone',
    'Clinic_Type',
    'Visit_Type',
    'Chief_Complaint',
    'Diagnosis_Code',
    'Impression',
    'Confirmed_By',
    'Confirmed_At',
    'Prescribed_Meds_Count',
  ];

  const rows = visits.map((v) => [
    `"${v.visitDate}"`,
    `"${v.visitTime || ''}"`,
    `"${v.opdSlipNumber}"`,
    `"${v.patientName}"`,
    v.patientAge,
    `"${v.patientGender}"`,
    `"${v.patientPhone || ''}"`,
    `"${v.clinicType}"`,
    `"${v.visitType}"`,
    `"${(v.structured.chiefComplaint || '').replace(/"/g, '""')}"`,
    `"${v.structured.diagnosisCode || ''}"`,
    `"${(v.structured.impression || '').replace(/"/g, '""')}"`,
    `"${v.confirmedByDoctor || ''}"`,
    `"${v.confirmedAt || ''}"`,
    v.structured.medications.length,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

