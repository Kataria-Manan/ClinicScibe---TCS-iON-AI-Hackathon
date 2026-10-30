import { SpecialtyTemplate } from '../types/clinical';

export const SPECIALTY_TEMPLATES: Record<string, SpecialtyTemplate> = {
  fever: {
    id: 'fever',
    name: 'Fever & Acute Infection',
    hindiName: 'बुखार एवं संक्रमण',
    subtitle: 'Malaria, Dengue, Typhoid, Viral URTI & Acute Febrile Illness',
    iconName: 'Thermometer',
    vitalsToPrioritize: ['temp', 'pulse', 'bp', 'spo2'],
    cuePhrases: [
      'Chief complaint: high grade fever with chills...',
      'History: no rash, no bleeding, no vomiting...',
      'On examination: throat congested, chest clear, no petechiae...',
      'Impression: Acute febrile illness, suspect viral URTI...',
      'Plan: Tab Paracetamol 500mg, oral fluids, warning signs...',
    ],
    sampleDictation: {
      title: 'Dengue / Acute Viral Fever Suspect',
      transcript:
        'Chief complaint: 28-year-old male with high grade fever since 4 days associated with retro-orbital pain, severe body ache and mild dry cough. History: no epistaxis, no black stools, no vomiting. On examination: temperature 102.4 Fahrenheit, pulse 94 beats per minute, blood pressure 118 by 76, no petechiae, chest clear bilaterally, abdomen soft non-tender. Impression: Acute Febrile Illness, probable Dengue suspect or viral syndrome. Plan: Tab Paracetamol 650mg TDS for 3 days, Tab Cetirizine 10mg OD at night, advise adequate oral rehydration with ORS and coconut water. Advised complete blood count with platelet count today and urgent return if warning signs like bleeding gums or persistent vomiting develop. Review after 48 hours.',
    },
    symptoms: [
      { id: 'fever_chills', label: 'High grade with chills', targetField: 'symptom', textToAppend: 'Fever high grade with chills and rigors.' },
      { id: 'fever_retro', label: 'Retro-orbital headache', targetField: 'symptom', textToAppend: 'Complains of retro-orbital headache and generalized myalgia.' },
      { id: 'fever_no_bleed', label: 'No spontaneous bleeding', targetField: 'symptom', textToAppend: 'No history of epistaxis, gum bleeding, or melena.' },
      { id: 'fever_cough', label: 'Associated mild dry cough', targetField: 'symptom', textToAppend: 'Associated dry cough and mild sore throat.' },
      { id: 'fever_no_sob', label: 'No shortness of breath', targetField: 'symptom', textToAppend: 'No dyspnea, chest pain, or wheezing.' },
      { id: 'fever_rash', label: 'No skin eruptions/petechiae', targetField: 'symptom', textToAppend: 'No skin rash or macular eruptions noted.' },
    ],
    diagnoses: [
      { id: 'dx_urti', label: 'Viral URTI / Flu-like Illness', targetField: 'diagnosis', textToAppend: 'Acute Viral Upper Respiratory Tract Infection (URTI)', diagnosisCode: 'URTI' },
      { id: 'dx_dengue_suspect', label: 'Dengue Fever Suspect', targetField: 'diagnosis', textToAppend: 'Acute Febrile Illness - Suspected Dengue Fever', diagnosisCode: 'DENGUE-SUSP' },
      { id: 'dx_malaria_suspect', label: 'Malaria Suspect (AFI)', targetField: 'diagnosis', textToAppend: 'Acute Febrile Illness - Malaria Suspect (RDT indicated)', diagnosisCode: 'MALARIA-SUSP' },
      { id: 'dx_typhoid_suspect', label: 'Enteric Fever / Typhoid Suspect', targetField: 'diagnosis', textToAppend: 'Suspected Enteric Fever (Step-ladder pyrexia)', diagnosisCode: 'ENTERIC-SUSP' },
    ],
    treatments: [
      {
        id: 'rx_pcm_650',
        label: 'Tab Paracetamol 650mg (Thrice daily after meals)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Paracetamol 650mg', dosage: '1 tab', frequency: 'Thrice a day after breakfast, lunch & dinner', duration: '3 days', instructions: 'For fever & bodyache' },
      },
      {
        id: 'rx_ors_sachet',
        label: 'Oral Rehydration Salts (ORS) Sachet',
        targetField: 'medication',
        medicationTemplate: { drug: 'ORS Powder Sachet', dosage: '1 sachet in 1L water', frequency: 'Sip frequently throughout the day', duration: '3 days', instructions: 'Maintain abundant oral hydration' },
      },
      {
        id: 'rx_cetirizine_10',
        label: 'Tab Cetirizine 10mg (Once a day after dinner)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Cetirizine 10mg', dosage: '1 tab', frequency: 'Once a day after dinner (at night)', duration: '5 days', instructions: 'For allergic rhinitis / cold' },
      },
      {
        id: 'rx_azithro_500',
        label: 'Tab Azithromycin 500mg (Once a day on hungry stomach)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Azithromycin 500mg', dosage: '1 tab', frequency: 'Once a day on hungry stomach (empty stomach)', duration: '3 days', instructions: '1 hour before food' },
      },
    ],
  },

  ncd: {
    id: 'ncd',
    name: 'Hypertension & Diabetes',
    hindiName: 'उच्च रक्तचाप एवं मधुमेह',
    subtitle: 'NCD Clinic: Blood Pressure, Glycemic Control & Drug Refills',
    iconName: 'Activity',
    vitalsToPrioritize: ['bp', 'pulse', 'weight'],
    cuePhrases: [
      'Chief complaint: routine hypertension follow-up...',
      'History: compliant with Amlodipine 5mg, no chest pain...',
      'On examination: BP 142/88, pedal edema absent...',
      'Impression: Essential Hypertension stage 1, borderline...',
      'Plan: continue Telmisartan 40mg OD, brisk walking, salt restriction...',
    ],
    sampleDictation: {
      title: 'Hypertension & Type 2 Diabetes Routine Check',
      transcript:
        'Chief complaint: 54-year-old female for monthly NCD follow-up of hypertension and type 2 diabetes mellitus. History: compliant with medications, no headache, no dizziness, no chest pain or breathlessness, no polyuria. On examination: blood pressure 138 by 86, pulse 74 regular, weight 68 kg, random blood sugar 154 mg/dL. Systemic examination normal, bilateral pedal pulses palpable, no edema. Impression: Essential Hypertension controlled on therapy, Type 2 Diabetes Mellitus under fair control. Plan: continue Tab Telmisartan 40mg OD in morning, continue Tab Metformin 500mg BD after breakfast and dinner, dietary salt restriction below 5 grams daily, 30 minutes daily walking advised, check fasting blood sugar and serum creatinine next visit in 30 days.',
    },
    symptoms: [
      { id: 'ncd_compliant', label: 'Good medication compliance', targetField: 'symptom', textToAppend: 'Patient reports regular compliance with prescribed anti-hypertensive/diabetic drugs.' },
      { id: 'ncd_no_cp', label: 'No chest pain / angina', targetField: 'symptom', textToAppend: 'Denies exertional chest tightness, orthopnea, or palpitations.' },
      { id: 'ncd_no_edema', label: 'No bilateral pedal swelling', targetField: 'symptom', textToAppend: 'No bilateral pedal edema or periorbital puffiness.' },
      { id: 'ncd_no_headache', label: 'No morning headache/dizziness', targetField: 'symptom', textToAppend: 'No throbbing occipital headaches or visual blurriness.' },
      { id: 'ncd_lifestyle_mod', label: 'Dietary counseling completed', targetField: 'symptom', textToAppend: 'Counseled on low sodium, low carbohydrate, high fiber rural diet.' },
    ],
    diagnoses: [
      { id: 'dx_htn_stage1', label: 'Essential Hypertension (Controlled)', targetField: 'diagnosis', textToAppend: 'Essential Hypertension - Controlled on monotherapy', diagnosisCode: 'HTN-CTRL' },
      { id: 'dx_t2dm', label: 'Type 2 Diabetes Mellitus', targetField: 'diagnosis', textToAppend: 'Type 2 Diabetes Mellitus (T2DM)', diagnosisCode: 'T2DM' },
      { id: 'dx_htn_uncontrolled', label: 'Uncontrolled Hypertension', targetField: 'diagnosis', textToAppend: 'Essential Hypertension - Uncontrolled (Titration needed)', diagnosisCode: 'HTN-UNCTRL' },
    ],
    treatments: [
      {
        id: 'rx_telmi_40',
        label: 'Tab Telmisartan 40mg (Once a day on hungry stomach)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Telmisartan 40mg', dosage: '1 tab', frequency: 'Once a day in morning on hungry stomach (empty stomach)', duration: '30 days', instructions: 'Take with a glass of water' },
      },
      {
        id: 'rx_amlo_5',
        label: 'Tab Amlodipine 5mg (Once a day in morning)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Amlodipine 5mg', dosage: '1 tab', frequency: 'Once a day in morning after breakfast', duration: '30 days', instructions: 'Daily morning dose' },
      },
      {
        id: 'rx_metformin_500',
        label: 'Tab Metformin 500mg (Twice a day after lunch & dinner)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Metformin 500mg', dosage: '1 tab', frequency: 'Twice a day after lunch & dinner', duration: '30 days', instructions: 'Immediately after meals' },
      },
      {
        id: 'rx_glimepiride_1',
        label: 'Tab Glimepiride 1mg (Once a day before breakfast on hungry stomach)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Glimepiride 1mg', dosage: '1 tab', frequency: 'Once a day before breakfast on hungry stomach', duration: '30 days', instructions: '15 mins before morning food' },
      },
    ],
  },

  anc: {
    id: 'anc',
    name: 'Antenatal Care (ANC)',
    hindiName: 'प्रसव पूर्व जांच (ANC)',
    subtitle: 'Maternal Health, Trimester Monitoring & High-Risk Screening',
    iconName: 'HeartPulse',
    vitalsToPrioritize: ['bp', 'weight', 'pulse'],
    cuePhrases: [
      'Chief complaint: 2nd trimester routine ANC checkup...',
      'History: G2P1L1, 24 weeks gestation, quickening felt...',
      'On examination: BP 110/70, fundal height 24 weeks, FHS regular 142...',
      'Impression: Single live intrauterine pregnancy at 24 weeks, low risk...',
      'Plan: continue Iron-Folic Acid, Calcium, Td booster advised...',
    ],
    sampleDictation: {
      title: 'ANC 2nd Trimester Routine Follow-up',
      transcript:
        'Chief complaint: 24-year-old Primigravida at 26 weeks gestational age for routine antenatal visit. History: good fetal movements felt daily, no vaginal bleeding, no leaking per vaginum, no epigastric pain or visual disturbance. History of completing 1st dose of Td vaccine. On examination: pallor absent, blood pressure 114 by 72, weight 54 kg with 3 kg weight gain in last month, no pedal edema. Obstetric exam: fundal height corresponds to 26 weeks, fetal heart sound audible and regular at 144 beats per minute. Urine alb/sugar negative by dipstick. Impression: Single live intrauterine pregnancy at 26 weeks, normotensive, low risk pregnancy. Plan: continue Tab Iron and Folic Acid 1 tablet daily, Tab Calcium 500mg 1 tablet twice daily with 4 hour gap from iron, administer 2nd dose of Td today, counsel on danger signs like swelling, headache or reduced fetal movements. Next ANC visit after 4 weeks.',
    },
    symptoms: [
      { id: 'anc_quickening', label: 'Active fetal kicks felt', targetField: 'symptom', textToAppend: 'Good fetal movements perceived regularly by the mother.' },
      { id: 'anc_no_leaking', label: 'No leaking / bleeding PV', targetField: 'symptom', textToAppend: 'No bleeding per vaginum, no watery discharge or foul odor.' },
      { id: 'anc_no_headache', label: 'No pre-eclampsia danger signs', targetField: 'symptom', textToAppend: 'No severe frontal headache, blurring of vision, or epigastric pain.' },
      { id: 'anc_no_edema', label: 'No sudden weight spike / edema', targetField: 'symptom', textToAppend: 'No sudden facial puffiness or pathological pedal edema.' },
    ],
    diagnoses: [
      { id: 'dx_anc_normal', label: 'Normal Antenatal State (Low Risk)', targetField: 'diagnosis', textToAppend: 'Single Live Intrauterine Pregnancy (Low Risk ANC)', diagnosisCode: 'ANC-NORM' },
      { id: 'dx_anc_anemia', label: 'Mild to Moderate Gestational Anemia', targetField: 'diagnosis', textToAppend: 'Pregnancy with Nutritional Anemia', diagnosisCode: 'ANC-ANEMIA' },
      { id: 'dx_anc_pih', label: 'Gestational Hypertension / PIH Suspect', targetField: 'diagnosis', textToAppend: 'Pregnancy Induced Hypertension (PIH) Suspect', diagnosisCode: 'ANC-PIH' },
    ],
    treatments: [
      {
        id: 'rx_ifa',
        label: 'Tab Iron & Folic Acid (100mg elemental Fe + 0.5mg FA)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab IFA (Iron & Folic Acid)', dosage: '1 tab', frequency: 'OD (After dinner)', duration: '100 days', instructions: 'Do not take with tea or milk' },
      },
      {
        id: 'rx_calcium',
        label: 'Tab Calcium 500mg + Vit D3 (BD x 100d)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Calcium 500mg + Vit D3', dosage: '1 tab', frequency: 'BD (After breakfast/lunch)', duration: '100 days', instructions: '4 hours away from IFA' },
      },
      {
        id: 'rx_albendazole_anc',
        label: 'Tab Albendazole 400mg single dose (2nd trim)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Albendazole 400mg', dosage: '1 tab', frequency: 'Stat (Single dose)', duration: '1 day', instructions: 'Chew at night (deworming)' },
      },
      {
        id: 'rx_td_inj',
        label: 'Inj Tetanus & adult Diphtheria (Td) 0.5ml IM',
        targetField: 'medication',
        medicationTemplate: { drug: 'Inj Td (Tetanus-Diphtheria)', dosage: '0.5 ml', frequency: 'Stat IM', duration: '1 dose', instructions: 'Left upper arm deltoid IM' },
      },
    ],
  },

  pediatric: {
    id: 'pediatric',
    name: 'Child with Cough & Diarrhea',
    hindiName: 'शिशु रोग (खांसी व दस्त)',
    subtitle: 'IMNCI Protocol: Respiratory Infection, Diarrhea & Dehydration',
    iconName: 'Baby',
    vitalsToPrioritize: ['temp', 'weight', 'pulse', 'spo2'],
    cuePhrases: [
      'Chief complaint: 3-year-old child with loose stools since 2 days...',
      'History: no blood in stools, drinking eagerly, no convulsions...',
      'On examination: weight 12 kg, skin pinch goes back quickly, chest clear, no chest indrawing...',
      'Impression: Acute watery diarrhea with some dehydration...',
      'Plan: ORS plan B, Tab Zinc 20mg daily for 14 days, continue breast/family feeding...',
    ],
    sampleDictation: {
      title: 'Pediatric Acute Diarrhea & Mild Cough (IMNCI)',
      transcript:
        'Chief complaint: 2-year-6-month-old female child brought by mother with loose watery stools 5 times a day since yesterday and runny nose. History: child is drinking water eagerly, no blood in stool, no vomiting, no lethargy or convulsions, passing urine normally. On examination: weight 11.5 kg, temperature 99.2 Fahrenheit, pulse 110, respiratory rate 30 breaths per minute, no chest indrawing, no stridor, skin pinch goes back immediately, sunken eyes absent, alert and playful. Impression: Acute Watery Diarrhea with No Dehydration, mild viral rhinorrhea. Plan: Oral Rehydration Salts (ORS) 100 to 200 ml after each loose stool, Tab Zinc 20mg dispersible 1 tablet daily dissolved in mother milk or clean water for 14 days complete course, continue normal feeding including curd and khichdi, counsel mother to bring child immediately if child cannot drink, passes blood in stool, or becomes lethargic. Review in 2 days.',
    },
    symptoms: [
      { id: 'ped_drinking_eager', label: 'Drinking eagerly / thirsty', targetField: 'symptom', textToAppend: 'Child is alert and drinking fluids eagerly.' },
      { id: 'ped_no_blood_stool', label: 'No blood in stool (Non-dysenteric)', targetField: 'symptom', textToAppend: 'Watery non-bloody stools without mucus or tenesmus.' },
      { id: 'ped_no_chest_indraw', label: 'No fast breathing / chest indrawing', targetField: 'symptom', textToAppend: 'No chest indrawing, no stridor, respiration rate within normal limits.' },
      { id: 'ped_no_convulsion', label: 'No danger signs (alert, feeds well)', targetField: 'symptom', textToAppend: 'No general danger signs: able to feed, no vomiting everything, no convulsions.' },
    ],
    diagnoses: [
      { id: 'dx_ped_diarrhea_no_dehyd', label: 'Acute Watery Diarrhea (No Dehydration)', targetField: 'diagnosis', textToAppend: 'Acute Watery Diarrhea - No Dehydration (IMNCI Plan A)', diagnosisCode: 'GE-NO-DEHYD' },
      { id: 'dx_ped_ari', label: 'Acute Respiratory Infection (No Pneumonia)', targetField: 'diagnosis', textToAppend: 'Acute Respiratory Infection (Cough & Cold - No Pneumonia)', diagnosisCode: 'ARI-NO-PNEU' },
      { id: 'dx_ped_pneumonia', label: 'Pneumonia (Fast Breathing)', targetField: 'diagnosis', textToAppend: 'Pneumonia according to IMNCI (Fast breathing present)', diagnosisCode: 'PNEUMONIA' },
    ],
    treatments: [
      {
        id: 'rx_ped_zinc',
        label: 'Tab Zinc 20mg Dispersible (OD x 14d)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Zinc Dispersible 20mg', dosage: '1 tab', frequency: 'OD (Once daily)', duration: '14 days', instructions: 'Dissolve in clean water/milk, finish full 14 days' },
      },
      {
        id: 'rx_ped_ors',
        label: 'ORS Solution Plan A (Post-stool)',
        targetField: 'medication',
        medicationTemplate: { drug: 'ORS Oral Solution', dosage: '100-200 ml', frequency: 'After every loose motion', duration: '3 days', instructions: 'Small frequent sips using spoon' },
      },
      {
        id: 'rx_ped_pcm_syp',
        label: 'Syp Paracetamol 120mg/5ml (SOS)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Syp Paracetamol 120mg/5ml', dosage: '5 ml', frequency: 'SOS (If temp > 100 F)', duration: '3 days', instructions: 'Max 4 times in 24 hours' },
      },
      {
        id: 'rx_ped_amox_syp',
        label: 'Syp Amoxicillin 125mg/5ml (TDS x 5d)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Syp Amoxicillin 125mg/5ml', dosage: '5 ml', frequency: 'TDS (Three times daily)', duration: '5 days', instructions: 'Only if bacterial infection confirmed' },
      },
    ],
  },

  general: {
    id: 'general',
    name: 'General Adult OPD',
    hindiName: 'सामान्य बहिरंग विभाग',
    subtitle: 'Musculoskeletal, Gastrointestinal, Skin & Allergic Conditions',
    iconName: 'Stethoscope',
    vitalsToPrioritize: ['bp', 'pulse', 'temp', 'weight'],
    cuePhrases: [
      'Chief complaint: generalized bodyache and acidity...',
      'History: lower back pain aggravated by farming work, burning epigastric discomfort...',
      'On examination: lumbar spine tenderness, SLR negative, abdomen soft...',
      'Impression: Mechanical lower back pain with functional dyspepsia...',
      'Plan: Tab Aceclofenac + Paracetamol, Tab Pantoprazole 40mg...',
    ],
    sampleDictation: {
      title: 'Musculoskeletal Back Strain & Gastritis',
      transcript:
        'Chief complaint: 42-year-old agricultural laborer with lower back ache radiating to gluteal region since 1 week after lifting heavy fertilizer sacks, associated with burning sensation in upper abdomen and sour burps. History: pain increases with forward bending, relieved by rest, no leg weakness, no bowel or bladder incontinence, taking over-the-counter painkillers on empty stomach. On examination: blood pressure 124 by 80, pulse 76, lumbar paraspinal muscle spasm present, straight leg raising test bilateral 80 degrees negative, epigastric tenderness mild, abdomen soft non-tender elsewhere. Impression: Acute Mechanical Lumbo-sacral Muscle Strain and NSAID-induced Dyspepsia. Plan: Tab Aceclofenac 100mg plus Paracetamol 325mg twice daily after meals for 4 days, Tab Pantoprazole 40mg once daily 30 minutes before breakfast for 7 days, local hot water fermentation and lumbar flexion posture education, avoid heavy lifting for 1 week. Review if pain persists beyond 5 days.',
    },
    symptoms: [
      { id: 'gen_backache', label: 'Mechanical back pain', targetField: 'symptom', textToAppend: 'Lumbosacral pain worsened by physical exertion and forward bending.' },
      { id: 'gen_dyspepsia', label: 'Epigastric burning / acidity', targetField: 'symptom', textToAppend: 'Complains of retrosternal burning and postprandial fullness.' },
      { id: 'gen_joint_pain', label: 'Bilateral knee joint pain', targetField: 'symptom', textToAppend: 'Pain in bilateral knee joints on standing and walking; crepitus present.' },
      { id: 'gen_itching', label: 'Pruritic fungal / skin rash', targetField: 'symptom', textToAppend: 'Intense pruritus with erythematous annular lesions over flexural areas.' },
      { id: 'gen_headache_tension', label: 'Tension-type diffuse headache', targetField: 'symptom', textToAppend: 'Band-like dull aching headache without nausea or photophobia.' },
    ],
    diagnoses: [
      { id: 'dx_gen_lba', label: 'Mechanical Lower Back Ache (LBA)', targetField: 'diagnosis', textToAppend: 'Acute Mechanical Lumbar Strain (LBA)', diagnosisCode: 'LBA' },
      { id: 'dx_gen_gerd', label: 'Gastroesophageal Reflux / Dyspepsia', targetField: 'diagnosis', textToAppend: 'Functional Dyspepsia / GERD', diagnosisCode: 'DYSPEPSIA' },
      { id: 'dx_gen_oa', label: 'Osteoarthritis Knees (OA)', targetField: 'diagnosis', textToAppend: 'Bilateral Primary Osteoarthritis of Knees', diagnosisCode: 'OA-KNEE' },
      { id: 'dx_gen_tinea', label: 'Tinea Corporis / Cruris', targetField: 'diagnosis', textToAppend: 'Superficial Dermatophytosis (Tinea Corporis)', diagnosisCode: 'TINEA' },
    ],
    treatments: [
      {
        id: 'rx_panto_40',
        label: 'Tab Pantoprazole 40mg (OD Ante-cibum x 7d)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Pantoprazole 40mg', dosage: '1 tab', frequency: 'OD (Morning)', duration: '7 days', instructions: '30 mins before breakfast' },
      },
      {
        id: 'rx_aceclo_pcm',
        label: 'Tab Aceclofenac 100mg + Paracetamol 325mg (BD x 4d)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Tab Aceclofenac + Paracetamol', dosage: '1 tab', frequency: 'BD (Twice daily)', duration: '4 days', instructions: 'Strictly after food' },
      },
      {
        id: 'rx_b_complex',
        label: 'Cap Vitamin B-Complex with Zinc (OD x 15d)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Cap B-Complex + Zinc', dosage: '1 cap', frequency: 'OD (After lunch)', duration: '15 days', instructions: 'General neuro-nutritional support' },
      },
      {
        id: 'rx_clotrimazole_cream',
        label: 'Clotrimazole 1% Cream (Apply BD x 14d)',
        targetField: 'medication',
        medicationTemplate: { drug: 'Clotrimazole 1% Cream', dosage: 'Thin film', frequency: 'BD (Twice daily)', duration: '14 days', instructions: 'Apply clean & dry local skin' },
      },
    ],
  },
};
