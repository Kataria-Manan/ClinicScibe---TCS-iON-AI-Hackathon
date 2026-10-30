import React, { useState } from 'react';
import { Patient, Visit, Gender, FacilityProfile } from '../types/clinical';
import { getPatients, savePatient, getVisitsForPatient } from '../services/storage';
import { PrintableOpdSlip } from './PrintableOpdSlip';
import {
  Search,
  UserPlus,
  History,
  Mic,
  Calendar,
  Phone,
  ArrowRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';

interface PatientQueueProps {
  onStartConsultationForPatient: (patient: Patient, isFollowUp: boolean) => void;
  facility: FacilityProfile;
}

export const PatientQueue: React.FC<PatientQueueProps> = ({
  onStartConsultationForPatient,
  facility,
}) => {
  const [patients, setPatients] = useState<Patient[]>(getPatients());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'today' | 'followup'>('all');
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Patient | null>(null);
  const [viewingHistoricalSlip, setViewingHistoricalSlip] = useState<Visit | null>(null);

  // New patient registration form state
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState<Gender>('male');
  const [regPhone, setRegPhone] = useState('');
  const [regAbha, setRegAbha] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regAge) return;

    const newPat = savePatient({
      name: regName.trim(),
      age: parseInt(regAge, 10),
      gender: regGender,
      phone: regPhone.trim() || undefined,
      abhaId: regAbha.trim() || undefined,
      triage: {
        currentProblem: 'OPD general consultation',
        recordedAt: `${today} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        receptionistName: facility.receptionistName,
      },
      status: 'waiting_for_doctor',
    });

    setPatients(getPatients());
    setShowRegModal(false);
    setRegName('');
    setRegAge('');
    setRegPhone('');
    setRegAbha('');

    // Immediately prompt to start consultation
    onStartConsultationForPatient(newPat, false);
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.opdNumber.toLowerCase().includes(q) ||
      (p.phone && p.phone.includes(q));

    if (!matchesSearch) return false;

    if (filterType === 'today') {
      return p.lastVisitDate === today;
    }
    if (filterType === 'followup') {
      return (p.visitCount || 1) > 1;
    }
    return true;
  });

  const patientHistoryVisits = selectedPatientForHistory
    ? getVisitsForPatient(selectedPatientForHistory.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">OPD Patient Queue & Records</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rapid 10-second registration and previous visit one-pager recall
          </p>
        </div>

        <button
          onClick={() => setShowRegModal(true)}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient Name, OPD Slip Number, or Phone..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white shadow-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl text-xs font-medium shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Registered ({patients.length})
          </button>
          <button
            onClick={() => setFilterType('today')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'today'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Today's Visits
          </button>
          <button
            onClick={() => setFilterType('followup')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterType === 'followup'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Returning Patients
          </button>
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => {
            const isToday = patient.lastVisitDate === today;
            return (
              <div
                key={patient.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400 block mb-0.5">
                        {patient.opdNumber}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {patient.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      {isToday && (
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Seen Today
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-medium capitalize">
                        {patient.age}y / {patient.gender}
                      </span>
                    </div>
                  </div>

                  {/* Metadata tags */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {patient.phone && (
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{patient.phone}</span>
                      </div>
                    )}

                    {patient.lastDiagnosis && (
                      <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 mt-2">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Last Diagnosis ({patient.lastVisitDate})
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                          {patient.lastDiagnosis}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setSelectedPatientForHistory(patient)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Past Visits ({patient.visitCount || 1})</span>
                  </button>

                  <button
                    onClick={() => onStartConsultationForPatient(patient, (patient.visitCount || 1) > 0)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Consult</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-500">No patients matched your search.</p>
            <button
              onClick={() => setShowRegModal(true)}
              className="mt-3 text-xs font-semibold text-sky-600 hover:underline"
            >
              + Register this patient now
            </button>
          </div>
        )}
      </div>

      {/* Patient History Modal */}
      {selectedPatientForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {selectedPatientForHistory.name} · Clinical History
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedPatientForHistory.opdNumber} · {selectedPatientForHistory.age}y / {selectedPatientForHistory.gender}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatientForHistory(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {patientHistoryVisits.length > 0 ? (
                patientHistoryVisits.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        <span>Visit Date: {v.visitDate}</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded uppercase">
                        {v.opdSlipNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Diagnosis</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {v.structured.impression}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Single-Page Summary</span>
                      <p className="text-slate-600 dark:text-slate-300 italic">
                        "{v.freeTextSummary}"
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setViewingHistoricalSlip(v)}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        View OPD Slip
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-6">
                  No documented previous visit notes yet for this patient.
                </p>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Ready for today's consultation?
              </span>
              <button
                onClick={() => {
                  const pat = selectedPatientForHistory;
                  setSelectedPatientForHistory(null);
                  onStartConsultationForPatient(pat, true);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4" />
                <span>Start Follow-up Consultation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Patient Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">New OPD Registration</h3>
                  <p className="text-xs text-slate-500">Quick 10-second patient intake</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Anand Varma"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    placeholder="e.g. 32"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender *
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="male">Male (पुरुष)</option>
                    <option value="female">Female (महिला)</option>
                    <option value="other">Other (अन्य)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ABHA ID (Ayushman Bharat Health Account)
                </label>
                <input
                  type="text"
                  value={regAbha}
                  onChange={(e) => setRegAbha(e.target.value)}
                  placeholder="e.g. 91-4458-1290-7841"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm"
                >
                  Register & Consult Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historical Slip Preview */}
      {viewingHistoricalSlip && (
        <PrintableOpdSlip
          visit={viewingHistoricalSlip}
          facility={facility}
          onClose={() => setViewingHistoricalSlip(null)}
        />
      )}
    </div>
  );
};
