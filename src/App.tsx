import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ReceptionistPortal } from './components/ReceptionistPortal';
import { DoctorPortal } from './components/DoctorPortal';
import { OpdReportsDashboard } from './components/OpdReportsDashboard';
import { FacilitySettingsModal } from './components/FacilitySettingsModal';
import { Patient, FacilityProfile, UserRole } from './types/clinical';
import { getPatients, getFacilityProfile, getVisits } from './services/storage';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('clinicscribe_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Role and Navigation state
  const [activeRole, setActiveRole] = useState<UserRole>('receptionist');
  const [currentTab, setCurrentTab] = useState<'receptionist' | 'doctor' | 'reports' | 'facility'>('receptionist');

  // Core data states
  const [facility, setFacility] = useState<FacilityProfile>(getFacilityProfile());
  const [patients, setPatients] = useState<Patient[]>(getPatients());
  const [selectedPatientIdForDoctor, setSelectedPatientIdForDoctor] = useState<string>('');

  // Sync theme with HTML root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('clinicscribe_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('clinicscribe_theme', 'light');
    }
  }, [isDarkMode]);

  // Compute live badges
  const waitingPatientsCount = patients.filter((p) => p.status === 'waiting_for_doctor').length;
  const readyReportsCount = patients.filter((p) => p.status === 'consultation_completed').length;

  // Role toggle
  const handleToggleRole = () => {
    if (activeRole === 'receptionist') {
      setActiveRole('doctor');
      setCurrentTab('doctor');
    } else {
      setActiveRole('receptionist');
      setCurrentTab('receptionist');
    }
  };

  const handleSelectTab = (tab: 'receptionist' | 'doctor' | 'reports' | 'facility') => {
    setCurrentTab(tab);
    if (tab === 'receptionist') setActiveRole('receptionist');
    if (tab === 'doctor') setActiveRole('doctor');
  };

  const handleReceptionistOpenDoctor = (patient: Patient) => {
    setSelectedPatientIdForDoctor(patient.id);
    setActiveRole('doctor');
    setCurrentTab('doctor');
  };

  const handleDoctorConsultationFinished = () => {
    setPatients(getPatients());
  };

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#182620] font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        activeRole={activeRole}
        onToggleRole={handleToggleRole}
        waitingPatientsCount={waitingPatientsCount}
        readyReportsCount={readyReportsCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Receptionist Portal */}
        {currentTab === 'receptionist' && (
          <ReceptionistPortal
            facility={facility}
            onSwitchToDoctorForPatient={handleReceptionistOpenDoctor}
          />
        )}

        {/* Doctor Portal */}
        {currentTab === 'doctor' && (
          <DoctorPortal
            facility={facility}
            initialSelectedPatientId={selectedPatientIdForDoctor}
            onConsultationFinished={handleDoctorConsultationFinished}
            onSwitchToReceptionist={() => {
              setActiveRole('receptionist');
              setCurrentTab('receptionist');
            }}
          />
        )}

        {/* Aggregate OPD Reports */}
        {currentTab === 'reports' && (
          <OpdReportsDashboard facility={facility} />
        )}

        {/* Facility Settings */}
        {currentTab === 'facility' && (
          <FacilitySettingsModal
            currentProfile={facility}
            onUpdate={(updated) => setFacility(updated)}
            onClose={() => setCurrentTab(activeRole === 'receptionist' ? 'receptionist' : 'doctor')}
          />
        )}
      </main>
    </div>
  );
}
