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
import { createSpeechRecognizer } from '../services/speechRecognition';
import { parseClinicalTranscript } from '../services/rulesEngine';
import { saveVisit } from '../services/storage';
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
  Flame,
  Activity,
  HeartPulse,
  Baby,
  Stethoscope,
  Info,
} from 'lucide-react';

interface VoiceConsultationDeskProps {
  activePatient: Patient;
  facility: FacilityProfile;
  isFollowUp?: boolean;
  onPatientChangeRequest: () => void;
  onVisitSaved: () => void;
}

export const VoiceConsultationDesk: React.FC<VoiceConsultationDeskProps> = ({
  activePatient,
  facility,
  isFollowUp = false,
  onPatientChangeRequest,
  onVisitSaved,
}) => {
  // Clinic & template state
  const [selectedClinic, setSelectedClinic] = useState<ClinicType>('fever');
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN'>('en-IN');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer> | null>(null);

  // Clinical data state
  const [structured, setStructured] = useState<StructuredClinicalData>({
    chiefComplaint: '',
    duration: '3 days',
    history: '',
    vitals: { bp: '', pulse: '', temp: '', weight: '', spo2: '' },
    examination: '',
    impression: '',
    diagnosisCode: 'OPD-GEN',
    medications: [],
    advice: 'Adequate hydration, warm meals, and rest. Return immediately if danger signs develop.',
    followUpDays: 3,
  });
  const [freeTextSummary, setFreeTextSummary] = useState('');
  const [clinicalWarnings, setClinicalWarnings] = useState<string[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modals
  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // Current active template
  const currentTemplate = SPECIALTY_TEMPLATES[selectedClinic] || SPECIALTY_TEMPLATES.fever;

  // Initialize speech recognition
  useEffect(() => {
    recognizerRef.current = createSpeechRecognizer();
    return () => {
      recognizerRef.current?.stop();
    };
  }, []);

  // Update diagnosis code when template changes if empty
  useEffect(() => {
    if (!structured.impression && currentTemplate.diagnoses[0]) {
      setStructured((prev) => ({
        ...prev,
        impression: currentTemplate.diagnoses[0].textToAppend || '',
        diagnosisCode: currentTemplate.diagnoses[0].diagnosisCode || 'OPD-GEN',
      }));
    }
  }, [selectedClinic]);

  // Voice recording controls
  const handleToggleRecording = () => {
    setSpeechError(null);

    if (isRecording) {
      recognizerRef.current?.stop();
      setIsRecording(false);
      setInterimText('');
      // Run auto-structuring on stop
      if (transcript.trim()) {
        processTranscript(transcript);
      }
    } else {
      if (!recognizerRef.current?.isSupported) {
        setSpeechError(
          'Microphone recognition is not supported in this browser. Please use Chrome/Edge or click "Load Sample Dictation".'
        );
        return;
      }

      setIsRecording(true);
      recognizerRef.current.start(
        (interim: string) => {
          setInterimText(interim);
        },
        (finalChunk: string) => {
          setTranscript(finalChunk);
          setInterimText('');
        },
        (err: string) => {
          setSpeechError(err);
          setIsRecording(false);
        },
        speechLang
      );
    }
  };

  // Load preset sample dictation for instant testing
  const handleLoadSample = () => {
    const sample = currentTemplate.sampleDictation.transcript;
    setTranscript(sample);
    processTranscript(sample);
  };

  // Process transcript with rules engine + Gemini AI fallback
  const processTranscript = async (textToProcess: string) => {
    // 1. Run local rules engine immediately (0ms)
    const localResult = parseClinicalTranscript(textToProcess, {
      age: activePatient.age,
      gender: activePatient.gender,
      name: activePatient.name,
    });

    setStructured(localResult.structured);
    setClinicalWarnings(localResult.warnings);
    setFreeTextSummary(localResult.freeTextSummary);

    // 2. Call backend Gemini AI proxy for deeper SOAP synthesis if online
    try {
      setIsAiProcessing(true);
      const res = await fetch('/api/gemini/parse-clinical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToProcess,
          clinicType: currentTemplate.name,
          patientDemographics: {
            age: activePatient.age,
            gender: activePatient.gender,
            name: activePatient.name,
          },
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
            vitals: {
              bp: aiData.vitals?.bp || prev.vitals.bp,
              pulse: aiData.vitals?.pulse || prev.vitals.pulse,
              temp: aiData.vitals?.temp || prev.vitals.temp,
              weight: aiData.vitals?.weight || prev.vitals.weight,
              spo2: aiData.vitals?.spo2 || prev.vitals.spo2,
            },
            impression: aiData.impression || prev.impression,
            diagnosisCode: aiData.diagnosisCode || prev.diagnosisCode,
            medications:
              aiData.medications && aiData.medications.length > 0
                ? aiData.medications.map((m: any, i: number) => ({
                    id: `med_ai_${i}`,
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
      console.log('Gemini AI offline, local rules engine note active');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Add / append from checklist
  const handleAddSymptom = (text: string) => {
    setStructured((prev) => ({
      ...prev,
      history: prev.history ? `${prev.history} ${text}` : text,
    }));
  };

  const handleSetDiagnosis = (label: string, code?: string) => {
    setStructured((prev) => ({
      ...prev,
      impression: label,
      diagnosisCode: code || prev.diagnosisCode,
    }));
  };

  const handleAddMedicationTemplate = (medTemplate: Omit<Medication, 'id'>) => {
    const newMed: Medication = {
      ...medTemplate,
      id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    setStructured((prev) => ({
      ...prev,
      medications: [...prev.medications, newMed],
    }));
  };

  const handleRemoveMedication = (id: string) => {
    setStructured((prev) => ({
      ...prev,
      medications: prev.medications.filter((m) => m.id !== id),
    }));
  };

  // Save consultation visit
  const handleConfirmAndSave = () => {
    const today = new Date().toISOString().split('T')[0];
    const visitId = `vis_${Date.now()}`;
    const opdSlipNumber = `SLIP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVisit: Visit = {
      id: visitId,
      opdSlipNumber,
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientAge: activePatient.age,
      patientGender: activePatient.gender,
      patientPhone: activePatient.phone,
      visitDate: today,
      visitType: isFollowUp ? 'follow_up' : 'new',
      clinicType: selectedClinic,
      rawTranscript: transcript,
      structured,
      freeTextSummary: freeTextSummary || `${activePatient.name} evaluated for ${structured.chiefComplaint}.`,
      isConfirmed: true,
      facilityName: facility.name,
      doctorName: facility.doctorName,
    };

    saveVisit(newVisit);
    setSavedSuccess(true);
    onVisitSaved();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Build current visit object for modals
  const currentVisitData: Visit = {
    id: `vis_draft_${Date.now()}`,
    opdSlipNumber: `SLIP-2026-LIVE`,
    patientId: activePatient.id,
    patientName: activePatient.name,
    patientAge: activePatient.age,
    patientGender: activePatient.gender,
    patientPhone: activePatient.phone,
    visitDate: new Date().toISOString().split('T')[0],
    visitType: isFollowUp ? 'follow_up' : 'new',
    clinicType: selectedClinic,
    rawTranscript: transcript,
    structured,
    freeTextSummary,
    isConfirmed: true,
    facilityName: facility.name,
    doctorName: facility.doctorName,
  };

  const getTemplateIcon = (type: ClinicType) => {
    switch (type) {
      case 'fever':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'ncd':
        return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'anc':
        return <HeartPulse className="w-4 h-4 text-rose-500" />;
      case 'pediatric':
        return <Baby className="w-4 h-4 text-cyan-500" />;
      default:
        return <Stethoscope className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Active Patient Quick Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-lg shrink-0">
            {activePatient.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {activePatient.name}
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                {activePatient.opdNumber}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {isFollowUp ? 'Follow-up' : 'New OPD'}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{activePatient.age} Years</span>
              <span>·</span>
              <span className="capitalize">{activePatient.gender}</span>
              {activePatient.phone && (
                <>
                  <span>·</span>
                  <span className="font-mono">Ph: {activePatient.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onPatientChangeRequest}
          className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg self-start sm:self-auto hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Change Patient
        </button>
      </div>

      {/* Specialty Consultation Template Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Consultation Specialty
          </span>
          <span className="text-xs text-slate-400">Loads targeted prompts & rapid checklists</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(['fever', 'ncd', 'anc', 'pediatric', 'general'] as ClinicType[]).map((type) => {
            const tmpl = SPECIALTY_TEMPLATES[type];
            const isActive = selectedClinic === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedClinic(type)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {getTemplateIcon(type)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-hindi">{tmpl.hindiName}</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {tmpl.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Dictation Hub */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Hub Header & Language Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Speech Dictation & Audio Engine
              </h3>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                100% Free · On-Device Web Speech
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Speak naturally using the cue prompts below or click "Load Sample Dictation"
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={speechLang}
              onChange={(e) => setSpeechLang(e.target.value as any)}
              className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="en-IN">Indian English (en-IN)</option>
              <option value="hi-IN">Hindi (hi-IN) - हिंदी</option>
            </select>

            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Load Sample Dictation</span>
            </button>
          </div>
        </div>

        {/* Guided Cue Prompts */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
            Landmark Cue Guide for {currentTemplate.name}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {currentTemplate.cuePhrases.map((cue, idx) => (
              <span
                key={idx}
                className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/80 font-mono"
              >
                {cue}
              </span>
            ))}
          </div>
        </div>

        {/* Microphone Control & Waveform Display */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800">
          <button
            onClick={handleToggleRecording}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all transform active:scale-95 ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-rose-500/30'
                : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/30'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isRecording ? 'Listening live... Speak doctor note' : 'Click microphone to start voice dictation'}
              </span>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold font-mono animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  RECORDING
                </span>
              )}
            </div>

            {/* Live Audio Visualizer Bars */}
            {isRecording ? (
              <div className="flex items-center gap-1 h-6">
                {[40, 70, 90, 60, 30, 80, 100, 45, 65, 85, 50, 95, 75, 40, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-rose-500 rounded-full animate-pulse transition-all"
                    style={{
                      height: `${Math.max(20, (h * Math.random()) + 20)}%`,
                      animationDuration: `${0.4 + (i % 3) * 0.2}s`,
                    }}
                  ></div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Audio is transcribed directly in-browser at 0ms latency with zero cloud recording charges.
              </p>
            )}
          </div>

          <button
            onClick={() => processTranscript(transcript)}
            disabled={!transcript.trim() || isAiProcessing}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            {isAiProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>Process & Structure</span>
          </button>
        </div>

        {/* Speech Error Banner */}
        {speechError && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Live Transcript Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Spoken Transcript (Editable)
            </label>
            <span className="text-[11px] text-slate-400">
              {transcript.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <div className="relative">
            <textarea
              value={isRecording && interimText ? `${transcript} ${interimText}` : transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Spoken words will appear here in real time... You can also type or paste consultation notes directly."
              rows={3}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
            />
          </div>
        </div>
      </div>

      {/* Clinical Warnings Alert */}
      {clinicalWarnings.length > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Clinical Vitals Alert</span>
          </div>
          <ul className="list-disc pl-5 text-rose-700 dark:text-rose-400 space-y-0.5">
            {clinicalWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* One-Tap Checklists Drawer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            One-Tap Checklists for {currentTemplate.name}
          </h3>
          <p className="text-xs text-slate-500">Tap any item to instantly add to the note and prescription</p>
        </div>

        {/* Symptoms & Pertinent Negatives */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            1. Symptoms & History
          </span>
          <div className="flex flex-wrap gap-2">
            {currentTemplate.symptoms.map((s) => (
              <button
                key={s.id}
                onClick={() => handleAddSymptom(s.textToAppend || s.label)}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 text-slate-400" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Common Diagnoses */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            2. Likely Diagnoses
          </span>
          <div className="flex flex-wrap gap-2">
            {currentTemplate.diagnoses.map((d) => (
              <button
                key={d.id}
                onClick={() => handleSetDiagnosis(d.textToAppend || d.label, d.diagnosisCode)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 border ${
                  structured.diagnosisCode === d.diagnosisCode
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{d.label}</span>
                {d.diagnosisCode && (
                  <span className="text-[10px] font-mono opacity-80">({d.diagnosisCode})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Standard PHC Essential Medicines */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            3. PHC Essential Drug Kits
          </span>
          <div className="flex flex-wrap gap-2">
            {currentTemplate.treatments.map((t) => (
              <button
                key={t.id}
                onClick={() => t.medicationTemplate && handleAddMedicationTemplate(t.medicationTemplate)}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 text-slate-400" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Clinical SOAP Note Editor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Structured Clinical Note (SOAP)
            </h3>
            <p className="text-xs text-slate-500">Auto-populated by speech rules engine; fully editable</p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
            CODE: {structured.diagnosisCode}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Chief Complaint */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chief Complaint (मुख्य शिकायत)
            </label>
            <input
              type="text"
              value={structured.chiefComplaint}
              onChange={(e) => setStructured({ ...structured, chiefComplaint: e.target.value })}
              placeholder="e.g. High fever with chills"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Duration of Symptoms
            </label>
            <input
              type="text"
              value={structured.duration}
              onChange={(e) => setStructured({ ...structured, duration: e.target.value })}
              placeholder="e.g. 3 days, 1 week"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* History */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              History of Present Illness (HPI & Pertinent Negatives)
            </label>
            <textarea
              rows={2}
              value={structured.history}
              onChange={(e) => setStructured({ ...structured, history: e.target.value })}
              placeholder="e.g. Associated dry cough, no breathlessness, no bleeding"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Vitals Matrix */}
          <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
              Physical Vitals (शारीरिक मापदंड)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">BP (mmHg)</span>
                <input
                  type="text"
                  value={structured.vitals.bp || ''}
                  onChange={(e) =>
                    setStructured({
                      ...structured,
                      vitals: { ...structured.vitals, bp: e.target.value },
                    })
                  }
                  placeholder="120/80"
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Pulse (bpm)</span>
                <input
                  type="text"
                  value={structured.vitals.pulse || ''}
                  onChange={(e) =>
                    setStructured({
                      ...structured,
                      vitals: { ...structured.vitals, pulse: e.target.value },
                    })
                  }
                  placeholder="76"
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Temp (°F)</span>
                <input
                  type="text"
                  value={structured.vitals.temp || ''}
                  onChange={(e) =>
                    setStructured({
                      ...structured,
                      vitals: { ...structured.vitals, temp: e.target.value },
                    })
                  }
                  placeholder="98.6"
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Weight</span>
                <input
                  type="text"
                  value={structured.vitals.weight || ''}
                  onChange={(e) =>
                    setStructured({
                      ...structured,
                      vitals: { ...structured.vitals, weight: e.target.value },
                    })
                  }
                  placeholder="65 kg"
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono font-bold"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">SpO2 (%)</span>
                <input
                  type="text"
                  value={structured.vitals.spo2 || ''}
                  onChange={(e) =>
                    setStructured({
                      ...structured,
                      vitals: { ...structured.vitals, spo2: e.target.value },
                    })
                  }
                  placeholder="98%"
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Examination */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              General & Systemic Examination Findings
            </label>
            <input
              type="text"
              value={structured.examination}
              onChange={(e) => setStructured({ ...structured, examination: e.target.value })}
              placeholder="e.g. Chest clear, no petechial spots, abdomen soft non-tender"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Impression / Diagnosis */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Impression / Diagnosis (निदान)
            </label>
            <input
              type="text"
              value={structured.impression}
              onChange={(e) => setStructured({ ...structured, impression: e.target.value })}
              placeholder="e.g. Acute Febrile Illness - Suspected Dengue Fever"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
            />
          </div>
        </div>

        {/* Medications Table */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Prescribed Medications (दवा सूची)
            </label>
            <button
              onClick={() =>
                handleAddMedicationTemplate({
                  drug: 'New Generic Medicine',
                  dosage: '1 tab',
                  frequency: 'OD',
                  duration: '3 days',
                  instructions: 'After food',
                })
              }
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Drug</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700 rounded-lg">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-2 px-3">Drug Name</th>
                  <th className="py-2 px-3 w-28">Dosage</th>
                  <th className="py-2 px-3 w-36">Frequency</th>
                  <th className="py-2 px-3 w-24">Duration</th>
                  <th className="py-2 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                        className="w-full bg-transparent font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
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
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={m.frequency}
                        onChange={(e) => {
                          const updated = [...structured.medications];
                          updated[i].frequency = e.target.value;
                          setStructured({ ...structured, medications: updated });
                        }}
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
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
                        className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleRemoveMedication(m.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {structured.medications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-center text-slate-400 italic">
                      No medications added yet. Tap items from the checklist above or click "Add Custom Drug".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Free-text Summary for One-Pager */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Editable Free-Text Summary (1-Page Visit Summary)
          </label>
          <textarea
            rows={2}
            value={freeTextSummary}
            onChange={(e) => setFreeTextSummary(e.target.value)}
            placeholder="Auto-generated concise clinical visit sentence for patient record..."
            className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Sticky Bottom Consultation Command Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-lg sticky-bottom-bar">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {savedSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Visit Confirmed & Saved to PHC Records!</span>
              </span>
            ) : (
              <span>
                Ready to finalize note for <strong>{activePatient.name}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowWhatsApp(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setShowPrintSlip(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 1-Page Slip</span>
            </button>

            <button
              onClick={handleConfirmAndSave}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Save Visit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPrintSlip && (
        <PrintableOpdSlip
          visit={currentVisitData}
          facility={facility}
          onClose={() => setShowPrintSlip(false)}
        />
      )}

      {showWhatsApp && (
        <WhatsAppShareModal
          visit={currentVisitData}
          facility={facility}
          onClose={() => setShowWhatsApp(false)}
        />
      )}
    </div>
  );
};
