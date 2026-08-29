"use client";

import React, { useState } from "react";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Save, 
  X, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  User, 
  Hash, 
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";

export interface ApplicationDocument {
  to: string;
  subject: string;
  property_id: string;
  reference_number: string;
  reason: string;
  requested_action: string;
  supporting_documents: string[];
  missing_documents: string[];
  applicant_name: string;
  date: string;
  additional_notes?: string;
  status?: string;
}

interface ApplicationReviewCardProps {
  application: ApplicationDocument;
  onSaveEdits?: (updated: Partial<ApplicationDocument>) => void;
  onProceedToApproval?: () => void;
  isSubmitted?: boolean;
}

export const ApplicationReviewCard: React.FC<ApplicationReviewCardProps> = ({
  application,
  onSaveEdits,
  onProceedToApproval,
  isSubmitted = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ApplicationDocument>(application);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveEdits) {
      onSaveEdits(formData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(application);
    setIsEditing(false);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-civic-500/20 text-civic-400 border border-civic-400/30 flex items-center justify-center shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-civic-500/30 text-civic-200 border border-civic-400/40">
                Action Agent Prepared Draft
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isSubmitted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}>
                {isSubmitted ? "Submitted to Sandbox" : "Awaiting Human Review"}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
              Administrative Petition & Dispute Package
            </h3>
          </div>
        </div>

        {!isSubmitted && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Details
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Edits
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Review Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {isEditing ? (
          /* Editable Form View */
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">To (Authority / Department):</label>
                <input
                  type="text"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Applicant Name:</label>
                <input
                  type="text"
                  value={formData.applicant_name}
                  onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Subject Line:</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-civic-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Property / Citation ID:</label>
                <input
                  type="text"
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reference Number:</label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Reason / Statement of Facts:</label>
              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Requested Administrative Relief:</label>
              <textarea
                rows={2}
                value={formData.requested_action}
                onChange={(e) => setFormData({ ...formData, requested_action: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Additional Legal / Statutory Notes:</label>
              <textarea
                rows={2}
                value={formData.additional_notes || ""}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </form>
        ) : (
          /* Formatted Formal Document View */
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 font-sans">
            {/* Header Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Target Authority
                </span>
                <p className="text-sm font-bold text-slate-900">{application.to}</p>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center sm:justify-end gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Filing Date
                </span>
                <p className="text-sm font-bold text-slate-800">{application.date}</p>
              </div>
            </div>

            {/* Subject and Identifiers */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-civic-700 block">Subject</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{application.subject}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applicant</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{application.applicant_name}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Property / APN</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{application.property_id}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notice Reference #</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{application.reference_number}</p>
                </div>
              </div>
            </div>

            {/* Reason Statement */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Grounds For Dispute & Statement of Facts
              </h5>
              <p className="text-xs sm:text-sm text-slate-800 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                {application.reason}
              </p>
            </div>

            {/* Requested Relief */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Requested Administrative Action
              </h5>
              <p className="text-xs sm:text-sm text-slate-800 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                {application.requested_action}
              </p>
            </div>

            {/* Supporting Documents Verification Checklist */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Attached Supporting Evidence ({application.supporting_documents.length})
              </h5>

              {application.supporting_documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {application.supporting_documents.map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{doc}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-white border border-slate-200">
                  No supporting documents currently attached.
                </p>
              )}
            </div>

            {/* Missing Documents Warning (if any) */}
            {application.missing_documents && application.missing_documents.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Unattached Required Documents ({application.missing_documents.length})</span>
                </div>
                <p className="text-[11px] text-amber-800/80">
                  The following required items were not provided in your document inventory and are NOT claimed in this application:{" "}
                  <span className="font-semibold">{application.missing_documents.join(", ")}</span>.
                </p>
              </div>
            )}

            {/* Statutory Notes */}
            {application.additional_notes && (
              <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200 font-mono">
                {application.additional_notes}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {!isSubmitted && onProceedToApproval && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onProceedToApproval}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-slate-900 via-civic-900 to-slate-900 hover:from-black hover:to-slate-900 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              <span>Proceed to Human Authorization Gate</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Human-in-the-loop security: Action Agent prepares petitions, but requires your explicit authorization before submission.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
