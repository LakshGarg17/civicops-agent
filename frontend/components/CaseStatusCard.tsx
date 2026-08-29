"use client";

import React from "react";
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Calendar, 
  Hash, 
  Globe, 
  Sparkles, 
  ArrowRight,
  FileText,
  Activity
} from "lucide-react";

export interface SubmissionRecord {
  application_id: string;
  status: string;
  submitted_at: string;
  submission_method: string;
  confirmation_number: string;
  is_sandbox: boolean;
  gateway_message?: string;
}

interface CaseStatusCardProps {
  submission: SubmissionRecord;
  caseId: string;
  onViewTimeline?: () => void;
}

export const CaseStatusCard: React.FC<CaseStatusCardProps> = ({
  submission,
  caseId,
  onViewTimeline
}) => {
  const formattedDate = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "Just now";

  return (
    <div className="w-full bg-white rounded-3xl border border-emerald-200/90 shadow-xl overflow-hidden space-y-6 p-6 sm:p-8 transition-all">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                Application Submitted ✓
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                Demo Gateway (Sandbox)
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              Filing Receipt Confirmed
            </h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Under Review
          </span>
        </div>
      </div>

      {/* Confirmation Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Hash className="w-3 h-3 text-slate-400" />
            Case Identifier
          </span>
          <p className="font-mono text-sm font-bold text-slate-900">{caseId}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Confirmation Code
          </span>
          <p className="font-mono text-sm font-bold text-emerald-700">{submission.confirmation_number}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Submission Timestamp
          </span>
          <p className="text-xs font-semibold text-slate-800">{formattedDate}</p>
        </div>
      </div>

      {/* Next Steps Guidance */}
      <div className="p-5 rounded-2xl bg-civic-50/70 border border-civic-200/80 text-xs text-civic-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-civic-800">
          <Activity className="w-4 h-4 text-civic-600" />
          <span>Next: Autonomous Monitoring Active</span>
        </div>
        <p className="text-civic-800/90 leading-relaxed">
          CivicOps will monitor the case in upcoming milestones. You will receive real-time notifications if the agency requests secondary evidence or issues a determination.
        </p>
      </div>

      {/* Gateway Message */}
      {submission.gateway_message && (
        <p className="text-center text-[11px] text-slate-400 font-mono">
          {submission.gateway_message}
        </p>
      )}
    </div>
  );
};
