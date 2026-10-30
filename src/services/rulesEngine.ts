import { StructuredClinicalData, Vitals, Medication, Gender } from '../types/clinical';

/**
 * Deterministic Clinical Rules Engine
 * Runs 100% offline at 0ms latency with zero cost.
 */
export function parseClinicalTranscript(
  transcript: string,
  patientDemographics?: { age?: number; gender?: Gender; name?: string }
): {
  structured: StructuredClinicalData;
  warnings: string[];
  freeTextSummary: string;
} {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const warnings: string[] = [];

  // 1. Extract Vitals
  const vitals: Vitals = {};

  // Blood Pressure: "130 by 80", "130/80", "BP 140/90"
  const bpMatch = text.match(/(?:bp|blood pressure)\s*(?:is|was|of)?\s*(\d{2,3})\s*(?:\/|by)\s*(\d{2,3})/i) ||
                  text.match(/\b(\d{2,3})\s*(?:\/|by)\s*(\d{2,3})\s*(?:mmhg)?\b/i);
  if (bpMatch) {
    const sys = parseInt(bpMatch[1], 10);
    const dia = parseInt(bpMatch[2], 10);
    vitals.bp = `${sys}/${dia} mmHg`;
    if (sys >= 140 || dia >= 90) {
      warnings.push(`Elevated Blood Pressure: ${vitals.bp} (Hypertension stage alert)`);
    } else if (sys < 90 || dia < 60) {
      warnings.push(`Low Blood Pressure: ${vitals.bp} (Hypotension alert)`);
    }
  }

  // Pulse / Heart Rate: "pulse 94", "pulse is 88 beats per minute"
  const pulseMatch = text.match(/(?:pulse|heart rate|pr)\s*(?:is|was|of)?\s*(\d{2,3})\s*(?:bpm|beats)?/i);
  if (pulseMatch) {
    const p = parseInt(pulseMatch[1], 10);
    vitals.pulse = `${p} bpm`;
    if (p > 100) warnings.push(`Tachycardia noted: Pulse ${p} bpm`);
    if (p < 55) warnings.push(`Bradycardia noted: Pulse ${p} bpm`);
  }

  // Temperature: "temperature 102.4", "temp 101 Fahrenheit", "temp 38 C"
  const tempMatch = text.match(/(?:temperature|temp|febrile at)\s*(?:is|was|of)?\s*(\d{2,3}(?:\.\d)?)\s*(?:f|fahrenheit|c|celsius|degrees)?/i);
  if (tempMatch) {
    const t = parseFloat(tempMatch[1]);
    vitals.temp = `${t} °F`;
    if (t >= 101) warnings.push(`High Grade Pyrexia: Temp ${t} °F`);
  }

  // Weight: "weight 68 kg", "wt 12.5 kg"
  const weightMatch = text.match(/(?:weight|wt)\s*(?:is|was|of)?\s*(\d{1,3}(?:\.\d)?)\s*(?:kg|kilos)?/i);
  if (weightMatch) {
    vitals.weight = `${weightMatch[1]} kg`;
  }

  // SpO2: "spo2 98 percent", "saturation 94%"
  const spo2Match = text.match(/(?:spo2|saturation|oxygen)\s*(?:is|was|of)?\s*(\d{2,3})\s*%?/i);
  if (spo2Match) {
    const s = parseInt(spo2Match[1], 10);
    vitals.spo2 = `${s}%`;
    if (s < 95) warnings.push(`Hypoxia Warning: SpO2 ${s}% (< 95%)`);
  }

  // 2. Extract Duration
  let duration = '';
  const durationMatch = text.match(/(?:since|for|past)\s+(\d+\s+(?:days?|weeks?|months?|hours?))/i);
  if (durationMatch) {
    duration = durationMatch[1];
  }

  // 3. Segment by Clinical Cue Phrases
  // We identify standard landmark headings in transcript
  const cueIndex = {
    chiefComplaint: findFirstIndex(lower, ['chief complaint', 'c/o', 'presenting with', 'presents with', 'complaining of']),
    history: findFirstIndex(lower, ['history:', 'history of', 'h/o', 'associated with']),
    examination: findFirstIndex(lower, ['on examination', 'examination:', 'o/e:', 'systemic examination', 'on exam']),
    impression: findFirstIndex(lower, ['impression:', 'diagnosis:', 'probable', 'likely', 'assessment:']),
    plan: findFirstIndex(lower, ['plan:', 'treatment:', 'rx:', 'management:', 'advised', 'prescribed:']),
  };

  // Extract slices based on detected cue positions
  let chiefComplaint = '';
  let history = '';
  let examination = '';
  let impression = '';
  let plan = '';

  const positions = [
    { key: 'chiefComplaint', idx: cueIndex.chiefComplaint },
    { key: 'history', idx: cueIndex.history },
    { key: 'examination', idx: cueIndex.examination },
    { key: 'impression', idx: cueIndex.impression },
    { key: 'plan', idx: cueIndex.plan },
  ].filter((p) => p.idx !== -1).sort((a, b) => a.idx - b.idx);

  if (positions.length > 0) {
    for (let i = 0; i < positions.length; i++) {
      const current = positions[i];
      const start = current.idx;
      const end = i + 1 < positions.length ? positions[i + 1].idx : text.length;
      const rawSection = text.substring(start, end).trim();

      // Clean leading cue phrase
      const cleaned = cleanLeadingCue(rawSection);

      if (current.key === 'chiefComplaint') chiefComplaint = cleaned;
      else if (current.key === 'history') history = cleaned;
      else if (current.key === 'examination') examination = cleaned;
      else if (current.key === 'impression') impression = cleaned;
      else if (current.key === 'plan') plan = cleaned;
    }
  } else {
    // Fallback if no cue phrases were spoken:
    // Split into sentences
    const sentences = text.split(/(?<=[.?!])\s+/);
    if (sentences.length > 0) chiefComplaint = sentences[0];
    if (sentences.length > 1) history = sentences.slice(1, 2).join(' ');
    if (sentences.length > 2) impression = sentences.slice(2, 3).join(' ');
    if (sentences.length > 3) plan = sentences.slice(3).join(' ');
  }

  // 4. Extract Medications from Plan / Transcript
  const medications: Medication[] = extractMedications(plan || text);

  // 5. Extract Follow-up days
  let followUpDays = 3;
  const followUpMatch = text.match(/(?:review|follow up|next visit|return)(?:\s+(?:in|after))?\s+(\d+)\s*(days?|weeks?|months?)/i);
  if (followUpMatch) {
    const val = parseInt(followUpMatch[1], 10);
    const unit = followUpMatch[2].toLowerCase();
    if (unit.startsWith('week')) followUpDays = val * 7;
    else if (unit.startsWith('month')) followUpDays = val * 30;
    else followUpDays = val;
  }

  // 6. Detect Diagnosis Code
  let diagnosisCode = 'OPD-GEN';
  const impressionLower = (impression || text).toLowerCase();
  if (impressionLower.includes('dengue')) diagnosisCode = 'DENGUE-SUSP';
  else if (impressionLower.includes('malaria')) diagnosisCode = 'MALARIA-SUSP';
  else if (impressionLower.includes('urti') || impressionLower.includes('upper respiratory')) diagnosisCode = 'URTI';
  else if (impressionLower.includes('hypertension') || impressionLower.includes('htn')) diagnosisCode = 'HTN';
  else if (impressionLower.includes('diabetes') || impressionLower.includes('dm')) diagnosisCode = 'T2DM';
  else if (impressionLower.includes('antenatal') || impressionLower.includes('anc') || impressionLower.includes('pregnancy')) diagnosisCode = 'ANC';
  else if (impressionLower.includes('diarrhea') || impressionLower.includes('gastro')) diagnosisCode = 'GE-AWD';
  else if (impressionLower.includes('back') || impressionLower.includes('lba')) diagnosisCode = 'LBA';
  else if (impressionLower.includes('dyspepsia') || impressionLower.includes('gerd')) diagnosisCode = 'DYSPEPSIA';

  // 7. Compose Free-text Summary for Patient Slip
  const ageStr = patientDemographics?.age ? `${patientDemographics.age}-year-old` : 'Patient';
  const genderStr = patientDemographics?.gender || 'patient';
  const complaintStr = chiefComplaint || 'clinical consultation';
  const durationStr = duration ? ` for ${duration}` : '';
  const impressionStr = impression ? `Assessment: ${impression}.` : '';
  const medsCount = medications.length;
  const rxStr = medsCount > 0 ? `Started on ${medsCount} medication(s).` : 'Supportive care advised.';
  const reviewStr = `Follow-up in ${followUpDays} days.`;

  const freeTextSummary = `${ageStr} ${genderStr} presented with ${complaintStr}${durationStr}. ${impressionStr} ${rxStr} ${reviewStr}`;

  return {
    structured: {
      chiefComplaint: chiefComplaint || text.slice(0, 120),
      duration: duration || '3 days',
      history: history || 'No chronic red flag illness reported.',
      vitals,
      examination: examination || 'General physical examination stable.',
      impression: impression || 'Clinical evaluation completed.',
      diagnosisCode,
      medications,
      advice: 'Abundant fluid intake, adequate rest, return immediately if danger signs occur.',
      followUpDays,
    },
    warnings,
    freeTextSummary,
  };
}

function findFirstIndex(text: string, phrases: string[]): number {
  for (const phrase of phrases) {
    const idx = text.indexOf(phrase);
    if (idx !== -1) return idx;
  }
  return -1;
}

function cleanLeadingCue(section: string): string {
  return section
    .replace(/^(?:chief complaint|c\/o|presenting with|history of|history:|h\/o|on examination|examination:|o\/e:|impression:|diagnosis:|assessment:|plan:|treatment:|rx:|management:)\s*[:\-–]?\s*/i, '')
    .trim();
}

function parseHumanFriendlyFrequency(text: string): { frequency: string; instructions: string } {
  const lower = text.toLowerCase();
  if (lower.includes('hungry') || lower.includes('empty stomach') || lower.includes('before food') || lower.includes('before breakfast') || lower.includes('khali pet') || lower.includes('bhukhe pet')) {
    return {
      frequency: 'Once a day on hungry stomach (empty stomach)',
      instructions: '15-30 mins before morning food with water',
    };
  }
  if (lower.includes('night') || lower.includes('bedtime') || lower.includes('dinner') || lower.includes('hs') || lower.includes('raat')) {
    return {
      frequency: 'Once a day after dinner',
      instructions: 'Take at night after food',
    };
  }
  if (lower.includes('twice') || lower.includes('bd') || lower.includes('subah sham') || lower.includes('lunch and dinner')) {
    return {
      frequency: 'Twice a day after lunch & dinner',
      instructions: 'Take immediately after food',
    };
  }
  if (lower.includes('thrice') || lower.includes('tds') || lower.includes('three times') || lower.includes('teen bar')) {
    return {
      frequency: 'Thrice a day after breakfast, lunch & dinner',
      instructions: 'Take after food with water',
    };
  }
  if (lower.includes('sos') || lower.includes('as needed') || lower.includes('jab jarurat')) {
    return {
      frequency: 'As needed during fever or severe pain (SOS)',
      instructions: 'Do not exceed 3-4 times in 24 hours',
    };
  }
  return {
    frequency: 'Once a day in morning after food',
    instructions: 'Take with clean drinking water',
  };
}

function extractMedications(text: string): Medication[] {
  const meds: Medication[] = [];
  const lines = text.split(/(?:,|\.|\band\b|;|\n)/i);

  const drugPatterns = [
    /((?:Tab|Tablet|Cap|Capsule|Syp|Syrup|Inj|Ointment)\s+[A-Za-z0-9\+\-\s]+?(?:\d+mg|\d+ml|\d+%|dispersible)?)\s*(?:,\s*|\s+)?(OD|BD|TDS|QID|SOS|Stat|HS|[A-Za-z\s]+)?(?:\s+(?:for\s+)?(\d+\s*(?:days?|weeks?|d)))?/i,
    /(Paracetamol|Telmisartan|Amlodipine|Metformin|Cetirizine|ORS|Azithromycin|Albendazole|Pantoprazole|Aceclofenac|Zinc|Amoxicillin)\s*(\d+mg)?\s*(OD|BD|TDS|QID|SOS|Stat|[A-Za-z\s]+)?/i,
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 4) continue;

    for (const pattern of drugPatterns) {
      const m = trimmed.match(pattern);
      if (m) {
        const drugName = m[1].trim();
        const duration = m[3] ? m[3] : '3 days';
        const parsedTiming = parseHumanFriendlyFrequency(trimmed);

        // Check duplicate
        if (!meds.some((existing) => existing.drug.toLowerCase() === drugName.toLowerCase())) {
          meds.push({
            id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            drug: drugName.startsWith('Tab') || drugName.startsWith('Cap') || drugName.startsWith('Syp') ? drugName : `Tab ${drugName}`,
            dosage: '1 unit',
            frequency: parsedTiming.frequency,
            duration,
            instructions: parsedTiming.instructions,
          });
        }
        break;
      }
    }
  }

  // Default fallback if no specific drug pattern extracted but words like "paracetamol" were in plan
  if (meds.length === 0) {
    if (/paracetamol|pcm/i.test(text)) {
      meds.push({
        id: `med_pcm_${Date.now()}`,
        drug: 'Tab Paracetamol 500mg',
        dosage: '1 tab',
        frequency: 'Thrice a day after breakfast, lunch & dinner',
        duration: '3 days',
        instructions: 'After food for fever & pain',
      });
    }
    if (/ors/i.test(text)) {
      meds.push({
        id: `med_ors_${Date.now()}`,
        drug: 'ORS Oral Rehydration Sachet',
        dosage: '1 packet in 1L water',
        frequency: 'Frequent sips throughout the day',
        duration: '3 days',
        instructions: 'Maintain abundant hydration',
      });
    }
  }

  return meds;
}
