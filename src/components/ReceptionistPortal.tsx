import React, { useState, useEffect } from 'react';
import { Patient, Visit, Gender, FacilityProfile } from '../types/clinical';
import { getPatients, savePatient, getVisits, markReportDelivered } from '../services/storage';
import { PrintableOpdSlip } from './PrintableOpdSlip';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import {
  UserPlus,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  Activity,
  Thermometer,
  Heart,
  Droplet,
  Send,
  Download,
  Stethoscope,
  Check,
  Bell,
  Eye,
} from 'lucide-react';

interface ReceptionistPortalProps {
  facility: FacilityProfile;
  onSwitchToDoctorForPatient?: (patient: Patient) => void;
}

export const ReceptionistPortal: React.FC<ReceptionistPortalProps> = ({
  facility,
  onSwitchToDoctorForPatient,
}) => {
  const [patients, setPatients] = useState<Patient[]>(getPatients());
  const [visits, setVisits] = useState<Visit[]>(getVisits());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'register'>('queue');

  // Intake registration form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [phone, setPhone] = useState('');
  const [fever, setFever] = useState('');
  const [bp, setBp] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [weight, setWeight] = useState('');
  const [pulse, setPulse] = useState('');
  const [currentProblem, setCurrentProblem] = useState('');
  const [priorProblems, setPriorProblems] = useState('');

  // Modals & alerts
  const [viewingSlipVisit, setViewingSlipVisit] = useState<Visit | null>(null);
  const [whatsappVisit, setWhatsappVisit] = useState<Visit | null>(null);
  const [registeredSuccessMessage, setRegisteredSuccessMessage] = useState<string | null>(null);

  // Sync state periodically and on window focus
  const refreshData = () => {
    setPatients(getPatients());
    setVisits(getVisits());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('focus', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('focus', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age || !currentProblem.trim()) return;

    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const today = new Date().toISOString().split('T')[0];

    const newPat = savePatient({
      name: name.trim(),
      age: parseInt(age, 10),
      gender,
      phone: phone.trim() || undefined,
      triage: {
        fever: fever.trim() ? (fever.includes('°') ? fever : `${fever} °F`) : undefined,
        bp: bp.trim() ? (bp.includes('mmHg') ? bp : `${bp} mmHg`) : undefined,
        bloodSugar: bloodSugar.trim() ? (bloodSugar.includes('mg') ? bloodSugar : `${bloodSugar} mg/dL`) : undefined,
        weight: weight.trim() ? (weight.includes('kg') ? weight : `${weight} kg`) : undefined,
        pulse: pulse.trim() ? (pulse.includes('bpm') ? pulse : `${pulse} bpm`) : undefined,
        currentProblem: currentProblem.trim(),
        priorProblems: priorProblems.trim() || undefined,
        recordedAt: `${today} ${currentTime}`,
        receptionistName: facility.receptionistName,
      },
      status: 'waiting_for_doctor',
    });

    refreshData();
    setRegisteredSuccessMessage(`Patient ${newPat.name} (${newPat.opdNumber}) registered and queued for doctor!`);
    setTimeout(() => setRegisteredSuccessMessage(null), 4000);

    setName('');
    setAge('');
    setPhone('');
    setFever('');
    setBp('');
    setBloodSugar('');
    setWeight('');
    setPulse('');
    setCurrentProblem('');
    setPriorProblems('');
    setActiveTab('queue');
  };

  const handleMarkDelivered = (visitId: string) => {
    markReportDelivered(visitId);
    refreshData();
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.opdNumber.toLowerCase().includes(q) ||
      (p.phone && p.phone.includes(q))
    );
  });

  const completedVisits = visits.filter((v) => v.isConfirmed);
  const latestCompletedVisit = completedVisits[0];

  return (
    <div className="space-y-6">
      {/* Warm Hospital Role Banner */}
      <div className="bg-[#1E4D3A] text-[#FAF8F5] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#3D8B6E] text-white px-2.5 py-0.5 rounded-full">
              Reception Desk Mode
            </span>
            <span className="text-xs text-[#D8F3DC]">{facility.name}</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Patient Intake & Report Delivery Portal</h1>
          <p className="text-xs text-[#E8F3EE]/80 mt-0.5">
            Receptionist: <strong>{facility.receptionistName}</strong> · Collect preliminary vitals and dispatch finished 1-2 page AI reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
              activeTab === 'register'
                ? 'bg-[#FFFFFF] text-[#1E4D3A]'
                : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#74C69D]" />
            <span>+ Register New Client</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
              activeTab === 'queue'
                ? 'bg-[#FFFFFF] text-[#1E4D3A]'
                : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-[#74C69D]" />
            <span>Live OPD Board ({patients.length})</span>
          </button>
        </div>
      </div>

      {/* PERSISTENT NEW REPORT NOTIFICATION BANNER (Shows regardless of active tab/page!) */}
      {latestCompletedVisit && (
        <div className="bg-[#E8F3EE] border border-[#B7E4C7] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E4D3A] text-white flex items-center justify-center shrink-0">
              <Bell className="w-4.5 h-4.5 text-[#D8F3DC]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1E4D3A]">
                  Latest Consultation Report Ready:
                </span>
                <strong className="text-xs text-[#182620]">{latestCompletedVisit.patientName}</strong>
                <span className="text-[10px] font-mono font-bold bg-white text-[#1E4D3A] px-2 py-0.5 rounded border border-[#C2E0D3]">
                  {latestCompletedVisit.opdSlipNumber}
                </span>
              </div>
              <p className="text-[11px] text-[#465A50] mt-0.5">
                Confirmed at {latestCompletedVisit.confirmedAt || 'Today'} by {latestCompletedVisit.confirmedByDoctor || facility.doctorName} · Diagnosis: {latestCompletedVisit.structured.impression}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setViewingSlipVisit(latestCompletedVisit)}
              className="px-3 py-1.5 bg-[#1E4D3A] hover:bg-[#163C2D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={() => setViewingSlipVisit(latestCompletedVisit)}
              className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] text-[#1E4D3A] border border-[#C2E0D3] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => setWhatsappVisit(latestCompletedVisit)}
              className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] text-[#1E4D3A] border border-[#C2E0D3] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-[#3D8B6E]" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {registeredSuccessMessage && (
        <div className="p-4 bg-[#E8F3EE] border border-[#C2E0D3] text-[#1E4D3A] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#3D8B6E] shrink-0" />
          <span>{registeredSuccessMessage}</span>
        </div>
      )}

      {/* VIEW A: REGISTER PATIENT FORM */}
      {activeTab === 'register' && (
        <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-[#E6E1D8] pb-3">
            <h2 className="text-base font-bold text-[#182620] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#3D8B6E]" />
              <span>Patient Intake & Preliminary Triage Information</span>
            </h2>
            <p className="text-xs text-[#718278]">
              Fill in client details and vital checks. The doctor will see this prior information before starting voice consultation.
            </p>
          </div>

          <form onSubmit={handleRegisterPatient} className="space-y-5">
            {/* 1. Basic Demographics */}
            <div>
              <span className="text-xs font-bold text-[#465A50] uppercase tracking-wider block mb-2">
                1. Client Identification
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#182620] mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Meera Devi"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D8B6E] font-medium text-[#182620]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#182620] mb-1">
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 34"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D8B6E] font-mono text-[#182620]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#182620] mb-1">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D8B6E] font-medium text-[#182620]"
                  >
                    <option value="male">Male (पुरुष)</option>
                    <option value="female">Female (महिला)</option>
                    <option value="other">Other (अन्य)</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-[#182620] mb-1">
                  Mobile Number (For WhatsApp / SMS report sharing)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number, e.g. 9876543210"
                  className="w-full sm:w-1/2 px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D8B6E] font-mono text-xs sm:text-sm text-[#182620]"
                />
              </div>
            </div>

            {/* 2. Triage & Preliminary Vitals */}
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6E1D8] space-y-3">
              <span className="text-xs font-bold text-[#1E4D3A] uppercase tracking-wider block">
                2. Preliminary Vitals (Checked at Reception)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#465A50] mb-1 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Fever / Temp (°F)</span>
                  </label>
                  <input
                    type="text"
                    value={fever}
                    onChange={(e) => setFever(e.target.value)}
                    placeholder="e.g. 101.4"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold text-[#182620]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#465A50] mb-1 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>BP (mmHg)</span>
                  </label>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="e.g. 138/86"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold text-[#182620]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#465A50] mb-1 flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-[#3D8B6E]" />
                    <span>Blood Sugar (RBS)</span>
                  </label>
                  <input
                    type="text"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    placeholder="e.g. 165 mg/dL"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold text-[#182620]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#465A50] mb-1 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Pulse (bpm)</span>
                  </label>
                  <input
                    type="text"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold text-[#182620]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#465A50] mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 62 kg"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E6E1D8] rounded font-mono font-bold text-[#182620]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Reason for Visit & Prior History */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#465A50] uppercase tracking-wider block">
                3. Symptoms & Medical Background
              </span>

              <div>
                <label className="block text-xs font-semibold text-[#182620] mb-1">
                  What is current problem patient is here to consult? *
                </label>
                <textarea
                  required
                  rows={2}
                  value={currentProblem}
                  onChange={(e) => setCurrentProblem(e.target.value)}
                  placeholder="e.g. High fever with severe shivering since 3 days, body ache and loss of appetite."
                  className="w-full p-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D8B6E] font-medium text-[#182620]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#182620] mb-1">
                  Any prior problems / chronic diseases?
                </label>
                <input
                  type="text"
                  value={priorProblems}
                  onChange={(e) => setPriorProblems(e.target.value)}
                  placeholder="e.g. Known diabetic since 4 years, high BP, takes Amlodipine 5mg"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D8B6E] text-[#182620]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#1E4D3A] hover:bg-[#163C2D] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Send className="w-4 h-4 text-[#D8F3DC]" />
                <span>Save Client Data & Queue for Doctor</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW B: LIVE OPD BOARD & REPORT DISPATCH */}
      {activeTab === 'queue' && (
        <div className="space-y-5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#718278]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registered patients by name, OPD slip number, or phone..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#E6E1D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D8B6E] shadow-2xs text-[#182620]"
            />
          </div>

          {/* Section 1: Ready to Print / Share / Download (Completed by Doctor) */}
          <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E1D8] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#E8F3EE] text-[#1E4D3A] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#182620]">
                    Consultation Completed Reports ({completedVisits.length})
                  </h3>
                  <p className="text-xs text-[#718278]">
                    AI-captured reports confirmed by Doctor · Ready to Download PDF, Print, or Share via WhatsApp
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#1E4D3A] bg-[#E8F3EE] px-2.5 py-0.5 rounded-full border border-[#C2E0D3]">
                Reports Desk
              </span>
            </div>

            <div className="space-y-3">
              {completedVisits.length > 0 ? (
                completedVisits.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#1E4D3A]">
                            {v.opdSlipNumber}
                          </span>
                          <h4 className="text-sm font-extrabold text-[#182620]">
                            {v.patientName}
                          </h4>
                          <span className="text-xs text-[#718278]">
                            ({v.patientAge}y / {v.patientGender})
                          </span>
                        </div>
                        <div className="text-[11px] text-[#718278] flex items-center gap-2 mt-0.5">
                          <span>Confirmed by {v.confirmedByDoctor || facility.doctorName}</span>
                          <span>·</span>
                          <span className="font-mono">{v.confirmedAt || v.visitDate}</span>
                        </div>
                      </div>

                      {/* Action buttons: Download PDF, Print, WhatsApp */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingSlipVisit(v)}
                          className="px-3 py-1.5 bg-[#1E4D3A] hover:bg-[#163C2D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
                        </button>

                        <button
                          onClick={() => setViewingSlipVisit(v)}
                          className="px-3 py-1.5 bg-white border border-[#E6E1D8] hover:bg-[#FAF8F5] text-[#1E4D3A] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-[#3D8B6E]" />
                          <span>Download PDF</span>
                        </button>

                        <button
                          onClick={() => setWhatsappVisit(v)}
                          className="px-3 py-1.5 bg-white border border-[#E6E1D8] hover:bg-[#FAF8F5] text-[#1E4D3A] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#3D8B6E]" />
                          <span>WhatsApp</span>
                        </button>

                        {!v.reportDeliveredToClient ? (
                          <button
                            onClick={() => handleMarkDelivered(v.id)}
                            className="px-2.5 py-1.5 bg-[#F6F4EF] hover:bg-[#E8F3EE] text-[#465A50] hover:text-[#1E4D3A] rounded-lg text-xs font-medium transition-colors"
                          >
                            Mark Delivered
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-[#3D8B6E] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Handed</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Brief 1-2 sentence AI visit summary */}
                    <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#E6E1D8] text-xs">
                      <span className="text-[10px] uppercase font-bold text-[#718278] block mb-0.5">
                        AI-Captured 1-Page Summary & Diagnosis:
                      </span>
                      <p className="text-[#182620] font-bold">
                        <strong>Diagnosis:</strong> {v.structured.impression}
                      </p>
                      <p className="text-[#465A50] mt-1 font-medium italic">
                        "{v.freeTextSummary}"
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#718278]">
                  No completed doctor consultations yet today. As soon as the doctor locks a session, the report will appear here ready to print or send.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Waiting in Queue for Doctor */}
          <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E1D8] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#182620]">
                  Active Waiting Queue for Doctor
                </h3>
                <p className="text-xs text-[#718278]">
                  Clients registered at reception waiting for doctor consultation
                </p>
              </div>
              <span className="text-xs font-mono text-[#718278]">
                Total: {filteredPatients.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPatients.map((pat) => {
                const isCompleted = pat.status === 'consultation_completed' || pat.status === 'report_delivered';
                return (
                  <div
                    key={pat.id}
                    className="p-4 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] flex flex-col justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#1E4D3A] font-bold">
                          {pat.opdNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-[#E8F3EE] text-[#1E4D3A] border border-[#C2E0D3]'
                              : 'bg-[#FCECE6] text-[#C85A32] border border-[#F3C7B6]'
                          }`}
                        >
                          {isCompleted ? 'Report Ready' : 'Waiting for Doctor'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#182620] mt-1">
                        {pat.name} ({pat.age}y / {pat.gender})
                      </h4>

                      {/* Triage Preview */}
                      <div className="mt-2 space-y-1 text-[#465A50]">
                        <p className="line-clamp-2">
                          <strong>Problem:</strong> {pat.triage?.currentProblem || 'General checkup'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-[#718278] mt-1">
                          {pat.triage?.fever && <span>Temp: {pat.triage.fever}</span>}
                          {pat.triage?.bp && <span>BP: {pat.triage.bp}</span>}
                          {pat.triage?.bloodSugar && <span>Sugar: {pat.triage.bloodSugar}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Quick switch to doctor action if testing */}
                    {onSwitchToDoctorForPatient && !isCompleted && (
                      <div className="pt-2 border-t border-[#E6E1D8] flex justify-end">
                        <button
                          onClick={() => onSwitchToDoctorForPatient(pat)}
                          className="px-3 py-1.5 text-xs font-bold text-[#1E4D3A] bg-[#E8F3EE] hover:bg-[#D5EADB] rounded-lg transition-colors flex items-center gap-1.5 border border-[#C2E0D3]"
                        >
                          <Stethoscope className="w-3.5 h-3.5 text-[#3D8B6E]" />
                          <span>Open as Doctor</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Slip Modal */}
      {viewingSlipVisit && (
        <PrintableOpdSlip
          visit={viewingSlipVisit}
          facility={facility}
          onClose={() => setViewingSlipVisit(null)}
        />
      )}

      {/* WhatsApp Modal */}
      {whatsappVisit && (
        <WhatsAppShareModal
          visit={whatsappVisit}
          facility={facility}
          onClose={() => setWhatsappVisit(null)}
        />
      )}
    </div>
  );
};
