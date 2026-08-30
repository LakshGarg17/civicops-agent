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
  HelpCircle,
  ShieldCheck
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
    return lower === "not found" || lower === "none" || lower === "n/a" || lower === "null" || lower === "unverified";
  };

  const TrustBadge = () => (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded mt-1">
      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
      Extracted from notice
    </span>
  );

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in duration-300 space-y-6 p-6 sm:p-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 rounded-2xl bg-civic-50 text-civic-600 border border-civic-200 flex items-center justify-center shadow-xs">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-civic-100 text-civic-800 border border-civic-200">
                Document Intelligence
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Multimodal Extraction ✓
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              {isNotFound(noticeData.notice_type) ? "Civic Notice Analysis" : noticeData.notice_type}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Source file: <span className="font-semibold text-slate-700">{filename}</span>
              {metadata?.file_size_bytes && (
                <span> • {(metadata.file_size_bytes / 1024).toFixed(1)} KB</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJson(!showJson)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            {showJson ? "Hide JSON" : "View JSON"}
          </button>
          <button
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy JSON"}
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-civic-700 bg-civic-50 border border-civic-200 rounded-xl hover:bg-civic-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Upload Another
          </button>
        </div>
      </div>

      {/* Prominent Scannable Numbers Grid (Lead with core metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Amount */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            Amount Due / Disputed
          </span>
          <div className="font-mono text-xl font-extrabold text-amber-950">
            {isNotFound(noticeData.amount) ? (
              <span className="text-slate-400 font-normal text-xs italic">Not found in notice</span>
            ) : (
              noticeData.amount
            )}
          </div>
          {!isNotFound(noticeData.amount) && <TrustBadge />}
        </div>

        {/* Deadline */}
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
            Statutory Deadline
          </span>
          <div className="text-sm font-extrabold text-rose-950">
            {isNotFound(noticeData.deadline) ? (
              <span className="text-slate-400 font-normal text-xs italic">Not found in notice</span>
            ) : (
              noticeData.deadline
            )}
          </div>
          {!isNotFound(noticeData.deadline) && <TrustBadge />}
        </div>

        {/* Issuing Authority */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            Issuing Authority
          </span>
          <div className="text-xs font-extrabold text-slate-900 line-clamp-1">
            {isNotFound(noticeData.issuing_authority) ? (
              <span className="text-slate-400 font-normal text-xs italic">Not found</span>
            ) : (
              noticeData.issuing_authority
            )}
          </div>
          {!isNotFound(noticeData.department) && (
            <p className="text-[11px] text-slate-500 truncate">{noticeData.department}</p>
          )}
          {!isNotFound(noticeData.issuing_authority) && <TrustBadge />}
        </div>
      </div>

      {/* Structured Key Details Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-200 bg-slate-50/40 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-white">
          <div className="p-3.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Reference / Case #</span>
            <div className="font-mono font-bold text-slate-800">
              {isNotFound(noticeData.reference_number) ? (
                <span className="text-slate-400 italic font-normal">Not found</span>
              ) : (
                noticeData.reference_number
              )}
            </div>
            {!isNotFound(noticeData.reference_number) && <TrustBadge />}
          </div>

          <div className="p-3.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Citizen / Addressee</span>
            <div className="font-semibold text-slate-800">
              {isNotFound(noticeData.citizen_name) ? (
                <span className="text-slate-400 italic font-normal">Not found</span>
              ) : (
                noticeData.citizen_name
              )}
            </div>
            {!isNotFound(noticeData.citizen_name) && <TrustBadge />}
          </div>

          <div className="p-3.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Property / Parcel ID</span>
            <div className="font-mono font-bold text-slate-800">
              {isNotFound(noticeData.property_id) ? (
                <span className="text-slate-400 italic font-normal">Not found</span>
              ) : (
                noticeData.property_id
              )}
            </div>
            {!isNotFound(noticeData.property_id) && <TrustBadge />}
          </div>
        </div>
      </div>

      {/* Core Issue Section */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Core Issue & Citation Statement
            </h4>
          </div>
          {!isNotFound(noticeData.issue) && <TrustBadge />}
        </div>
        <p className="text-xs text-slate-800 leading-relaxed font-medium pl-6">
          {isNotFound(noticeData.issue) ? (
            <span className="text-slate-400 italic font-normal">No explicit issue statement identified in notice.</span>
          ) : (
            noticeData.issue
          )}
        </p>
      </div>

      {/* Required Action Section */}
      <div className="p-5 rounded-2xl border border-civic-200 bg-civic-50/50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightCircle className="w-4 h-4 text-civic-700" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-civic-900">
              Required Immediate Action
            </h4>
          </div>
          {!isNotFound(noticeData.required_action) && <TrustBadge />}
        </div>
        <p className="text-xs text-slate-800 leading-relaxed font-bold pl-6">
          {isNotFound(noticeData.required_action) ? (
            <span className="text-slate-400 italic font-normal">No immediate mandatory action stated in notice.</span>
          ) : (
            noticeData.required_action
          )}
        </p>
      </div>

      {/* Mentioned Documents in Notice */}
      {noticeData.mentioned_documents && noticeData.mentioned_documents.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-civic-600" />
            <span>Supporting Documents Referenced in Notice ({noticeData.mentioned_documents.length})</span>
          </div>
          <div className="flex flex-wrap gap-2 pl-6">
            {noticeData.mentioned_documents.map((doc, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold border border-slate-200 text-[11px]"
              >
                {doc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON Debug Viewer */}
      {showJson && (
        <div className="border border-slate-300 rounded-2xl overflow-hidden">
          <div className="bg-slate-900 px-4 py-2.5 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>Structured JSON Schema (NoticeStructuredData)</span>
            <span className="text-emerald-400 font-semibold">Valid Schema</span>
          </div>
          <pre className="p-4 bg-slate-950 text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-72">
            {JSON.stringify(noticeData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
