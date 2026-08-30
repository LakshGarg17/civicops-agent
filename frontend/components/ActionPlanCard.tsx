"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Circle, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  UploadCloud, 
  ArrowRight, 
  FileText, 
  Globe, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  Send,
  Wand2,
  HelpCircle,
  ShieldCheck,
  Check
} from "lucide-react";

export interface WorkflowTask {
  id: string;
  title: string;
  status: "completed" | "pending" | "in_progress" | "action_required" | string;
  requires_user: boolean;
  description?: string;
  category?: string;
}

export interface WorkflowCase {
  case_id: string;
  goal: string;
  priority: string;
  deadline: string;
  tasks: WorkflowTask[];
  missing_documents: string[];
  matched_documents: string[];
}

export interface ProcedureResearchData {
  procedure_name: string;
  authority: string;
  submission_method: string;
  required_documents: string[];
  steps: string[];
  deadline_information: string;
  fees: string;
  additional_requirements: string[];
  rationale?: string;
  source_information: string[];
}

interface ActionPlanCardProps {
  workflow: WorkflowCase;
  researchData?: ProcedureResearchData;
  onUpdateTaskStatus?: (taskId: string, newStatus: string) => void;
  onPrepareApplication?: () => void;
  isPreparingApplication?: boolean;
  hasApplication?: boolean;
}

export const ActionPlanCard: React.FC<ActionPlanCardProps> = ({
  workflow,
  researchData,
  onUpdateTaskStatus,
  onPrepareApplication,
  isPreparingApplication = false,
  hasApplication = false
}) => {
  const [tasks, setTasks] = useState<WorkflowTask[]>(workflow.tasks || []);
  const [showResearchDetails, setShowResearchDetails] = useState(true);

  // Toggle task completed state locally
  const toggleTaskCompleted = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === "completed" ? "pending" : "completed";
          if (onUpdateTaskStatus) onUpdateTaskStatus(taskId, nextStatus);
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  // Compute progress percentage
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Compute NEXT ACTION (first non-completed task)
  const nextActionTask = tasks.find((t) => t.status !== "completed");

  // Priority color styling
  const priorityLower = (workflow.priority || "medium").toLowerCase();
  const priorityBadge = 
    priorityLower === "high" || priorityLower === "critical"
      ? { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "High Priority" }
      : priorityLower === "low"
      ? { bg: "bg-blue-50 text-blue-700 border-blue-200", label: "Standard Priority" }
      : { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Medium Priority" };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-7 transition-all">
      {/* Header with Case ID and Goal */}
      <div className="space-y-3 border-b border-slate-100 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-slate-900 text-white shadow-xs">
              {workflow.case_id}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${priorityBadge.bg}`}>
              {priorityBadge.label}
            </span>
          </div>

          {workflow.deadline && workflow.deadline.toLowerCase() !== "not found" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Deadline: {workflow.deadline}</span>
            </div>
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {workflow.goal}
        </h3>
        
        {researchData?.authority && researchData.authority.toLowerCase() !== "not found" && (
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-civic-600" />
            Administering Authority: <span className="font-semibold text-slate-700">{researchData.authority}</span>
          </p>
        )}
      </div>

      {/* Prominent NEXT ACTION Box (Computed from first non-completed task) */}
      {nextActionTask && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-civic-900 via-slate-900 to-slate-950 text-white border border-civic-700/50 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-civic-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-400/40">
              NEXT ACTION
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Step {tasks.findIndex((t) => t.id === nextActionTask.id) + 1} of {totalCount}
            </span>
          </div>

          <div>
            <h4 className="text-base font-extrabold text-white tracking-tight">
              {nextActionTask.title}
            </h4>
            {nextActionTask.description && (
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {nextActionTask.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-civic-300 font-medium">
              Click task below to toggle completion when performed.
            </span>
            {nextActionTask.category === "document_upload" || nextActionTask.title.toLowerCase().startsWith("upload") ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow-md">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Document Below</span>
              </div>
            ) : onPrepareApplication && !hasApplication ? (
              <button
                onClick={onPrepareApplication}
                disabled={isPreparingApplication}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-civic-500 hover:bg-civic-400 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{isPreparingApplication ? "Preparing Draft..." : "Prepare Application Draft"}</span>
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Progress Bar Component */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-civic-600" />
            Personalized Action Plan Progress
          </span>
          <span className="font-extrabold text-slate-900 text-sm">
            {progressPercent}% <span className="text-xs font-normal text-slate-500">({completedCount}/{totalCount} Steps Completed)</span>
          </span>
        </div>

        <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-civic-500 via-civic-600 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Missing Documents Alert Banner (if any) */}
      {workflow.missing_documents && workflow.missing_documents.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Missing Required Documentation ({workflow.missing_documents.length})</span>
          </div>
          <p className="text-amber-800/90">
            You are missing {workflow.missing_documents.length} required {workflow.missing_documents.length === 1 ? "document" : "documents"}. Upload tasks have been automatically scheduled in your action plan below.
          </p>
        </div>
      )}

      {/* Action Plan Task List (Numbered Timeline Format: 01, 02, 03...) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            YOUR CIVICOPS PLAN ({totalCount} SEQUENCED ACTIONS)
          </h4>
          <span className="text-[11px] text-slate-400">Click to toggle status</span>
        </div>

        <div className="space-y-2.5">
          {tasks.map((task, idx) => {
            const isDone = task.status === "completed";
            const isUpload = task.category === "document_upload" || task.title.toLowerCase().startsWith("upload");
            const isNext = nextActionTask?.id === task.id;
            const stepNum = String(idx + 1).padStart(2, "0");

            return (
              <div
                key={task.id || idx}
                onClick={() => toggleTaskCompleted(task.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group flex items-start gap-3.5 ${
                  isNext
                    ? "bg-civic-50/60 border-civic-400 shadow-md ring-2 ring-civic-500/20"
                    : isDone
                    ? "bg-slate-50/60 border-slate-200 text-slate-500 opacity-80"
                    : isUpload
                    ? "bg-amber-50/40 border-amber-300 hover:border-amber-400 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {/* Step Number Tag */}
                <div className={`font-mono font-extrabold text-xs px-2 py-1 rounded-lg mt-0.5 ${
                  isDone 
                    ? "bg-slate-200 text-slate-500" 
                    : isNext 
                    ? "bg-civic-600 text-white" 
                    : isUpload
                    ? "bg-amber-200 text-amber-900"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {stepNum}
                </div>

                {/* Status Icon */}
                <div className="mt-1 flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : isUpload ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : isNext ? (
                    <Clock className="w-5 h-5 text-civic-600 animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                  )}
                </div>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={`text-sm font-bold leading-snug ${
                        isDone ? "line-through text-slate-500" : isNext ? "text-civic-950 font-extrabold" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isDone ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          ✓ Completed
                        </span>
                      ) : isNext ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-civic-600 text-white shadow-2xs">
                          ● Current Next Step
                        </span>
                      ) : isUpload ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          ⚠ Upload Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {task.description && (
                    <p className={`text-xs mt-1 ${isDone ? "text-slate-400" : "text-slate-600"}`}>
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prepare Application CTA */}
      {onPrepareApplication && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-civic-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-civic-500/30 text-civic-200 border border-civic-400/40">
                Action Agent
              </span>
              <h4 className="text-sm font-bold text-white">Next Step: Prepare Formal Dispute Application</h4>
            </div>
            <p className="text-xs text-slate-300">
              The Action Agent will assemble your notice, research guidelines, and attached documents into a reviewable petition.
            </p>
          </div>

          <button
            type="button"
            onClick={onPrepareApplication}
            disabled={isPreparingApplication}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-civic-500 to-civic-600 hover:from-civic-600 hover:to-civic-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isPreparingApplication ? "Action Agent Preparing..." : hasApplication ? "Review / Re-generate Application" : "Prepare Application Draft"}</span>
          </button>
        </div>
      )}

      {/* Grounded Research Details Accordion & "Why this procedure?" */}
      {researchData && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
          <button
            onClick={() => setShowResearchDetails(!showResearchDetails)}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left font-bold text-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-civic-600" />
              <span>RESEARCH RESULT & PROCEDURAL RATIONALE</span>
            </div>
            {showResearchDetails ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showResearchDetails && (
            <div className="p-5 space-y-4 bg-white border-t border-slate-200 divide-y divide-slate-100">
              {/* Why this procedure? Rationale Section */}
              <div className="p-4 rounded-xl bg-civic-50/60 border border-civic-200/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-civic-900">
                  <Sparkles className="w-3.5 h-3.5 text-civic-600" />
                  <span>Why this procedure? (Research Agent Rationale)</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pl-5 font-medium">
                  {researchData.rationale || "The notice indicates a discrepancy between property records and municipal assessment requirements. Standard administrative dispute procedure applies."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 pb-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Procedure Title</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{researchData.procedure_name}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Authority</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{researchData.authority}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submission Channel</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{researchData.submission_method}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Filing Fees / Penalties</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{researchData.fees}</p>
                </div>
              </div>

              {/* Required Documents Comparison */}
              {researchData.required_documents && researchData.required_documents.length > 0 && (
                <div className="pt-3 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Required Statutory Documents</span>
                  <div className="flex flex-wrap gap-2">
                    {researchData.required_documents.map((doc, i) => {
                      const hasDoc = (workflow.matched_documents || []).some(m => m.toLowerCase().includes(doc.toLowerCase()) || doc.toLowerCase().includes(m.toLowerCase()));
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            hasDoc 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {hasDoc ? <Check className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {doc}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verified Sources */}
              {researchData.source_information && researchData.source_information.length > 0 && (
                <div className="pt-3 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Authoritative Sources Consulted (.gov)</span>
                  <ul className="space-y-1 text-slate-600 font-mono text-[11px]">
                    {researchData.source_information.map((src, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{src}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
