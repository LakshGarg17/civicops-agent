"use client";

import React, { useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { ProgressBar } from "@/components/ProgressBar";
import { NoticeSummaryCard, NoticeStructuredData } from "@/components/NoticeSummaryCard";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { 
  FileText, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
  CheckCircle,
  FileCheck,
  Building,
  Car
} from "lucide-react";

interface UploadResult {
  status: string;
  filename: string;
  notice_data: NoticeStructuredData;
  processing_stages?: string[];
  extracted_text?: string;
  ai_response?: string;
  metadata?: {
    file_size_bytes?: number;
    char_count?: number;
    content_type?: string;
    saved_path?: string;
  };
}

export default function Home() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleFileUpload = async (file: File) => {
    setCurrentFile(file);
    setIsProcessing(true);
    setErrorMessage(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned error (${response.status})`);
      }

      const data: UploadResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(
        err.message || "Failed to communicate with CivicOps backend. Please ensure the server is running."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentFile(null);
    setIsProcessing(false);
    setResult(null);
    setErrorMessage(null);
  };

  // Sample quick load helper for testing
  const loadSampleNotice = (title: string, text: string, filename: string = "") => {
    const fname = filename || `${title.toLowerCase().replace(/\s+/g, "_")}.txt`;
    const blob = new Blob([text], { type: "text/plain" });
    const sampleFile = new File([blob], fname, {
      type: "text/plain",
    });
    handleFileUpload(sampleFile);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold text-civic-800 bg-civic-50 border border-civic-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-civic-600" />
          Day 2: Document Intelligence Agent Active
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          CivicOps
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto">
          Autonomous paperwork assistant: Multimodal civic notice ingestion & structured extraction.
        </p>
      </div>

      {/* Main Interactive Work Area */}
      <div className="w-full space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Processing Failed</p>
              <p className="text-red-600 mt-0.5">{errorMessage}</p>
              <button
                onClick={handleReset}
                className="mt-3 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {isProcessing && currentFile ? (
          <ProgressBar filename={currentFile.name} />
        ) : result && currentFile ? (
          <div className="space-y-6">
            <NoticeSummaryCard
              filename={result.filename}
              noticeData={result.notice_data}
              metadata={result.metadata}
              onReset={handleReset}
            />

            <DocumentChecklist
              documents={result.notice_data?.mentioned_documents || []}
            />
          </div>
        ) : (
          <UploadCard onFileSelected={handleFileUpload} disabled={isProcessing} />
        )}
      </div>

      {/* Quick Test Samples */}
      {!result && !isProcessing && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-civic-600" />
              Try a Sample Civic Notice (1-Click Test)
            </h4>
            <span className="text-[11px] font-medium text-slate-400">PDF & Text Samples</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sample 1: Property Tax Notice */}
            <button
              onClick={() =>
                loadSampleNotice(
                  "Property Tax Delinquency Notice",
                  `COUNTY OF KINGS - OFFICE OF THE TAX COLLECTOR\nFINAL NOTICE OF DELINQUENT PROPERTY TAX\nDate of Notice: October 15, 2024\nParcel Identification / APN: 4920-038-012\nAssessee: Jane Doe & John Doe\nProperty Location: 742 Evergreen Terrace, Kings County\nTOTAL DELINQUENT AMOUNT DUE: $4,911.25\nStatutory Due Date / Deadline: NOVEMBER 30, 2024\nISSUE & STATUTORY NOTICE: The second installment of real property tax for fiscal year 2023-2024 remains unpaid. Statutory lien attachment will proceed under Section 3351.\nREQUIRED ACTIONS: 1. Remit full payment of $4,911.25 via kingscounty.gov/taxes. 2. Submit Dispute Form TC-409 with required evidence within 30 days if contested.\nMENTIONED SUPPORTING DOCUMENTS: Dispute Form TC-409, Proof of prior tax payment or canceled check, Recorded Grant Deed / Proof of Ownership`,
                  "property_tax_delinquency_notice.pdf"
                )
              }
              className="text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-civic-400 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100">
                    Tax Notice
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-civic-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-civic-700">
                  Property Tax Delinquency
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Kings County • $4,911.25 Due</p>
              </div>
            </button>

            {/* Sample 2: Building Permit Notice */}
            <button
              onClick={() =>
                loadSampleNotice(
                  "Building Permit Correction Notice",
                  `CITY OF OAKRIDGE - DEPARTMENT OF BUILDING INSPECTION\nPLAN CHECK CORRECTION NOTICE\nApplication #: BLD-2024-88412\nCitizen Name: Marcus Vance\nProperty Location: 1044 Hillcrest Ave, Oakridge\nAmount: $185.00 Re-Review Fee\nResubmission Deadline: Within 60 calendar days\nISSUE: Plan check corrections required for 18 rooftop solar PV modules.\nREQUIRED ACTIONS: Revise structural rafter calculations, provide AC disconnect location, and resubmit.\nMENTIONED SUPPORTING DOCUMENTS: Revised Structural Calculations (Stamped by PE), Single Line Electrical Diagram, AC Disconnect Specification Sheet`,
                  "building_permit_correction_notice.txt"
                )
              }
              className="text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-civic-400 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                    Permit Notice
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-civic-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-civic-700">
                  Plan Check Correction
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">City of Oakridge • 60-day Window</p>
              </div>
            </button>

            {/* Sample 3: Parking Citation */}
            <button
              onClick={() =>
                loadSampleNotice(
                  "Parking Citation Notice",
                  `CITY OF METROPOLIS - DEPARTMENT OF TRANSPORTATION\nNOTICE OF PARKING VIOLATION\nCitation #: PV-99120\nViolation Code: 80.69BS (Street Cleaning Zone)\nFine Amount: $65.00\nPayment Deadline: December 15, 2024\nREQUIRED ACTION: Pay fine online or request administrative review within 21 days.\nMENTIONED SUPPORTING DOCUMENTS: Citation Notice, Proof of valid residential parking permit`,
                  "parking_citation.txt"
                )
              }
              className="text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-civic-400 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    Citation
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-civic-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-civic-700">
                  Parking Violation Notice
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">City of Metropolis • $65.00 Fine</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Recent Cases Preview */}
      <div className="border-t border-slate-200/80 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Cases & Guidance</h3>
            <p className="text-xs text-slate-500">Preview of tracked paperwork across municipal agencies</p>
          </div>
          <span className="text-xs font-medium text-slate-400">Placeholder View</span>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">NYC Dept of Finance — Property Tax Notice</h4>
                <p className="text-xs text-slate-500">Case #NY-2024-918 • Action: Installment plan filed</p>
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Pending Resolution
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">SF Dept of Building Inspection — Correction Resubmission</h4>
                <p className="text-xs text-slate-500">Case #SF-BLD-441 • Action: Stamped engineering approved</p>
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Resolved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
