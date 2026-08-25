"use client";

import React from "react";
import { AlertTriangle, FileCheck, CheckCircle, Info } from "lucide-react";

interface DocumentChecklistProps {
  documents: string[];
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ documents }) => {
  const validDocs = documents.filter(
    (doc) => doc && doc.trim() && doc.trim().toLowerCase() !== "not found"
  );

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Required Documents & Evidence</h4>
            <p className="text-xs text-slate-500">
              Supporting documents explicitly cited in the notice that you may need to submit
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {validDocs.length} {validDocs.length === 1 ? "Item" : "Items"}
        </span>
      </div>

      {validDocs.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>No specific supporting documents or forms were requested in this notice.</span>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {validDocs.map((doc, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/40 border border-amber-200/60 hover:bg-amber-50/70 transition-colors"
            >
              <div className="mt-0.5 p-1 rounded-md bg-amber-100/80 text-amber-700 flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 leading-snug">{doc}</p>
                <p className="text-[11px] text-amber-800/80 mt-0.5">Pending Citizen Gathering / Submission</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
