"use client";

import React, { useState } from "react";
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  AlertOctagon,
  ArrowRightCircle,
  Hash,
  User,
  MapPin,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  Code2,
  CheckCircle2,
  HelpCircle
} from "lucide-react";

export interface NoticeStructuredData {
  notice_type: string;
  issuing_authority: string;
  department: string;
  reference_number: string;
  citizen_name: string;
  property_id: string;
  amount: string;
  issue: string;
  deadline: string;
  required_action: string;
  mentioned_documents: string[];
}

interface NoticeSummaryCardProps {
  filename: string;
  noticeData: NoticeStructuredData;
  metadata?: {
    file_size_bytes?: number;
    char_count?: number;
    content_type?: string;
    saved_path?: string;
  };
  onReset: () => void;
}

export const NoticeSummaryCard: React.FC<NoticeSummaryCardProps> = ({
  filename,
  noticeData,
  metadata,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(noticeData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNotFound = (val?: string) => {
    if (!val) return true;
    const lower = val.trim().toLowerCase();
    return lower === "not found" || lower === "none" || lower === "n/a" || lower === "null";
  };

  const renderFieldValue = (
    val: string,
    highlight: "default" | "amount" | "deadline" = "default"
  ) => {
    if (isNotFound(val)) {
      return (
        <span className="inline-flex items-center gap-1 text-slate-400 italic text-xs font-normal">
          <HelpCircle className="w-3 h-3 text-slate-300" />
          Not found
        </span>
      );
    }

    if (highlight === "amount") {
      return (
        <span className="font-mono font-bold text-slate-900 bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md text-sm">
          {val}
        </span>
      );
    }

    if (highlight === "deadline") {
      return (
        <span className="font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md text-xs">
          {val}
        </span>
      );
    }

    return <span className="font-medium text-slate-800 text-sm">{val}</span>;
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-civic-50 via-slate-50 to-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-civic-600 text-white flex items-center justify-center shadow-xs">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">NOTICE SUMMARY</h3>
              <span className="text-[11px] font-semibold bg-civic-100 text-civic-800 px-2.5 py-0.5 rounded-full border border-civic-200">
                Document Agent
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="font-medium text-slate-700">{filename}</span>
              {metadata?.file_size_bytes && (
                <span>• {(metadata.file_size_bytes / 1024).toFixed(1)} KB</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            {showJson ? "Hide JSON" : "View JSON"}
          </button>
          <button
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy JSON"}
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-civic-700 bg-civic-50 border border-civic-200 rounded-lg hover:bg-civic-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Upload Another
          </button>
        </div>
      </div>

      {/* Structured Key-Value Metadata Grid */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Core Header Information Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-200 bg-slate-50/40">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Notice Type */}
            <div className="p-4 flex items-start gap-3 bg-white">
              <div className="p-2 rounded-lg bg-civic-50 text-civic-600 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Type
                </span>
                {isNotFound(noticeData.notice_type) ? (
                  renderFieldValue(noticeData.notice_type)
                ) : (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white tracking-wide">
                    {noticeData.notice_type}
                  </span>
                )}
              </div>
            </div>

            {/* Issuing Authority & Department */}
            <div className="p-4 flex items-start gap-3 bg-white">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Authority & Dept
                </span>
                <div className="space-y-0.5">
                  <div>{renderFieldValue(noticeData.issuing_authority)}</div>
                  {!isNotFound(noticeData.department) && (
                    <p className="text-xs text-slate-500">{noticeData.department}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {/* Reference Number */}
            <div className="p-4 flex items-start gap-3 bg-white">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 mt-0.5">
                <Hash className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Reference / Case #
                </span>
                {renderFieldValue(noticeData.reference_number)}
              </div>
            </div>

            {/* Amount */}
            <div className="p-4 flex items-start gap-3 bg-white">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 mt-0.5">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Amount
                </span>
                {renderFieldValue(noticeData.amount, "amount")}
              </div>
            </div>

            {/* Deadline */}
            <div className="p-4 flex items-start gap-3 bg-white">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Deadline
                </span>
                {renderFieldValue(noticeData.deadline, "deadline")}
              </div>
            </div>
          </div>

          {/* Secondary Details (Citizen Name & Property ID) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/70">
            <div className="px-4 py-3 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Citizen / Addressee:
              </span>
              <span>{renderFieldValue(noticeData.citizen_name)}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Property / Parcel ID:
              </span>
              <span>{renderFieldValue(noticeData.property_id)}</span>
            </div>
          </div>
        </div>

        {/* ISSUE Section */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              ISSUE
            </h4>
          </div>
          <div className="text-sm text-slate-800 leading-relaxed pl-6">
            {isNotFound(noticeData.issue) ? (
              <span className="text-slate-400 italic text-xs">No specific issue description found in notice.</span>
            ) : (
              noticeData.issue
            )}
          </div>
        </div>

        {/* REQUIRED ACTION Section */}
        <div className="p-5 rounded-xl border border-civic-200 bg-civic-50/50 space-y-2">
          <div className="flex items-center gap-2">
            <ArrowRightCircle className="w-4 h-4 text-civic-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-civic-900">
              REQUIRED ACTION
            </h4>
          </div>
          <div className="text-sm text-slate-800 leading-relaxed font-medium pl-6">
            {isNotFound(noticeData.required_action) ? (
              <span className="text-slate-400 italic text-xs font-normal">
                No immediate mandatory action stated in notice.
              </span>
            ) : (
              noticeData.required_action
            )}
          </div>
        </div>

        {/* Raw JSON Debug Viewer */}
        {showJson && (
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-2 text-xs font-mono text-slate-300 flex items-center justify-between">
              <span>Structured JSON Schema Output (NoticeStructuredData)</span>
              <span className="text-emerald-400 font-semibold">Valid Schema</span>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-72">
              {JSON.stringify(noticeData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
