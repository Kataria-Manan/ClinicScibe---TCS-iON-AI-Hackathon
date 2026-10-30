import React, { useState } from 'react';
import { getReportAnalytics, exportVisitsToCsv, getVisits } from '../services/storage';
import { PrintableOpdSlip } from './PrintableOpdSlip';
import { Visit, FacilityProfile } from '../types/clinical';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Building,
} from 'lucide-react';

interface OpdReportsDashboardProps {
  facility: FacilityProfile;
}

export const OpdReportsDashboard: React.FC<OpdReportsDashboardProps> = ({ facility }) => {
  const analytics = getReportAnalytics();
  const visits = getVisits();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const handleDownloadCsv = () => {
    const csvContent = exportVisitsToCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hospital_OPD_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const jsonContent = JSON.stringify(visits, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hospital_OPD_Full_Archive_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedDiagnoses = Object.entries(analytics.diagnosisCounts).sort((a, b) => b[1] - a[1]);
  const maxDiagnosisCount = Math.max(...sortedDiagnoses.map((d) => d[1]), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 rounded-2xl border border-[#E6E1D8] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#E8F3EE] text-[#1E4D3A] px-2.5 py-0.5 rounded-full border border-[#C2E0D3]">
              Surveillance Desk
            </span>
            <span className="text-xs text-[#718278]">{facility.name}</span>
          </div>
          <h2 className="text-lg font-extrabold text-[#182620]">
            Daily OPD Morbidity & Epidemiological Surveillance
          </h2>
          <p className="text-xs text-[#718278]">
            Automated registry metrics generated from clinical voice notes and receptionist intake
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#1E4D3A] hover:bg-[#163C2D] rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#D8F3DC]" />
            <span>Export NHM CSV</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-2 text-xs font-bold text-[#1E4D3A] bg-white hover:bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-[#3D8B6E]" />
            <span>JSON Backup</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718278] block mb-1">
            Today's Consultations
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1E4D3A] font-mono tabular-nums">
            {analytics.todayVisitsCount}
          </div>
          <span className="text-[10px] text-[#3D8B6E] font-medium mt-1 block">
            Recorded via AI Voice Scribe
          </span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718278] block mb-1">
            Total Clinical Archive
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#182620] font-mono tabular-nums">
            {analytics.totalVisitsCount}
          </div>
          <span className="text-[10px] text-[#718278] font-medium mt-1 block">
            Across {analytics.totalPatientsCount} registered clients
          </span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718278] block mb-1">
            New Client Caseload
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#3D8B6E] font-mono tabular-nums">
            {analytics.newVisitsRatio}%
          </div>
          <span className="text-[10px] text-[#718278] font-medium mt-1 block">
            {100 - analytics.newVisitsRatio}% returning follow-ups
          </span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#718278] block mb-1">
            Client Gender Demographics
          </span>
          <div className="text-sm font-bold text-[#182620] font-mono tabular-nums mt-1">
            F: {analytics.genderCounts.female} · M: {analytics.genderCounts.male}
          </div>
          <span className="text-[10px] text-[#718278] font-medium mt-1 block">
            Includes ANC & Pediatric Clinics
          </span>
        </div>
      </div>

      {/* Morbidity Charts & Stream Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Diagnoses Bar Chart */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#182620]">
                Top OPD Diagnoses & Disease Surveillance
              </h3>
              <p className="text-xs text-[#718278]">Extracted automatically from doctor-patient conversation</p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#3D8B6E]" />
          </div>

          <div className="space-y-3 pt-2">
            {sortedDiagnoses.map(([code, count]) => {
              const percentage = Math.round((count / maxDiagnosisCount) * 100);
              return (
                <div key={code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#182620] font-mono">
                      {code}
                    </span>
                    <span className="text-[#718278] font-mono tabular-nums">
                      {count} {count === 1 ? 'case' : 'cases'}
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF8F5] border border-[#E6E1D8] h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-[#3D8B6E] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinic Stream Distribution */}
        <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#182620]">
              Consultation Specialties
            </h3>
            <p className="text-xs text-[#718278]">Visits by specialty stream</p>
          </div>

          <div className="space-y-2 pt-2 text-xs">
            {Object.entries(analytics.clinicCounts).map(([stream, count]) => (
              <div
                key={stream}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1D8]"
              >
                <span className="font-semibold text-[#182620] capitalize">
                  {stream} Clinic
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white border border-[#E6E1D8] font-mono font-bold text-[#1E4D3A] shadow-2xs">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Consultation Register Table */}
      <div className="bg-[#FFFFFF] border border-[#E6E1D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#182620]">
              Recent Consultations Register
            </h3>
            <p className="text-xs text-[#718278]">Click any visit to view or reprint the 1-2 page OPD slip</p>
          </div>
          <span className="text-xs font-mono text-[#718278]">Total: {visits.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#465A50] font-semibold border-b border-[#E6E1D8]">
                <th className="py-2.5 px-4 font-mono">Date</th>
                <th className="py-2.5 px-4">OPD Slip</th>
                <th className="py-2.5 px-4">Patient Name</th>
                <th className="py-2.5 px-4">Age / Sex</th>
                <th className="py-2.5 px-4">Clinic</th>
                <th className="py-2.5 px-4">Diagnosis</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D8]">
              {visits.slice(0, 10).map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedVisit(v)}
                  className="hover:bg-[#FAF8F5] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-[#718278] whitespace-nowrap">
                    {v.visitDate}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#1E4D3A] whitespace-nowrap">
                    {v.opdSlipNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#182620] whitespace-nowrap">
                    {v.patientName}
                  </td>
                  <td className="py-3 px-4 text-[#718278] whitespace-nowrap capitalize">
                    {v.patientAge}y / {v.patientGender}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap capitalize text-[#465A50]">
                    {v.clinicType}
                  </td>
                  <td className="py-3 px-4 text-[#182620] font-medium max-w-xs truncate">
                    {v.structured.impression}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVisit(v);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-[#1E4D3A] hover:underline inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#3D8B6E]" />
                      <span>Print Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Preview Modal */}
      {selectedVisit && (
        <PrintableOpdSlip
          visit={selectedVisit}
          facility={facility}
          onClose={() => setSelectedVisit(null)}
        />
      )}
    </div>
  );
};
