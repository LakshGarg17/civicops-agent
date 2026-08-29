"use client";

import React from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Circle, 
  Layers, 
  ShieldCheck, 
  UserCheck, 
  Send, 
  Activity,
  Cpu,
  Bot
} from "lucide-react";

export interface TimelineEvent {
  id: string;
  agent_name: string;
  title: string;
  description: string;
  status: string;
  timestamp: string;
  requires_approval?: boolean;
}

interface CaseActivityTimelineProps {
  timeline: TimelineEvent[];
  caseId: string;
  caseStatus?: string;
}

export const CaseActivityTimeline: React.FC<CaseActivityTimelineProps> = ({
  timeline,
  caseId,
  caseStatus
}) => {
  const getAgentBadge = (agent: string) => {
    switch (agent) {
      case "Document Agent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Research Agent":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Workflow Agent":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Action Agent":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Human Approver":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Submission Agent":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "Monitoring Agent":
        return "bg-sky-100 text-sky-800 border-sky-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusIcon = (status: string, agent: string) => {
    if (status === "completed") {
      if (agent === "Human Approver") {
        return <UserCheck className="w-5 h-5 text-emerald-600" />;
      }
      return <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />;
    }
    if (status === "in_progress") {
      return <Clock className="w-5 h-5 text-civic-600 animate-spin" />;
    }
    if (status === "action_required") {
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
    return <Circle className="w-5 h-5 text-slate-300" />;
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-civic-50 text-civic-600 border border-civic-200 flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Multi-Agent Case Activity Log</h4>
            <p className="text-xs text-slate-500">
              End-to-end execution across Document, Research, Workflow, Action, and Human-in-the-Loop Agents
            </p>
          </div>
        </div>

        <span className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-slate-900 text-white">
          {caseId}
        </span>
      </div>

      {/* Timeline Progression */}
      {timeline.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No timeline events recorded yet.</p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {timeline.map((evt, idx) => {
            const isLast = idx === timeline.length - 1;
            const timeFormatted = evt.timestamp
              ? new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            return (
              <div key={evt.id || idx} className="relative group">
                {/* Node Icon on vertical line */}
                <div className="absolute -left-6 mt-0.5 bg-white rounded-full ring-4 ring-white">
                  {getStatusIcon(evt.status, evt.agent_name)}
                </div>

                {/* Event Card */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all space-y-1.5 ml-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${getAgentBadge(evt.agent_name)}`}>
                        {evt.agent_name}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900">{evt.title}</h5>
                    </div>

                    {timeFormatted && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {timeFormatted}
                      </span>
                    )}
                  </div>

                  {evt.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {evt.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
