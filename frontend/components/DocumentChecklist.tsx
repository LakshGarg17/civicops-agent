"use client";

import React, { useState } from "react";
import { 
  FileCheck, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Sparkles, 
  Info,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface DocumentChecklistProps {
  documents: string[];
  onGenerateWorkflow?: (userDocuments: string[]) => void;
  isLoading?: boolean;
  hasGeneratedWorkflow?: boolean;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ 
  documents,
  onGenerateWorkflow,
  isLoading = false,
  hasGeneratedWorkflow = false
}) => {
  const initialValidDocs = documents.filter(
    (doc) => doc && doc.trim() && doc.trim().toLowerCase() !== "not found"
  );

  const [availableDocs, setAvailableDocs] = useState<string[]>([]);
  const [customDoc, setCustomDoc] = useState("");
  const [allDocItems, setAllDocItems] = useState<string[]>(initialValidDocs);

  // Toggle item in available documents list
  const toggleDocument = (doc: string) => {
    setAvailableDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  const handleAddCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDoc.trim()) return;
    const trimmed = customDoc.trim();
    if (!allDocItems.includes(trimmed)) {
      setAllDocItems((prev) => [...prev, trimmed]);
      setAvailableDocs((prev) => [...prev, trimmed]);
    }
    setCustomDoc("");
  };

  const handleSelectAll = () => {
    if (availableDocs.length === allDocItems.length) {
      setAvailableDocs([]);
    } else {
      setAvailableDocs([...allDocItems]);
    }
  };

  const handleGenerate = () => {
    if (onGenerateWorkflow) {
      onGenerateWorkflow(availableDocs);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-civic-50 text-civic-600 border border-civic-100 flex items-center justify-center shadow-xs">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Your Document Inventory & Checklist</h4>
            <p className="text-xs text-slate-500">
              Check off the items you already have on hand to personalize your procedural action plan.
            </p>
          </div>
        </div>

        {allDocItems.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              type="button"
              className="text-xs font-semibold text-slate-600 hover:text-civic-700 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors"
            >
              {availableDocs.length === allDocItems.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-civic-50 text-civic-800 border border-civic-200">
              {availableDocs.length} / {allDocItems.length} Ready
            </span>
          </div>
        )}
      </div>

      {/* Document Items List */}
      {allDocItems.length === 0 ? (
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">No explicit supporting documents cited in notice</p>
            <p className="mt-0.5 text-slate-500">The Research Agent will identify standard statutory requirements for this procedure.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {allDocItems.map((doc, idx) => {
            const isChecked = availableDocs.includes(doc);
            return (
              <div
                key={idx}
                onClick={() => toggleDocument(doc)}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                  isChecked
                    ? "bg-emerald-50/50 border-emerald-300/80 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                  aria-label={isChecked ? "Uncheck document" : "Check document"}
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug ${isChecked ? "text-slate-900" : "text-slate-700"}`}>
                      {doc}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 ${
                        isChecked
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {isChecked ? "On Hand" : "Missing / Needed"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isChecked
                      ? "Marked as available — ready to attach to application."
                      : "Not currently marked — Workflow Agent will schedule an upload task."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Document Input */}
      <form onSubmit={handleAddCustomDoc} className="flex gap-2 pt-1">
        <input
          type="text"
          value={customDoc}
          onChange={(e) => setCustomDoc(e.target.value)}
          placeholder="Add any additional evidence or document you have (e.g. Bank statement, Photos)..."
          className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-500/20 focus:border-civic-500 bg-slate-50/40 text-slate-800 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!customDoc.trim()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
      </form>

      {/* Action Plan Generation CTA */}
      {onGenerateWorkflow && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-civic-600 to-civic-700 hover:from-civic-700 hover:to-civic-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-civic-200 group-hover:rotate-12 transition-transform" />
            <span>
              {isLoading
                ? "Agents Collaborating (Research + Workflow)..."
                : hasGeneratedWorkflow
                ? "Re-calculate Action Plan with Updated Documents"
                : "Research Procedure & Generate Personalized Action Plan"}
            </span>
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Invokes Research Agent (grounded gov search) + Workflow Agent (diffing & task scheduling).
          </p>
        </div>
      )}
    </div>
  );
};
