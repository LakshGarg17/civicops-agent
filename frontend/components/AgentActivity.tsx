"use client";

import React from "react";
import { 
  Bot, 
  CheckCircle2, 
  Loader2, 
  Circle, 
  Globe2, 
  Search, 
  Sparkles, 
  ShieldCheck,
  Layers,
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  Lock,
  UserCheck
} from "lucide-react";

export interface AgentActivityState {
  documentAnalyzed?: boolean;
  procedureIdentified?: boolean;
  actionPlanGenerated?: boolean;
  applicationPrepared?: boolean;
  documentsVerified?: boolean;
  humanApproved?: boolean;
  applicationSubmitted?: boolean;
  monitoringActive?: boolean;
}

interface AgentActivityProps {
  activityState?: AgentActivityState;
  sourcesChecked?: string[];
  isLoading?: boolean;
  detectedChange?: {
    previousStatus: string;
    currentStatus: string;
    summary: string;
    nextAction: string;
  };
}

export const AgentActivity: React.FC<AgentActivityProps> = ({
  activityState = {
    documentAnalyzed: true,
    procedureIdentified: true,
    actionPlanGenerated: true,
    applicationPrepared: false,
    documentsVerified: true,
    humanApproved: false,
    applicationSubmitted: false,
    monitoringActive: false
  },
  sourcesChecked = [],
  isLoading = false,
  detectedChange
}) => {
  const steps = [
    {
      id: "doc",
      agent: "Document Agent",
      label: "Analyzed uploaded notice",
      isComplete: !!activityState.documentAnalyzed,
      isInProgress: isLoading && !activityState.documentAnalyzed,
      badgeColor: "bg-blue-950 text-blue-300 border-blue-800/60"
    },
    {
      id: "research",
      agent: "Research Agent",
      label: "Identified applicable procedure",
      isComplete: !!activityState.procedureIdentified,
      isInProgress: isLoading && activityState.documentAnalyzed && !activityState.procedureIdentified,
      badgeColor: "bg-purple-950 text-purple-300 border-purple-800/60"
    },
    {
      id: "workflow",
      agent: "Workflow Agent",
      label: "Generated personalized action plan",
      isComplete: !!activityState.actionPlanGenerated,
      isInProgress: isLoading && activityState.procedureIdentified && !activityState.actionPlanGenerated,
      badgeColor: "bg-amber-950 text-amber-300 border-amber-800/60"
    },
    {
      id: "action_prep",
      agent: "Action Agent",
      label: "Prepared formal application package",
      isComplete: !!activityState.applicationPrepared,
      isInProgress: false,
      badgeColor: "bg-indigo-950 text-indigo-300 border-indigo-800/60"
    },
    {
      id: "verification",
      agent: "Verification Agent",
      label: "Checked required supporting documents",
      isComplete: !!activityState.documentsVerified,
      isInProgress: false,
      badgeColor: "bg-teal-950 text-teal-300 border-teal-800/60"
    },
    {
      id: "approval",
      agent: "Human Approver",
      label: activityState.humanApproved 
        ? "Explicit citizen authorization granted" 
        : "Submission requires explicit human authorization",
      isComplete: !!activityState.humanApproved,
      isWarning: !activityState.humanApproved && !!activityState.applicationPrepared,
      isInProgress: false,
      badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800/60"
    },
    {
      id: "submission",
      agent: "Submission Agent",
      label: "Application submitted (Sandbox Gateway)",
      isComplete: !!activityState.applicationSubmitted,
      isInProgress: false,
      badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-800/60"
    },
    {
      id: "monitoring",
      agent: "Monitoring Agent",
      label: "Continuous case status tracking in Firestore",
      isComplete: !!activityState.monitoringActive,
      isInProgress: !!activityState.applicationSubmitted,
      badgeColor: "bg-sky-950 text-sky-300 border-sky-800/60"
    }
  ];

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-civic-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-civic-500/20 text-civic-400 border border-civic-400/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-wide uppercase">CivicOps Agent Activity</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-civic-950 text-civic-300 border border-civic-700/50">
                Live Multi-Agent Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified multi-agent state reflecting real completed backend tasks
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activityState.monitoringActive ? "bg-sky-400" : "bg-emerald-400"} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${activityState.monitoringActive ? "bg-sky-500" : "bg-emerald-500"}`} />
          </span>
          <span className="font-semibold text-slate-300">
            {activityState.monitoringActive ? "Monitoring Active" : "Pipeline Synced"}
          </span>
        </div>
      </div>

      {/* Detected Change Expanded Callout */}
      {detectedChange && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-100 space-y-2 relative z-10 shadow-lg shadow-amber-950/30">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
              ⚡ Monitoring Agent: Status Change Detected
            </span>
          </div>
          <div className="text-xs space-y-1">
            <p className="text-slate-200">
              <span className="text-slate-400">Previous:</span> <span className="font-semibold capitalize">{detectedChange.previousStatus.replace(/_/g, " ")}</span>
              {" "}→{" "}
              <span className="text-slate-400">Current:</span> <span className="font-bold text-amber-300 capitalize">{detectedChange.currentStatus.replace(/_/g, " ")}</span>
            </p>
            <p className="text-amber-200/90">{detectedChange.summary}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-900/80 text-amber-200 font-semibold text-[11px] border border-amber-700">
              <span>New Task Created:</span>
              <span className="text-white font-bold">{detectedChange.nextAction}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stage Progression List */}
      <div className="space-y-2.5 relative z-10">
        {steps.map((st) => (
          <div
            key={st.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
              st.isComplete
                ? "bg-slate-800/60 border-slate-700/60 text-slate-200"
                : st.isInProgress
                ? "bg-civic-950/80 border-civic-500/50 text-white shadow-md shadow-civic-950/50"
                : st.isWarning
                ? "bg-amber-950/30 border-amber-700/50 text-amber-200"
                : "bg-slate-900/40 border-slate-800/40 text-slate-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {st.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : st.isInProgress ? (
                  <Loader2 className="w-4 h-4 text-civic-400 animate-spin" />
                ) : st.isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-700" />
                )}
              </div>
              <div>
                <p className={`text-xs font-medium ${st.isComplete ? "text-slate-200" : st.isWarning ? "text-amber-200 font-bold" : "text-slate-500"}`}>
                  {st.label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${st.badgeColor}`}
              >
                {st.agent}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sources Checked Panel */}
      {sourcesChecked && sourcesChecked.length > 0 && (
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Globe2 className="w-3.5 h-3.5 text-civic-400" />
            <span>Authoritative Sources Consulted (.gov)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sourcesChecked.map((src, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {src}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
