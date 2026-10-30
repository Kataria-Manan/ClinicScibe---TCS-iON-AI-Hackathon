import React from 'react';
import { Visit, FacilityProfile } from '../types/clinical';
import { Printer, X, Download, ShieldCheck, Thermometer, Activity, Droplet, Heart } from 'lucide-react';

interface PrintableOpdSlipProps {
  visit: Visit;
  facility: FacilityProfile;
  onClose: () => void;
}

export const PrintableOpdSlip: React.FC<PrintableOpdSlipProps> = ({
  visit,
  facility,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const calculateNextDate = (days?: number) => {
    const d = new Date(visit.visitDate || new Date());
    d.setDate(d.getDate() + (days || 3));
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const triage = visit.triageData;

  return (
    <div className="fixed inset-0 z-50 bg-[#182620]/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start print:p-0 print:static print:bg-white print:overflow-visible">
      {/* Container */}
      <div className="bg-[#FFFFFF] text-[#182620] w-full max-w-3xl rounded-2xl shadow-2xl border border-[#E6E1D8] overflow-hidden printable-opd-slip print:border-none print:shadow-none print:rounded-none">
        {/* Screen-only top action bar */}
        <div className="no-print bg-[#FAF8F5] border-b border-[#E6E1D8] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#182620]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3D8B6E]"></span>
            <span>Government PHC OPD Slip Preview · Digitally Generated</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#1E4D3A] hover:bg-[#163C2D] rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#182620] bg-white border border-[#E6E1D8] hover:bg-[#FAF8F5] rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Prints or saves directly as PDF via your browser's print destination"
            >
              <Download className="w-3.5 h-3.5 text-[#3D8B6E]" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-[#718278] hover:bg-[#E6E1D8] flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Prescription Content */}
        <div className="p-6 sm:p-8 space-y-4 print:p-0 print:space-y-3 font-sans text-xs sm:text-sm">
          {/* Official PHC Header */}
          <div className="border-b-2 border-[#1E4D3A] pb-3 text-center space-y-1">
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#465A50]">
              Department of Medical Health & Family Welfare · Government of {facility.state}
            </div>
            <h1 className="text-base sm:text-xl font-extrabold text-[#1E4D3A] tracking-tight">
              {facility.name}
            </h1>
            <div className="text-[11px] text-[#718278]">
              {facility.subCentre ? `${facility.subCentre} · ` : ''}{facility.block}, {facility.district}, {facility.state}
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-[#465A50] font-medium border-t border-[#E6E1D8] mt-2">
              <span>OPD Slip No: <strong className="font-mono text-[#182620]">{visit.opdSlipNumber}</strong></span>
              <span>Date: <strong>{new Date(visit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong> {visit.visitTime ? `(${visit.visitTime})` : ''}</span>
              <span className="uppercase text-[10px] px-2 py-0.5 border border-[#3D8B6E] text-[#1E4D3A] font-bold rounded">
                {visit.visitType === 'new' ? 'New Consultation' : 'Follow-up Visit'}
              </span>
            </div>
          </div>

          {/* Patient Demographics Matrix */}
          <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[#718278] block text-[10px] uppercase font-semibold">Patient Name</span>
              <span className="font-bold text-[#182620]">{visit.patientName}</span>
            </div>
            <div>
              <span className="text-[#718278] block text-[10px] uppercase font-semibold">Age / Gender</span>
              <span className="font-semibold text-[#182620] capitalize">
                {visit.patientAge} Years / {visit.patientGender}
              </span>
            </div>
            <div>
              <span className="text-[#718278] block text-[10px] uppercase font-semibold">Contact / Mobile</span>
              <span className="font-mono text-[#182620]">{visit.patientPhone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#718278] block text-[10px] uppercase font-semibold">Clinic Stream</span>
              <span className="font-semibold text-[#1E4D3A] capitalize">{visit.clinicType} OPD</span>
            </div>
          </div>

          {/* Receptionist Triage & Intake Summary (Pre-consultation Record) */}
          <div className="bg-[#FBF7F0] border border-[#EEDDC4] rounded-xl p-2.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#8C5E2E]">
              <span>Receptionist Pre-Consultation Vitals & Intake</span>
              {triage?.recordedAt && <span>Recorded: {triage.recordedAt}</span>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-white p-1.5 rounded border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block">Fever / Temp</span>
                <span className="font-mono font-bold text-[#182620]">{triage?.fever || visit.structured.vitals.temp || '98.6 °F'}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block">Blood Pressure</span>
                <span className="font-mono font-bold text-[#182620]">{triage?.bp || visit.structured.vitals.bp || '120/80 mmHg'}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block">Blood Sugar</span>
                <span className="font-mono font-bold text-[#182620]">{triage?.bloodSugar || visit.structured.vitals.bloodSugar || 'Not checked'}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block">Pulse Rate</span>
                <span className="font-mono font-bold text-[#182620]">{triage?.pulse || visit.structured.vitals.pulse || '76 bpm'}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-[#EEDDC4]">
                <span className="text-[10px] text-[#718278] block">Weight</span>
                <span className="font-mono font-bold text-[#182620]">{triage?.weight || visit.structured.vitals.weight || '-- kg'}</span>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-[#465A50] leading-snug">
              <span className="font-bold text-[#8C5E2E]">Presented Problem: </span>
              {triage?.currentProblem || visit.structured.chiefComplaint}
              {triage?.priorProblems && (
                <>
                  {' '}· <span className="font-bold text-[#8C5E2E]">Prior History: </span>
                  {triage.priorProblems}
                </>
              )}
            </div>
          </div>

          {/* Doctor Examination & Clinical Findings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-[#E6E1D8] pb-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#718278] uppercase tracking-wider block">
                Doctor's Clinical Notes & History
              </span>
              <p className="text-xs text-[#182620] leading-snug">
                <strong>Chief Complaint:</strong> {visit.structured.chiefComplaint} ({visit.structured.duration})
              </p>
              <p className="text-xs text-[#465A50] leading-snug">
                <strong>Salient History:</strong> {visit.structured.history || 'None reported'}
              </p>
              <p className="text-xs text-[#465A50] leading-snug">
                <strong>Exam Findings:</strong> {visit.structured.examination || 'Within normal limits'}
              </p>
            </div>

            <div className="space-y-1.5 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E6E1D8]">
              <span className="text-[10px] font-bold text-[#718278] uppercase tracking-wider block">
                Clinical Impression / Diagnosis (निदान)
              </span>
              <div className="text-sm font-extrabold text-[#1E4D3A]">
                {visit.structured.impression}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#718278]">
                <span className="text-[10px] px-1.5 py-0.5 bg-[#E8F3EE] font-mono font-bold text-[#1E4D3A] rounded border border-[#C2E0D3]">
                  ICD/PHC: {visit.structured.diagnosisCode}
                </span>
                <span className="text-[11px] text-[#718278]">Captured via AI Voice Scribe</span>
              </div>
            </div>
          </div>

          {/* Rx Medications Table with Friendly Timings */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#182620] flex items-center gap-1">
                <span className="text-lg font-serif italic text-[#1E4D3A]">℞</span>
                <span>Prescription (Essential Generic Medicines)</span>
              </span>
              <span className="text-[10px] text-[#718278]">Free of cost at PHC Pharmacy</span>
            </div>

            <table className="w-full border-collapse border border-[#E6E1D8] text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] text-[#182620] font-bold text-left">
                  <th className="border border-[#E6E1D8] px-2 py-1.5 w-8 text-center">#</th>
                  <th className="border border-[#E6E1D8] px-2 py-1.5">Drug Name & Formulation</th>
                  <th className="border border-[#E6E1D8] px-2 py-1.5 w-24">Dosage</th>
                  <th className="border border-[#E6E1D8] px-2 py-1.5 w-48">Frequency & Timing (दवा का समय: भूखे पेट / भोजन के बाद)</th>
                  <th className="border border-[#E6E1D8] px-2 py-1.5 w-20">Duration</th>
                  <th className="border border-[#E6E1D8] px-2 py-1.5">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {visit.structured.medications.length > 0 ? (
                  visit.structured.medications.map((med, idx) => (
                    <tr key={med.id || idx} className="hover:bg-[#FAF8F5]">
                      <td className="border border-[#E6E1D8] px-2 py-1.5 text-center font-mono font-semibold">{idx + 1}</td>
                      <td className="border border-[#E6E1D8] px-2 py-1.5 font-bold text-[#1E4D3A]">{med.drug}</td>
                      <td className="border border-[#E6E1D8] px-2 py-1.5 font-mono">{med.dosage}</td>
                      <td className="border border-[#E6E1D8] px-2 py-1.5 text-[#182620] font-medium">{med.frequency}</td>
                      <td className="border border-[#E6E1D8] px-2 py-1.5 font-mono">{med.duration}</td>
                      <td className="border border-[#E6E1D8] px-2 py-1.5 text-[#465A50] text-[11px]">{med.instructions || 'After meals'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-[#E6E1D8] px-2 py-3 text-center text-[#718278] italic">
                      Supportive care, abundant oral fluids, and rest advised.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Advice, Danger Signs & Doctor Signature */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#E6E1D8] pt-3 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <span className="text-[10px] font-bold text-[#718278] uppercase tracking-wider block">
                General Advice & Patient Instructions
              </span>
              <p className="text-[#182620] text-xs leading-relaxed">
                {visit.structured.advice}
              </p>
              <div className="mt-2 text-[11px] text-[#8C5E2E] bg-[#FBF7F0] border border-[#EEDDC4] rounded-lg p-2">
                <strong>Warning / Danger Signs:</strong> Return immediately or visit the District Hospital if high fever with delirium, breathlessness, persistent vomiting, severe chest pain, or bleeding occurs.
              </div>
            </div>

            <div className="space-y-2 border-l border-[#E6E1D8] sm:pl-3">
              <div>
                <span className="text-[10px] font-bold text-[#718278] uppercase tracking-wider block">
                  Next Review Date
                </span>
                <span className="text-xs font-bold text-[#1E4D3A]">
                  {calculateNextDate(visit.structured.followUpDays)}
                </span>
                <span className="text-[11px] text-[#718278] block">
                  (After {visit.structured.followUpDays || 3} days)
                </span>
              </div>

              {/* Doctor Signature Block */}
              <div className="pt-4 text-center">
                <div className="h-8 border-b border-dashed border-[#718278] mb-1"></div>
                <div className="text-xs font-bold text-[#182620]">{visit.confirmedByDoctor || facility.doctorName}</div>
                <div className="text-[10px] text-[#718278]">{facility.doctorDesignation}</div>
                <div className="text-[9px] font-mono text-[#718278]">Reg: {facility.registrationNumber}</div>
              </div>
            </div>
          </div>

          {/* Footer & QR Verification */}
          <div className="border-t border-[#E6E1D8] pt-2 flex items-center justify-between text-[10px] text-[#718278]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3D8B6E]" />
              <span>National Health Mission (NHM) · Digitally transcribed via ClinicScribe Voice</span>
            </div>

            <div className="flex items-center gap-1 font-mono">
              <span>CONFIRMED: #{visit.id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
