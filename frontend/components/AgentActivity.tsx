"use client";

import React, { useEffect, useState } from "react";
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
  AlertTriangle
} from "lucide-react";

interface AgentActivityProps {
  currentStage?: number;
  sourcesChecked?: string[];
  isComplete?: boolean;
  detectedChange?: {
    previousStatus: string;
    currentStatus: string;
    summary: string;
    nextAction: string;
  };
}

const STAGES = [
  { id: 1, label: "Document analyzed & citations extracted", agent: "Document Agent", icon: "doc" },
  { id: 2, label: "Notice type & issuing authority identified", agent: "Document Agent", icon: "doc" },
  { id: 3, label: "Querying official .gov portals & civic codes", agent: "Research Agent", icon: "research" },
  { id: 4, label: "Government procedure & requirements verified", agent: "Research Agent", icon: "research" },
  { id: 5, label: "Diffing required vs available citizen documents", agent: "Workflow Agent", icon: "workflow" },
  { id: 6, label: "Personalized Action Plan & tasks sequenced", agent: "Workflow Agent", icon: "workflow" },
  { id: 7, label: "Autonomous case monitoring active in Firestore", agent: "Monitoring Agent", icon: "monitoring" }
];

export const AgentActivity: React.FC<AgentActivityProps> = ({
  sourcesChecked = [],
  isComplete = false,
  detectedChange
}) => {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (isComplete) {
      setActiveStep(STAGES.length + 1);
      return;
    }

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < STAGES.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isComplete]);

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
                Live Orchestration
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous multi-agent research, action synthesis, and continuous monitoring
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isComplete ? "bg-emerald-400" : "bg-civic-400"} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isComplete ? "bg-emerald-500" : "bg-civic-500"}`} />
          </span>
          <span className="font-semibold text-slate-300">
            {isComplete ? "Autonomous Monitoring Active" : "Agents Working..."}
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
      <div className="space-y-3 relative z-10">
        {STAGES.map((stage, idx) => {
          const stepNumber = idx + 1;
          const isFinished = stepNumber < activeStep || isComplete;
          const isCurrent = stepNumber === activeStep && !isComplete;

          return (
            <div
              key={stage.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                isFinished
                  ? "bg-slate-800/60 border-slate-700/60 text-slate-200"
                  : isCurrent
                  ? "bg-civic-950/80 border-civic-500/50 text-white shadow-md shadow-civic-950/50"
                  : "bg-slate-900/40 border-slate-800/40 text-slate-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isFinished ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-civic-400 animate-spin" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-700" />
                  )}
                </div>
                <div>
                  <p className={`text-xs font-medium ${isCurrent ? "font-semibold text-white" : ""}`}>
                    {stage.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    stage.agent === "Document Agent"
                      ? "bg-blue-950 text-blue-300 border border-blue-800/60"
                      : stage.agent === "Research Agent"
                      ? "bg-purple-950 text-purple-300 border border-purple-800/60"
                      : stage.agent === "Workflow Agent"
                      ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                      : "bg-sky-950 text-sky-300 border border-sky-800/60"
                  }`}
                >
                  {stage.agent}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sources Checked Panel */}
      {sourcesChecked && sourcesChecked.length > 0 && (
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Globe2 className="w-3.5 h-3.5 text-civic-400" />
            <span>Authoritative Sources Consulted</span>
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
