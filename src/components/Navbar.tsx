import React from 'react';
import { Stethoscope, UserCheck, ArrowRightLeft, FileSpreadsheet, Building2 } from 'lucide-react';
import { UserRole } from '../types/clinical';

interface NavbarProps {
  currentTab: 'receptionist' | 'doctor' | 'reports' | 'facility';
  onSelectTab: (tab: 'receptionist' | 'doctor' | 'reports' | 'facility') => void;
  activeRole: UserRole;
  onToggleRole: () => void;
  waitingPatientsCount?: number;
  readyReportsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeRole,
  onToggleRole,
  waitingPatientsCount = 0,
  readyReportsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E6E1D8] transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab(activeRole === 'receptionist' ? 'receptionist' : 'doctor')}
          className="flex items-center gap-2.5 text-[#182620] font-extrabold text-lg tracking-tight hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-[#1E4D3A] text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-4.5 h-4.5 text-[#E8F3EE]" />
          </div>
          <span className="font-sans text-[#1E4D3A]">ClinicScribe</span>
        </button>

        {/* Zone 2: Navigation Links (Strictly filtered by active role) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#465A50]">
          {/* Show Receptionist Desk ONLY when activeRole is 'receptionist' */}
          {activeRole === 'receptionist' && (
            <button
              onClick={() => onSelectTab('receptionist')}
              className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 ${
                currentTab === 'receptionist'
                  ? 'text-[#1E4D3A] font-bold border-b-2 border-[#1E4D3A] pb-1'
                  : 'hover:text-[#182620]'
              }`}
            >
              <span>Receptionist Desk</span>
              {readyReportsCount > 0 && (
                <span className="text-[10px] bg-[#E8F3EE] text-[#1E4D3A] font-mono font-bold px-2 py-0.5 rounded-full border border-[#C2E0D3]">
                  {readyReportsCount} Ready
                </span>
              )}
            </button>
          )}

          {/* Show Doctor Consultation ONLY when activeRole is 'doctor' */}
          {activeRole === 'doctor' && (
            <button
              onClick={() => onSelectTab('doctor')}
              className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-2 ${
                currentTab === 'doctor'
                  ? 'text-[#1E4D3A] font-bold border-b-2 border-[#1E4D3A] pb-1'
                  : 'hover:text-[#182620]'
              }`}
            >
              <span>Doctor Consultation Desk</span>
              {waitingPatientsCount > 0 && (
                <span className="text-[10px] bg-[#FCECE6] text-[#C85A32] font-mono font-bold px-2 py-0.5 rounded-full border border-[#F3C7B6]">
                  {waitingPatientsCount} Waiting
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => onSelectTab('reports')}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              currentTab === 'reports'
                ? 'text-[#1E4D3A] font-bold border-b-2 border-[#1E4D3A] pb-1'
                : 'hover:text-[#182620]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 opacity-70" />
            <span>OPD Reports</span>
          </button>

          <button
            onClick={() => onSelectTab('facility')}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              currentTab === 'facility'
                ? 'text-[#1E4D3A] font-bold border-b-2 border-[#1E4D3A] pb-1'
                : 'hover:text-[#182620]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 opacity-70" />
            <span>Hospital Profile</span>
          </button>
        </nav>

        {/* Zone 3: Switch Role Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleRole}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-[#E8F3EE] hover:bg-[#D5EADB] text-[#1E4D3A] border border-[#C2E0D3] shadow-2xs whitespace-nowrap active:scale-98"
            title="Switch portal role"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#3D8B6E]" />
            <span>
              {activeRole === 'receptionist' ? 'Switch to Doctor Mode' : 'Switch to Receptionist Mode'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex items-center justify-around border-t border-[#E6E1D8] px-2 py-2 text-xs font-semibold text-[#465A50]">
        {activeRole === 'receptionist' && (
          <button
            onClick={() => onSelectTab('receptionist')}
            className={`py-1.5 px-3 rounded-lg ${
              currentTab === 'receptionist'
                ? 'bg-[#1E4D3A] text-white shadow-2xs'
                : 'text-[#465A50]'
            }`}
          >
            Receptionist ({readyReportsCount})
          </button>
        )}

        {activeRole === 'doctor' && (
          <button
            onClick={() => onSelectTab('doctor')}
            className={`py-1.5 px-3 rounded-lg ${
              currentTab === 'doctor'
                ? 'bg-[#1E4D3A] text-white shadow-2xs'
                : 'text-[#465A50]'
            }`}
          >
            Doctor ({waitingPatientsCount})
          </button>
        )}

        <button
          onClick={() => onSelectTab('reports')}
          className={`py-1.5 px-3 rounded-lg ${
            currentTab === 'reports' ? 'bg-[#1E4D3A] text-white shadow-2xs' : 'text-[#465A50]'
          }`}
        >
          Reports
        </button>

        <button
          onClick={() => onSelectTab('facility')}
          className={`py-1.5 px-3 rounded-lg ${
            currentTab === 'facility' ? 'bg-[#1E4D3A] text-white shadow-2xs' : 'text-[#465A50]'
          }`}
        >
          Hospital
        </button>
      </div>
    </header>
  );
};
