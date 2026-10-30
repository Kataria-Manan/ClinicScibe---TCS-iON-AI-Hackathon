import React, { useState, useEffect, useRef } from 'react';
import {
  Patient,
  Visit,
  ClinicType,
  StructuredClinicalData,
  FacilityProfile,
  Medication,
} from '../types/clinical';
import { SPECIALTY_TEMPLATES } from '../data/templates';
import { createRobustSpeechController } from '../services/speechRecognition';
import { parseClinicalTranscript } from '../services/rulesEngine';
import { getPatients, saveVisit, updatePatientStatus } from '../services/storage';
import { PrintableOpdSlip } from './PrintableOpdSlip';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import {
  Mic,
  MicOff,
  Sparkles,
  Printer,
  Share2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Volume2,
  RefreshCw,
  Heart,
  Thermometer,
  Activity,
  Droplet,
  FileCheck,
  Save,
  Check,
  Calendar,
  Stethoscope,
} from 'lucide-react';

interface DoctorPortalProps {
  facility: FacilityProfile;
  initialSelectedPatientId?: string;
  onConsultationFinished?: () => void;
  onSwitchToReceptionist?: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  facility,
  initialSelectedPatientId,
  onConsultationFinished,
  onSwitchToReceptionist,
}) => {
  const [patients, setPatients] = useState<Patient[]>(getPatients());
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialSelectedPatientId || patients[0]?.id || ''
  );

  // Selected patient
  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Specialty consultation type
  const [selectedClinic, setSelectedClinic] = useState<ClinicType>('general');
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN'>('en-IN');

  // Voice recording & transcript state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [speechSavedNotice, setSpeechSavedNotice] = useState<string | null>(null);
  const speechControllerRef = useRef<ReturnType<typeof createRobustSpeechController> | null>(null);

  // Structured clinical note state
  const [structured, setStructured] = useState<StructuredClinicalData>({
    chiefComplaint: '',
    duration: '3 days',
    history: '',
    vitals: { bp: '', pulse: '', temp: '', weight: '', spo2: '', bloodSugar: '' },
    examination: '',
    impression: '',
    diagnosisCode: 'OPD-GEN',
    medications: [],
    advice: 'Adequate hydration, warm meals, and rest. Return immediately if danger signs develop.',
    followUpDays: 3,
  });
  const [freeTextSummary, setFreeTextSummary] = useState('');
  const [clinicalWarnings, setClinicalWarnings] = useState<string[]>([]);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);
  const [confirmedTime, setConfirmedTime] = useState<string | null>(null);

  // Modals
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const currentTemplate = SPECIALTY_TEMPLATES[selectedClinic] || SPECIALTY_TEMPLATES.general;

  // Initialize speech recorder
  useEffect(() => {
    speechControllerRef.current = createRobustSpeechController();
    return () => {
      speechControllerRef.current?.cancel();
    };
  }, []);

  // When active patient changes, populate with receptionist triage information
  useEffect(() => {
    if (activePatient) {
      setConfirmedSuccess(false);
      setConfirmedTime(null);
      setTranscript('');
      setSpeechSavedNotice(null);

      const triage = activePatient.triage;
      setStructured({
        chiefComplaint: triage?.currentProblem || '',
        duration: '3 days',
        history: triage?.priorProblems ? `Prior medical history: ${triage.priorProblems}` : '',
        vitals: {
          temp: triage?.fever || '',
          bp: triage?.bp || '',
          bloodSugar: triage?.bloodSugar || '',
          weight: triage?.weight || '',
          pulse: triage?.pulse || '',
        },
        examination: 'General physical examination: conscious, oriented.',
        impression: '',
        diagnosisCode: 'OPD-GEN',
        medications: [],
        advice: 'Adequate oral fluids, rest, and follow prescribed dosages.',
        followUpDays: 3,
      });

      // Auto-pick template
      const problemLower = (triage?.currentProblem || '').toLowerCase();
      if (problemLower.includes('fever') || problemLower.includes('chills') || problemLower.includes('dengue')) {
        setSelectedClinic('fever');
      } else if (problemLower.includes('sugar') || problemLower.includes('diabetes') || problemLower.includes('bp') || problemLower.includes('hypertension')) {
        setSelectedClinic('ncd');
      } else if (problemLower.includes('anc') || problemLower.includes('pregnant') || problemLower.includes('pregnancy')) {
        setSelectedClinic('anc');
      } else if (problemLower.includes('child') || problemLower.includes('loose stool') || problemLower.includes('diarrhea') || activePatient.age <= 12) {
        setSelectedClinic('pediatric');
      } else {
        setSelectedClinic('general');
      }
    }
  }, [selectedPatientId]);

  // Handle toggling microphone on/off
  const handleToggleVoice = async () => {
    setSpeechError(null);

    if (isRecording) {
      setIsRecording(false);
      setInterimText('');
      const captured = await speechControllerRef.current?.stop();
      if (captured && captured.trim()) {
        const updated = transcript ? `${transcript} ${captured.trim()}` : captured.trim();
        setTranscript(updated);
      }
    } else {
      setIsRecording(true);
      await speechControllerRef.current?.start(
        (interim) => setInterimText(interim),
        (finalChunk) => {
          setTranscript((prev) => {
            if (!prev) return finalChunk;
            if (prev.endsWith(finalChunk)) return prev;
            return `${prev} ${finalChunk}`;
          });
          setInterimText('');
        },
        (err) => {
          setSpeechError(err);
          setIsRecording(false);
        },
        speechLang
      );
    }
  };

  // EXPLICIT SAVE BUTTON (Requested by user: at right side end and below tap to mic button)
  const handleSaveSpeechAndExtractKeyPoints = async () => {
    // 1. Stop mic if recording
    if (isRecording) {
      setIsRecording(false);
      setInterimText('');
      const captured = await speechControllerRef.current?.stop();
      if (captured && captured.trim()) {
        const updated = transcript ? `${transcript} ${captured.trim()}` : captured.trim();
        setTranscript(updated);
        await processAndExtract(updated);
        return;
      }
    }

    const textToProcess = (transcript + (interimText ? ` ${interimText}` : '')).trim();

    if (!textToProcess) {
      setSpeechError('Please speak into the microphone or type some consultation notes before clicking save.');
      return;
    }

    setTranscript(textToProcess);
    await processAndExtract(textToProcess);
  };

  // Extraction logic: Local rules parser + Gemini AI structuring
  const processAndExtract = async (fullText: string) => {
    setIsAiProcessing(true);
    setSpeechError(null);

    // 1. Run deterministic local rules parser immediately (0ms)
    const localResult = parseClinicalTranscript(fullText, {
      age: activePatient.age,
      gender: activePatient.gender,
      name: activePatient.name,
    });

    const mergedVitals = {
      bp: localResult.structured.vitals.bp || activePatient.triage?.bp || '',
      pulse: localResult.structured.vitals.pulse || activePatient.triage?.pulse || '',
      temp: localResult.structured.vitals.temp || activePatient.triage?.fever || '',
      weight: localResult.structured.vitals.weight || activePatient.triage?.weight || '',
      spo2: localResult.structured.vitals.spo2 || '98%',
      bloodSugar: activePatient.triage?.bloodSugar || '',
    };

    setStructured({
      ...localResult.structured,
      chiefComplaint: localResult.structured.chiefComplaint || activePatient.triage?.currentProblem || '',
      history: `${activePatient.triage?.priorProblems ? `Prior: ${activePatient.triage.priorProblems}. ` : ''}${localResult.structured.history}`,
      vitals: mergedVitals,
    });
    setClinicalWarnings(localResult.warnings);
    setFreeTextSummary(localResult.freeTextSummary);

    // 2. Call backend Gemini AI proxy for deeper synthesis
    try {
      const res = await fetch('/api/gemini/parse-clinical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullText,
          clinicType: currentTemplate.name,
          patientDemographics: {
            age: activePatient.age,
            gender: activePatient.gender,
            name: activePatient.name,
          },
          triageData: activePatient.triage,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const aiData = json.data;
          setStructured((prev) => ({
            ...prev,
            chiefComplaint: aiData.chiefComplaint || prev.chiefComplaint,
            duration: aiData.duration || prev.duration,
            history: aiData.history || prev.history,
            examination: aiData.examination || prev.examination,
            impression: aiData.impression || prev.impression,
            diagnosisCode: aiData.diagnosisCode || prev.diagnosisCode,
            vitals: {
              ...prev.vitals,
              bp: aiData.vitals?.bp || prev.vitals.bp,
              pulse: aiData.vitals?.pulse || prev.vitals.pulse,
              temp: aiData.vitals?.temp || prev.vitals.temp,
              weight: aiData.vitals?.weight || prev.vitals.weight,
              spo2: aiData.vitals?.spo2 || prev.vitals.spo2,
            },
            medications:
              aiData.medications && aiData.medications.length > 0
                ? aiData.medications.map((m: any, idx: number) => ({
                    id: `med_${idx}`,
                    drug: m.drug,
                    dosage: m.dosage || '1 unit',
                    frequency: m.frequency || 'OD',
                    duration: m.duration || '3 days',
                    instructions: m.instructions || 'After meals',
                  }))
                : prev.medications,
            advice: aiData.advice || prev.advice,
            followUpDays: aiData.followUpDays || prev.followUpDays,
          }));

          if (aiData.freeTextSummary) {
            setFreeTextSummary(aiData.freeTextSummary);
          }
        }
      }
    } catch (e) {
      console.log('Gemini AI offline, local rules note maintained');
    } finally {
      setIsAiProcessing(false);
      setSpeechSavedNotice('Recorded speech saved successfully! Key points added to the summary below.');
      setTimeout(() => setSpeechSavedNotice(null), 4000);
    }
  };

  // Test simulation dialogue
  const handleSimulateDialogue = async () => {
    const triage = activePatient.triage;
    const sampleDialogue = `Doctor: Good morning ${activePatient.name}. I see the receptionist noted you have ${triage?.currentProblem || 'fever and weakness'}. How many days has this been happening?
Patient: Doctor sahab, it started 3 days ago. I had sudden high fever with chills, severe bodyache, and retro-orbital pain.
Doctor: On examination, temperature is ${triage?.fever || '101.8 Fahrenheit'}, pulse is ${triage?.pulse || '92 beats per minute'}, blood pressure ${triage?.bp || '128/80'}. Chest is clear bilaterally, throat is mildly congested, no petechial spots on skin.
Impression: Acute Febrile Illness, probable viral flu syndrome or dengue suspect.
Plan: Let us start Tab Paracetamol 650mg TDS after food for 3 days, Tab Cetirizine 10mg OD at night for 5 days, and ORS oral hydration sachet. Drink plenty of water and coconut water. If any warning signs like gum bleeding or vomiting occur, come to hospital immediately. Review after 3 days.`;

    setTranscript(sampleDialogue);
    await processAndExtract(sampleDialogue);
  };

  // Doctor confirmation with Date & Time (Sends to Receptionist)
  const handleDoctorConfirm = () => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const timestampStr = `${today} ${nowTime}`;
    const opdSlipNumber = `SLIP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const confirmedVisit: Visit = {
      id: `vis_${Date.now()}`,
      opdSlipNumber,
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientAge: activePatient.age,
      patientGender: activePatient.gender,
      patientPhone: activePatient.phone,
      visitDate: today,
      visitTime: nowTime,
      visitType: activePatient.visitCount > 1 ? 'follow_up' : 'new',
      clinicType: selectedClinic,
      triageData: activePatient.triage,
      rawTranscript: transcript,
      structured,
      freeTextSummary:
        freeTextSummary ||
        `${activePatient.name} evaluated by ${facility.doctorName} for ${structured.chiefComplaint}. Impression: ${structured.impression}. Follow-up in ${structured.followUpDays || 3} days.`,
      isConfirmed: true,
      confirmedAt: timestampStr,
      confirmedByDoctor: `${facility.doctorName} (${facility.doctorDesignation})`,
      facilityName: facility.name,
      doctorName: facility.doctorName,
      reportDeliveredToClient: false,
    };

    saveVisit(confirmedVisit);
    updatePatientStatus(activePatient.id, 'consultation_completed', confirmedVisit.id);
    setPatients(getPatients());
    setConfirmedSuccess(true);
    setConfirmedTime(timestampStr);

    if (onConsultationFinished) {
      onConsultationFinished();
    }
  };

  const currentVisitForSlip: Visit = {
    id: `vis_preview_${Date.now()}`,
    opdSlipNumber: `SLIP-2026-LIVE`,
    patientId: activePatient?.id || '',
    patientName: activePatient?.name || '',
    patientAge: activePatient?.age || 0,
    patientGender: activePatient?.gender || 'male',
    patientPhone: activePatient?.phone,
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    visitType: (activePatient?.visitCount || 1) > 1 ? 'follow_up' : 'new',
    clinicType: selectedClinic,
    triageData: activePatient?.triage,
    rawTranscript: transcript,
    structured,
    freeTextSummary,
    isConfirmed: true,
    confirmedAt: confirmedTime || 'Current Session',
    confirmedByDoctor: `${facility.doctorName} (${facility.doctorDesignation})`,
    facilityName: facility.name,
    doctorName: facility.doctorName,
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Hospital Banner */}
      <div className="bg-[#1E4D3A] text-[#FAF8F5] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#3D8B6E] text-white px-2.5 py-0.5 rounded-full">
              Doctor Consultation Desk
            </span>
            <span className="text-xs text-[#D8F3DC]">{facility.doctorName} · {facility.doctorDesignation}</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Active Clinical Examination & AI Scribe</h1>
          <p className="text-xs text-[#E8F3EE]/80 mt-0.5">
            Review receptionist triage, record doctor-patient consultation, save key points, and confirm report
          </p>
        </div>

        {onSwitchToReceptionist && (
          <button
            onClick={onSwitchToReceptionist}
            className="px-3.5 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] border border-[#52B788]/40 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto text-white shadow-2xs"
          >
            <span>Open Receptionist Desk</span>
          </button>
        )}
      </div>

      {/* Patient Queue Tabs (Click patient name tab) */}
      <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1E4D3A] uppercase tracking-wider">
            Patient Consultation Queue (Registered by Receptionist)
          </span>
          <span className="text-xs text-[#718278]">Select patient tab to consult</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {patients.map((p) => {
            const isSelected = p.id === activePatient.id;
            const isDone = p.status === 'consultation_completed' || p.status === 'report_delivered';
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`px-3.5 py-2.5 rounded-xl border text-left shrink-0 transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-[#E8F3EE] border-[#3D8B6E] text-[#1E4D3A] shadow-xs'
                    : 'bg-[#F9F8F6] border-[#E6E1D8] text-[#182620] hover:border-[#3D8B6E]/40'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected
                      ? 'bg-[#1E4D3A] text-white'
                      : 'bg-[#E6E1D8] text-[#182620]'
                  }`}
                >
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-[#718278] flex items-center gap-1 font-mono">
                    <span>{p.opdNumber}</span>
                    <span>·</span>
                    <span className={isDone ? 'text-[#3D8B6E] font-bold' : 'text-[#C85A32] font-semibold'}>
                      {isDone ? 'Report Ready' : 'Waiting'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED PATIENT: PRIOR RECEPTIONIST DATA */}
      {activePatient && (
        <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6E1D8] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#E8F3EE] text-[#1E4D3A] font-mono border border-[#C2E0D3]">
                  {activePatient.opdNumber}
                </span>
                <h2 className="text-lg font-extrabold text-[#182620]">
                  {activePatient.name}
                </h2>
                <span className="text-xs text-[#718278] capitalize">
                  ({activePatient.age} Years / {activePatient.gender})
                </span>
              </div>
              <p className="text-xs text-[#718278] mt-0.5">
                Intake recorded at: {activePatient.triage?.recordedAt || 'Today'} by {activePatient.triage?.receptionistName || 'Receptionist'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#465A50]">Specialty:</span>
              <select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value as ClinicType)}
                className="text-xs bg-[#F6F4EF] border border-[#E6E1D8] rounded-lg px-2.5 py-1.5 font-bold text-[#182620] focus:outline-none"
              >
                <option value="fever">Fever & Acute Infection</option>
                <option value="ncd">Hypertension & Diabetes</option>
                <option value="anc">Antenatal Care (ANC)</option>
                <option value="pediatric">Child Cough & Diarrhea</option>
                <option value="general">General Adult OPD</option>
              </select>
            </div>
          </div>

          {/* PRIOR INTAKE MENTIONED BY RECEPTIONIST */}
          <div className="bg-[#FBF7F0] border border-[#EEDDC4] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8C5E2E] uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#C85A32]" />
                <span>Prior Details Recorded by Receptionist (Before Consultation)</span>
              </span>
              <span className="text-[11px] text-[#8C5E2E]/80">Pre-Consultation Intake</span>
            </div>

            {/* Receptionist Triage Vitals Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-[#C85A32]" />
                  <span>Fever / Temp</span>
                </span>
                <span className="font-mono font-bold text-[#182620] text-xs">
                  {activePatient.triage?.fever || 'Not recorded'}
                </span>
              </div>

              <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#C85A32]" />
                  <span>Blood Pressure</span>
                </span>
                <span className="font-mono font-bold text-[#182620] text-xs">
                  {activePatient.triage?.bp || 'Not recorded'}
                </span>
              </div>

              <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-[#3D8B6E]" />
                  <span>Blood Sugar</span>
                </span>
                <span className="font-mono font-bold text-[#182620] text-xs">
                  {activePatient.triage?.bloodSugar || 'Not recorded'}
                </span>
              </div>

              <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[#C85A32]" />
                  <span>Pulse</span>
                </span>
                <span className="font-mono font-bold text-[#182620] text-xs">
                  {activePatient.triage?.pulse || 'Not recorded'}
                </span>
              </div>

              <div className="bg-[#FFFFFF] p-2 rounded-lg border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block">Weight</span>
                <span className="font-mono font-bold text-[#182620] text-xs">
                  {activePatient.triage?.weight || 'Not recorded'}
                </span>
              </div>
            </div>

            {/* Current problem & prior conditions */}
            <div className="space-y-1.5 text-xs">
              <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#EEDDC4]">
                <span className="text-[10px] uppercase font-bold text-[#8C5E2E] block">
                  Current Problem Patient is here to Consult:
                </span>
                <p className="text-[#182620] font-bold mt-0.5">
                  {activePatient.triage?.currentProblem || 'Routine medical evaluation'}
                </p>
              </div>

              {activePatient.triage?.priorProblems && (
                <div className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#EEDDC4]">
                  <span className="text-[10px] uppercase font-bold text-[#718278] block">
                    Any Other Prior Problems / Medical History:
                  </span>
                  <p className="text-[#465A50] mt-0.5">
                    {activePatient.triage.priorProblems}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR VOICE CAPTURE STATION WITH REQUESTED SAVE BUTTON */}
      <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E1D8] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1E4D3A]">
              Doctor-Patient Voice Consultation Recorder
            </h3>
            <p className="text-xs text-[#718278]">
              Speak consultation notes or dialogue. Click the Save button on the right to store speech & update key points.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={speechLang}
              onChange={(e) => setSpeechLang(e.target.value as any)}
              className="text-xs bg-[#F6F4EF] border border-[#E6E1D8] rounded-lg px-2.5 py-1.5 font-medium text-[#182620] focus:outline-none"
            >
              <option value="en-IN">Indian English (en-IN)</option>
              <option value="hi-IN">Hindi (hi-IN) - हिंदी</option>
            </select>

            <button
              onClick={handleSimulateDialogue}
              className="px-3 py-1.5 text-xs font-semibold text-[#1E4D3A] bg-[#E8F3EE] hover:bg-[#D5EADB] border border-[#C2E0D3] rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#3D8B6E]" />
              <span>Simulate Consultation Dialogue</span>
            </button>
          </div>
        </div>

        {/* Voice Trigger Row & Dedicated Save Button at Right Side End & Below */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D8] space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Mic trigger and status */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={handleToggleVoice}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all transform active:scale-95 ${
                  isRecording
                    ? 'bg-[#C85A32] text-white animate-pulse ring-4 ring-[#FCECE6]'
                    : 'bg-[#1E4D3A] hover:bg-[#163C2D] text-white'
                }`}
                title="Tap to start or stop recording speech"
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#182620]">
                    {isRecording ? 'Listening live to consultation...' : 'Tap to microphone button'}
                  </span>
                  {isRecording && (
                    <span className="text-[11px] font-bold text-[#C85A32] font-mono animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#C85A32]"></span>
                      RECORDING
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#718278] mt-0.5">
                  {isRecording ? 'Speak now into your microphone' : 'Tap mic to speak, then click Save on the right'}
                </p>
              </div>
            </div>

            {/* Visualizer when recording */}
            {isRecording && (
              <div className="flex items-center gap-1 h-6 w-full sm:w-48">
                {[45, 75, 100, 60, 40, 90, 75, 45, 95, 65, 85, 40, 70, 90].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#C85A32] rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDuration: `${0.3 + (i % 4) * 0.15}s`,
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>

          {/* DEDICATED SAVE BUTTON PLACED AT THE RIGHT SIDE END AND BELOW (Per User Request) */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-[#E6E1D8]/80 gap-3">
            <span className="text-xs text-[#718278]">
              Spoken something new? Click save to preserve text & generate key points in summary.
            </span>

            <button
              onClick={handleSaveSpeechAndExtractKeyPoints}
              disabled={isAiProcessing}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1E4D3A] hover:bg-[#163C2D] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isAiProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#E8F3EE]" />
              ) : (
                <Save className="w-4 h-4 text-[#D8F3DC]" />
              )}
              <span>Save Speech & Extract Key Points</span>
            </button>
          </div>
        </div>

        {/* Success toast after saving */}
        {speechSavedNotice && (
          <div className="p-3 bg-[#E8F3EE] border border-[#C2E0D3] text-[#1E4D3A] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#3D8B6E] shrink-0" />
            <span>{speechSavedNotice}</span>
          </div>
        )}

        {speechError && (
          <div className="p-3 bg-[#FCECE6] border border-[#F3C7B6] text-[#C85A32] rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Spoken Transcript Area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#182620]">
              Recorded Speech / Spoken Consultation Text
            </label>
            <span className="text-[11px] text-[#718278]">
              {transcript.split(/\s+/).filter(Boolean).length} words recorded
            </span>
          </div>
          <textarea
            rows={3}
            value={isRecording && interimText ? `${transcript} ${interimText}` : transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Spoken speech appears here. You can also edit, paste, or type manually, then click 'Save Speech & Extract Key Points'."
            className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D8B6E] font-sans text-[#182620]"
          />
        </div>
      </div>

      {/* EXTRACTED KEY POINTS & SUMMARY SECTION */}
      <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E6E1D8] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1E4D3A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3D8B6E]" />
              <span>Extracted Key Points & Clinical Summary Section</span>
            </h3>
            <p className="text-xs text-[#718278]">
              Generated from recorded speech & receptionist intake · Modify by typing or tapping voice again
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-[#E8F3EE] text-[#1E4D3A] font-bold rounded">
            CODE: {structured.diagnosisCode}
          </span>
        </div>

        {/* 1-2 Page Brief Patient Summary (Highlighted First) */}
        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6E1D8] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-[#1E4D3A] uppercase tracking-wide">
              1-2 Page Brief Visit Summary (Sent to Receptionist for Client Report)
            </label>
            <span className="text-[10px] text-[#718278]">Key Takeaways for Patient</span>
          </div>
          <textarea
            rows={3}
            value={freeTextSummary}
            onChange={(e) => setFreeTextSummary(e.target.value)}
            placeholder="Key points extracted from speech will appear here. The receptionist will print and share this report with the client."
            className="w-full p-3 text-xs bg-[#FFFFFF] border border-[#E6E1D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D8B6E] text-[#182620] font-sans font-medium leading-relaxed"
          />
        </div>

        {/* Vitals Matrix */}
        <div className="bg-[#F6F4EF] p-3 rounded-xl border border-[#E6E1D8] space-y-2">
          <span className="text-[10px] uppercase font-bold text-[#465A50] block">
            Vitals Matrix (Merged Receptionist Triage + Examination)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-[#718278] block mb-1">BP (mmHg)</span>
              <input
                type="text"
                value={structured.vitals.bp || ''}
                onChange={(e) =>
                  setStructured({ ...structured, vitals: { ...structured.vitals, bp: e.target.value } })
                }
                placeholder="120/80"
                className="w-full px-2 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#718278] block mb-1">Pulse (bpm)</span>
              <input
                type="text"
                value={structured.vitals.pulse || ''}
                onChange={(e) =>
                  setStructured({ ...structured, vitals: { ...structured.vitals, pulse: e.target.value } })
                }
                placeholder="76"
                className="w-full px-2 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#718278] block mb-1">Temp (°F)</span>
              <input
                type="text"
                value={structured.vitals.temp || ''}
                onChange={(e) =>
                  setStructured({ ...structured, vitals: { ...structured.vitals, temp: e.target.value } })
                }
                placeholder="98.6"
                className="w-full px-2 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#718278] block mb-1">Blood Sugar</span>
              <input
                type="text"
                value={structured.vitals.bloodSugar || ''}
                onChange={(e) =>
                  setStructured({ ...structured, vitals: { ...structured.vitals, bloodSugar: e.target.value } })
                }
                placeholder="140 mg/dL"
                className="w-full px-2 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#718278] block mb-1">Weight</span>
              <input
                type="text"
                value={structured.vitals.weight || ''}
                onChange={(e) =>
                  setStructured({ ...structured, vitals: { ...structured.vitals, weight: e.target.value } })
                }
                placeholder="65 kg"
                className="w-full px-2 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Extracted Clinical Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#182620] mb-1">
              Chief Complaint
            </label>
            <input
              type="text"
              value={structured.chiefComplaint}
              onChange={(e) => setStructured({ ...structured, chiefComplaint: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg font-bold text-[#182620]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182620] mb-1">
              Duration
            </label>
            <input
              type="text"
              value={structured.duration}
              onChange={(e) => setStructured({ ...structured, duration: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#182620] mb-1">
              History of Present Illness (HPI & Key Points)
            </label>
            <textarea
              rows={2}
              value={structured.history}
              onChange={(e) => setStructured({ ...structured, history: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#182620] mb-1">
              Physical Examination Findings
            </label>
            <input
              type="text"
              value={structured.examination}
              onChange={(e) => setStructured({ ...structured, examination: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#182620] mb-1">
              Clinical Impression / Diagnosis (निदान) *
            </label>
            <input
              type="text"
              required
              value={structured.impression}
              onChange={(e) => setStructured({ ...structured, impression: e.target.value })}
              placeholder="e.g. Acute Febrile Illness - Suspected Dengue Fever"
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg font-extrabold text-[#1E4D3A]"
            />
          </div>
        </div>

        {/* Prescriptions Table */}
        <div className="space-y-2 pt-2 border-t border-[#E6E1D8]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#182620]">
              Prescribed Generic Medications (दवाइयाँ)
            </label>
            <button
              onClick={() =>
                setStructured((prev) => ({
                  ...prev,
                  medications: [
                    ...prev.medications,
                    {
                      id: `med_${Date.now()}`,
                      drug: 'Tab Paracetamol 500mg',
                      dosage: '1 tab',
                      frequency: 'TDS (Three times daily)',
                      duration: '3 days',
                      instructions: 'After meals',
                    },
                  ],
                }))
              }
              className="text-xs text-[#1E4D3A] font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Medicine</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#E6E1D8] rounded-lg">
              <thead className="bg-[#FAF8F5] text-[#465A50] font-semibold">
                <tr>
                  <th className="py-2 px-3">Drug Name</th>
                  <th className="py-2 px-3 w-28">Dosage</th>
                  <th className="py-2 px-3 w-36">Frequency</th>
                  <th className="py-2 px-3 w-24">Duration</th>
                  <th className="py-2 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D8]">
                {structured.medications.map((m, i) => (
                  <tr key={m.id || i}>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={m.drug}
                        onChange={(e) => {
                          const updated = [...structured.medications];
                          updated[i].drug = e.target.value;
                          setStructured({ ...structured, medications: updated });
                        }}
                        className="w-full bg-transparent font-semibold focus:outline-none focus:ring-1 focus:ring-[#3D8B6E] rounded px-1"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={m.dosage}
                        onChange={(e) => {
                          const updated = [...structured.medications];
                          updated[i].dosage = e.target.value;
                          setStructured({ ...structured, medications: updated });
                        }}
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-[#3D8B6E] rounded px-1"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        list="frequency-options"
                        value={m.frequency}
                        onChange={(e) => {
                          const updated = [...structured.medications];
                          updated[i].frequency = e.target.value;
                          setStructured({ ...structured, medications: updated });
                        }}
                        placeholder="e.g. Twice a day after lunch & dinner"
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-[#3D8B6E] rounded px-1 text-xs"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={m.duration}
                        onChange={(e) => {
                          const updated = [...structured.medications];
                          updated[i].duration = e.target.value;
                          setStructured({ ...structured, medications: updated });
                        }}
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-[#3D8B6E] rounded px-1"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() =>
                          setStructured((prev) => ({
                            ...prev,
                            medications: prev.medications.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="text-[#718278] hover:text-[#C85A32] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {structured.medications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-center text-[#718278] italic">
                      No medications added yet. Tap "+ Add Medicine" or speak prescription during voice recording.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Datalist for Quick Selection of Friendly Medication Timings */}
          <datalist id="frequency-options">
            <option value="Once a day on hungry stomach (empty stomach)" />
            <option value="Twice a day after lunch & dinner" />
            <option value="Thrice a day after breakfast, lunch & dinner" />
            <option value="Once a day after dinner (at night)" />
            <option value="Once a day in morning after breakfast" />
            <option value="Twice a day on hungry stomach (before meals)" />
            <option value="As needed during fever or severe pain (SOS)" />
            <option value="Frequent sips throughout the day" />
          </datalist>
        </div>
      </div>

      {/* CONFIRMATION COMMAND BAR (SEND TO RECEPTIONIST) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#E6E1D8] p-3 sm:p-4 shadow-md sticky-bottom-bar">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#182620]">
            {confirmedSuccess ? (
              <span className="text-[#1E4D3A] flex items-center gap-1.5 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#3D8B6E]" />
                <span>Confirmed & Locked at {confirmedTime}! Sent directly to Receptionist desk for printing/sharing.</span>
              </span>
            ) : (
              <span>
                Active Session for <strong>{activePatient.name}</strong> ({activePatient.opdNumber})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowSlipModal(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-[#182620] bg-white hover:bg-[#F6F4EF] rounded-xl border border-[#E6E1D8] flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#465A50]" />
              <span>Preview Report Slip</span>
            </button>

            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-[#1E4D3A] bg-[#E8F3EE] hover:bg-[#D5EADB] rounded-xl border border-[#C2E0D3] flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#3D8B6E]" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleDoctorConfirm}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-extrabold text-white bg-[#1E4D3A] hover:bg-[#163C2D] active:bg-[#0F2A1F] rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <FileCheck className="w-4 h-4 text-[#D8F3DC]" />
              <span>Confirm & Send to Receptionist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slip Modal */}
      {showSlipModal && (
        <PrintableOpdSlip
          visit={currentVisitForSlip}
          facility={facility}
          onClose={() => setShowSlipModal(false)}
        />
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <WhatsAppShareModal
          visit={currentVisitForSlip}
          facility={facility}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  );
};
