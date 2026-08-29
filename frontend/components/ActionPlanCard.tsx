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
  Wand2
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
  const [showResearchDetails, setShowResearchDetails] = useState(false);

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

  // Priority color styling
  const priorityLower = (workflow.priority || "medium").toLowerCase();
  const priorityBadge = 
    priorityLower === "high" || priorityLower === "critical"
      ? { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "High Priority" }
      : priorityLower === "low"
      ? { bg: "bg-blue-50 text-blue-700 border-blue-200", label: "Standard Priority" }
      : { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Medium Priority" };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-7 transition-all">
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

      {/* Progress Bar Component */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-civic-600" />
            Personalized Action Plan Progress
          </span>
          <span className="font-extrabold text-slate-900 text-sm">
            {progressPercent}% <span className="text-xs font-normal text-slate-500">({completedCount}/{totalCount} Steps)</span>
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

      {/* Action Plan Task List */}
      <div className="space-y-3.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Sequenced Action Items
        </h4>

        <div className="space-y-3">
          {tasks.map((task, idx) => {
            const isDone = task.status === "completed";
            const isUpload = task.category === "document_upload" || task.title.toLowerCase().startsWith("upload");
            const isUserAction = task.requires_user && !isDone;

            return (
              <div
                key={task.id || idx}
                onClick={() => toggleTaskCompleted(task.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group flex items-start gap-4 ${
                  isDone
                    ? "bg-slate-50/60 border-slate-200 text-slate-500 opacity-80"
                    : isUpload
                    ? "bg-amber-50/40 border-amber-300 hover:border-amber-400 shadow-xs"
                    : isUserAction
                    ? "bg-blue-50/30 border-blue-200 hover:border-blue-300 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                {/* Status Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : isUpload ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : isUserAction ? (
                    <Clock className="w-5 h-5 text-civic-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                  )}
                </div>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={`text-sm font-semibold leading-snug ${
                        isDone ? "line-through text-slate-500" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isDone ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Completed
                        </span>
                      ) : isUpload ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          Document Upload Required
                        </span>
                      ) : isUserAction ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                          Citizen Action
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

      {/* Grounded Research Details Accordion */}
      {researchData && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
          <button
            onClick={() => setShowResearchDetails(!showResearchDetails)}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left font-bold text-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-civic-600" />
              <span>Official Government Research & Statutory Guidelines</span>
            </div>
            {showResearchDetails ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showResearchDetails && (
            <div className="p-5 space-y-4 bg-white border-t border-slate-200 divide-y divide-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submission Channel</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{researchData.submission_method}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Filing Fees / Penalties</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{researchData.fees}</p>
                </div>
              </div>

              {researchData.source_information && researchData.source_information.length > 0 && (
                <div className="pt-3 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Sources</span>
                  <ul className="space-y-1 text-slate-600 font-mono text-[11px]">
                    {researchData.source_information.map((src, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-600">✓</span> {src}
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
