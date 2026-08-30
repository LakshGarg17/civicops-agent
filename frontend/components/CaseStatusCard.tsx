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
  Activity, 
  AlertTriangle, 
  Bell, 
  Check,
  Zap
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

export interface CaseNotification {
  notification_id: string;
  case_id: string;
  title: string;
  message: string;
  severity: string;
  action_label?: string;
  action_type?: string;
  created_at: string;
  unread: boolean;
}

interface CaseStatusCardProps {
  submission?: SubmissionRecord;
  caseId: string;
  status: string;
  title?: string;
  deadline?: string;
  notification?: CaseNotification | null;
  detectedChange?: {
    previousStatus: string;
    currentStatus: string;
    summary: string;
    nextAction: string;
  };
  onViewTimeline?: () => void;
  onViewRequiredAction?: () => void;
  onAcknowledgeNotification?: () => void;
}

export const CaseStatusCard: React.FC<CaseStatusCardProps> = ({
  submission,
  caseId,
  status,
  title = "Property Tax Correction",
  deadline = "15 September 2026",
  notification,
  detectedChange,
  onViewTimeline,
  onViewRequiredAction,
  onAcknowledgeNotification
}) => {
  const getStatusBadge = (st: string) => {
    switch (st) {
      case "submitted":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          label: "Submitted"
        };
      case "under_review":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
          label: "Under Review"
        };
      case "additional_information_required":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse",
          dot: "bg-rose-500",
          label: "Additional Information Required"
        };
      case "approved":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          label: "Approved"
        };
      case "rejected":
        return {
          bg: "bg-red-50 text-red-700 border-red-200",
          dot: "bg-red-500",
          label: "Determination Rejected"
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          dot: "bg-slate-500",
          label: st.replace(/_/g, " ").toUpperCase()
        };
    }
  };

  const badge = getStatusBadge(status);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-6 p-6 sm:p-8 transition-all">
      {/* Prominent Status Change Callout (Monitoring Agent Detection) */}
      {detectedChange && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/80 text-amber-950 shadow-lg space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600 fill-amber-500 animate-bounce" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              ⚡ STATUS CHANGE DETECTED (Monitoring Agent)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-xl border border-amber-300 font-medium">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Previous Status:</span>
              <span className="font-semibold text-slate-800 capitalize">{detectedChange.previousStatus.replace(/_/g, " ")}</span>
            </div>
            <div>
              <span className="text-amber-800 block text-[10px] uppercase font-bold">Current Status:</span>
              <span className="font-extrabold text-amber-900 capitalize">{detectedChange.currentStatus.replace(/_/g, " ")}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
              NEW ACTION REQUIRED
            </span>
            <p className="text-xs text-amber-950 font-bold">{detectedChange.nextAction}</p>
            <p className="text-xs text-slate-700">{detectedChange.summary}</p>
          </div>

          {onViewRequiredAction && (
            <div className="pt-1">
              <button
                onClick={onViewRequiredAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-all"
              >
                <span>View Required Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active In-App Notification Alert Banner */}
      {notification && notification.unread && !detectedChange && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-md space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                  🔔 {notification.title}
                </h4>
                <p className="text-xs text-amber-900 font-semibold mt-0.5">
                  {notification.message}
                </p>
              </div>
            </div>
            {onAcknowledgeNotification && (
              <button
                onClick={onAcknowledgeNotification}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:underline flex-shrink-0"
              >
                Dismiss
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-amber-700 font-medium">
              Action required to maintain statutory filing window.
            </span>
            {onViewRequiredAction && (
              <button
                onClick={onViewRequiredAction}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                <span>{notification.action_label || "View Required Action"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmed Application Submission Header */}
      {submission && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-extrabold text-emerald-950">✓ Application Submitted</p>
              <p className="text-[11px] text-emerald-800">
                Case ID: <span className="font-mono font-bold">{caseId}</span> • Status: <span className="font-bold capitalize">{status.replace(/_/g, " ")}</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
            {submission.confirmation_number}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-civic-50 text-civic-600 border border-civic-200 flex items-center justify-center shadow-xs">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-civic-100 text-civic-800 border border-civic-200">
                CivicOps Case Dashboard
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Case #{caseId}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              {title}
            </h3>
          </div>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Status</span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full border ${badge.bg}`}>
            <span className={`h-2 w-2 rounded-full ${badge.dot} animate-pulse`} />
            {badge.label}
          </span>
          {deadline && (
            <p className="text-[11px] text-slate-500 font-medium">
              Deadline: <span className="font-semibold text-slate-800">{deadline}</span>
            </p>
          )}
        </div>
      </div>

      {/* Progress Checklist (Derived from Firestore Status) */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
          Lifecycle Progress
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center gap-1.5 font-bold">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Notice analyzed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center gap-1.5 font-bold">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Procedure researched</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center gap-1.5 font-bold">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Action plan created</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center gap-1.5 font-bold">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Application generated</span>
          </div>
          <div className={`p-2.5 rounded-xl border flex items-center gap-1.5 font-bold ${
            submission ? "bg-emerald-50 border-emerald-200/80 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-400"
          }`}>
            {submission ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5" />}
            <span>Submitted</span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-800 flex items-center gap-1.5 font-bold">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
            <span>Monitoring</span>
          </div>
        </div>
      </div>

      {/* Confirmation Details (if submission present) */}
      {submission && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Confirmation Code
            </span>
            <p className="font-mono text-xs font-bold text-emerald-700">{submission.confirmation_number}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" />
              Gateway Channel
            </span>
            <p className="text-xs font-semibold text-slate-800">{submission.submission_method}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Submission Timestamp
            </span>
            <p className="text-xs font-semibold text-slate-800">
              {new Date(submission.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
