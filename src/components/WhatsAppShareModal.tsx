import React, { useState } from 'react';
import { Visit, FacilityProfile } from '../types/clinical';
import { Share2, Copy, Check, X, Phone, MessageSquare } from 'lucide-react';

interface WhatsAppShareModalProps {
  visit: Visit;
  facility: FacilityProfile;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  visit,
  facility,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(visit.patientPhone || '');

  const calculateNextDate = (days?: number) => {
    const d = new Date(visit.visitDate || new Date());
    d.setDate(d.getDate() + (days || 3));
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const medsText = visit.structured.medications
    .map(
      (m, i) =>
        `${i + 1}. ${m.drug} - ${m.dosage} [${m.frequency}] for ${m.duration} (${m.instructions || 'After food'})`
    )
    .join('\n');

  const shareText = `*${facility.name} - OPD Consultation Summary*
----------------------------------------
*Patient:* ${visit.patientName} (${visit.patientAge}y/${visit.patientGender})
*OPD Slip:* ${visit.opdSlipNumber} | *Date:* ${visit.visitDate}
*Doctor:* ${facility.doctorName} (${facility.doctorDesignation})

*Chief Complaint:* ${visit.structured.chiefComplaint} (${visit.structured.duration})
*Diagnosis:* ${visit.structured.impression}

*Prescribed Medications (दवाइयाँ):*
${medsText || 'Supportive care advised.'}

*Doctor's Advice:*
${visit.structured.advice}

*Next Follow-Up Date:* ${calculateNextDate(visit.structured.followUpDays)}

⚠️ *Emergency Warning:* In case of severe breathlessness, bleeding, persistent vomiting, or delirium, reach the nearest hospital immediately.
----------------------------------------
_Digital prescription generated via ClinicScribe Voice Notes_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const internationalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://api.whatsapp.com/send?${internationalPhone ? `phone=${internationalPhone}&` : ''}text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Share Patient OPD Summary</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Dispatch digital summary to patient or caregiver</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recipient WhatsApp Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="10-digit mobile number, e.g. 9876543210"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message Preview
              </label>
              <span className="text-[11px] text-slate-500">Ready for WhatsApp format</span>
            </div>
            <textarea
              readOnly
              value={shareText}
              rows={9}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-700 dark:text-slate-300 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
