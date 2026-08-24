"use client";

import React, { useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { ProgressBar } from "@/components/ProgressBar";
import { ResponseCard } from "@/components/ResponseCard";
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  FileSpreadsheet,
  CheckCircle
} from "lucide-react";

interface UploadResult {
  status: string;
  filename: string;
  extracted_text: string;
  ai_response: string;
  metadata?: {
    file_size_bytes?: number;
    char_count?: number;
    content_type?: string;
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
  const loadSampleNotice = (title: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const sampleFile = new File([blob], `${title.toLowerCase().replace(/\s+/g, "_")}.txt`, {
      type: "text/plain",
    });
    handleFileUpload(sampleFile);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-civic-700 bg-civic-50 border border-civic-200">
          <Sparkles className="w-3.5 h-3.5 text-civic-500" />
          Day 1 Prototype: Document Intelligence Pipeline
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          CivicOps
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto">
          Turn government paperwork into clear actions.
        </p>
      </div>

      {/* Main Interactive Work Area */}
      <div className="w-full">
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-700">
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
          <ResponseCard
            filename={result.filename}
            extractedText={result.extracted_text}
            aiResponse={result.ai_response}
            metadata={result.metadata}
            onReset={handleReset}
          />
        ) : (
          <UploadCard onFileSelected={handleFileUpload} disabled={isProcessing} />
        )}
      </div>

      {/* Quick Test Samples */}
      {!result && !isProcessing && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-civic-600" />
              Try a Sample Civic Notice (1-Click Test)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() =>
                loadSampleNotice(
                  "Property Tax Delinquency Notice",
                  `COUNTY OF KINGS - OFFICE OF THE TAX COLLECTOR\nFINAL NOTICE OF DELINQUENT PROPERTY TAX\nPARCEL APN: 4920-038-012\nTOTAL AMOUNT DUE BY NOVEMBER 30, 2024: $4,911.25\nFailure to pay or submit Dispute Form TC-409 will result in statutory lien attachment.`
                )
              }
              className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-civic-400 hover:shadow-xs transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-civic-700">
                  Property Tax Delinquency Notice
                </p>
                <p className="text-[11px] text-slate-500">Kings County Tax Collector • Due Nov 30</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-civic-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() =>
                loadSampleNotice(
                  "Building Permit Correction Notice",
                  `CITY OF OAKRIDGE - DEPARTMENT OF BUILDING INSPECTION\nPLAN CHECK CORRECTION NOTICE\nAPPLICATION #: BLD-2024-88412\nREVISIONS REQUIRED: 1. Structural rafter calculations for 18 PV modules. 2. AC disconnect location. Resubmission deadline: 60 days with $185 re-review fee.`
                )
              }
              className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-civic-400 hover:shadow-xs transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-civic-700">
                  Building Permit Correction Notice
                </p>
                <p className="text-[11px] text-slate-500">City of Oakridge • Plan Check #88412</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-civic-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Recent Cases (Static Placeholder Section for Day 1) */}
      <div className="border-t border-slate-200/80 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Cases & Guidance</h3>
            <p className="text-xs text-slate-500">Static preview of tracked paperwork across municipal agencies</p>
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
