"use client";

import React, { useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { ProgressBar } from "@/components/ProgressBar";
import { NoticeSummaryCard, NoticeStructuredData } from "@/components/NoticeSummaryCard";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { AgentActivity } from "@/components/AgentActivity";
import { ActionPlanCard, WorkflowCase, ProcedureResearchData } from "@/components/ActionPlanCard";
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
  Car,
  Layers,
  ArrowLeft,
  RotateCcw
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  // Agent Workflow states
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
  const [researchData, setResearchData] = useState<ProcedureResearchData | null>(null);
  const [workflowCase, setWorkflowCase] = useState<WorkflowCase | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Step 1: Upload Notice & Run Document Intelligence Agent
  const handleFileUpload = async (file: File) => {
    setCurrentFile(file);
    setIsUploading(true);
    setErrorMessage(null);
    setUploadResult(null);
    setResearchData(null);
    setWorkflowCase(null);

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
      setUploadResult(data);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(
        err.message || "Failed to communicate with CivicOps backend. Please ensure the server is running."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2 & 3: Run Research Agent and Workflow Agent with user's available documents
  const handleGenerateWorkflow = async (userDocuments: string[]) => {
    if (!uploadResult?.notice_data) return;

    setIsGeneratingWorkflow(true);
    setErrorMessage(null);

    try {
      // 1. Call Research Agent Endpoint (/research)
      const researchRes = await fetch(`${API_URL}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notice_data: uploadResult.notice_data }),
      });

      if (!researchRes.ok) {
        const errData = await researchRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Research Agent failed (${researchRes.status})`);
      }

      const researchJson = await researchRes.json();
      const resData: ProcedureResearchData = researchJson.research_data;
      setResearchData(resData);

      // Brief delay to showcase live agent collaboration transitions
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 2. Call Workflow Agent Endpoint (/workflow)
      const workflowRes = await fetch(`${API_URL}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_data: uploadResult.notice_data,
          research_data: resData,
          user_documents: userDocuments,
        }),
      });

      if (!workflowRes.ok) {
        const errData = await workflowRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Workflow Agent failed (${workflowRes.status})`);
      }

      const workflowJson = await workflowRes.json();
      setWorkflowCase(workflowJson.workflow);
    } catch (err: any) {
      console.error("Workflow generation error:", err);
      setErrorMessage(
        err.message || "Failed to generate personalized action plan. Please check backend connection."
      );
    } finally {
      setIsGeneratingWorkflow(false);
    }
  };

  const handleReset = () => {
    setCurrentFile(null);
    setIsUploading(false);
    setIsGeneratingWorkflow(false);
    setUploadResult(null);
    setResearchData(null);
    setWorkflowCase(null);
    setErrorMessage(null);
  };

  // Quick Load Sample Helper
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
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold text-civic-800 bg-civic-50 border border-civic-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-civic-600" />
          Day 3: Document + Research + Workflow Agents Active
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          CivicOps
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto">
          Autonomous civic paperwork assistant: Multimodal ingestion, grounded statutory research, and personalized procedural action plans.
        </p>
      </div>

      {/* Main Interactive Work Area */}
      <div className="w-full space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Processing Error</p>
              <p className="text-red-600 mt-0.5">{errorMessage}</p>
              <button
                onClick={handleReset}
                className="mt-3 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                Reset & Try Again
              </button>
            </div>
          </div>
        )}

        {/* State 1: Uploading Notice */}
        {isUploading && currentFile ? (
          <ProgressBar filename={currentFile.name} />
        ) : uploadResult && currentFile ? (
          <div className="space-y-8">
            {/* Top Navigation Action Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Upload Different Notice
              </button>

              <span className="text-xs font-medium text-slate-400">
                Notice: <span className="text-slate-700 font-semibold">{uploadResult.filename}</span>
              </span>
            </div>

            {/* Generated Action Plan (If ready) */}
            {workflowCase && (
              <ActionPlanCard
                workflow={workflowCase}
                researchData={researchData || undefined}
              />
            )}

            {/* Agent Live Activity Panel (During Research & Workflow generation) */}
            {isGeneratingWorkflow && (
              <AgentActivity
                sourcesChecked={researchData?.source_information || []}
                isComplete={!isGeneratingWorkflow && !!workflowCase}
              />
            )}

            {/* Document Checklist & Available Documents Selector */}
            <DocumentChecklist
              documents={uploadResult.notice_data?.mentioned_documents || []}
              onGenerateWorkflow={handleGenerateWorkflow}
              isLoading={isGeneratingWorkflow}
              hasGeneratedWorkflow={!!workflowCase}
            />

            {/* Document Intelligence Notice Summary */}
            <NoticeSummaryCard
              filename={uploadResult.filename}
              noticeData={uploadResult.notice_data}
              metadata={uploadResult.metadata}
              onReset={handleReset}
            />
          </div>
        ) : (
          <UploadCard onFileSelected={handleFileUpload} disabled={isUploading} />
        )}
      </div>

      {/* Quick Test Samples */}
      {!uploadResult && !isUploading && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-civic-600" />
              Try a Sample Civic Notice (1-Click Multi-Agent Pipeline)
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

      {/* Multi-Agent Architecture Explanation Footer */}
      <div className="border-t border-slate-200/80 pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">CivicOps Autonomous Pipeline</h3>
            <p className="text-xs text-slate-500">How the multi-agent system resolves civic paperwork end-to-end</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Day 3 Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-900">Document Agent</h4>
            <p className="text-[11px] text-slate-500">
              Multimodal parsing of PDF/images, extracting structured case citations, deadlines, and cited proofs.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-900">Research Agent</h4>
            <p className="text-[11px] text-slate-500">
              Queries official .gov portals and municipal codes to determine applicable procedures, fees, and rules without hallucinating.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-900">Workflow Agent</h4>
            <p className="text-[11px] text-slate-500">
              Diffs required documents against citizen inventory, generates upload tasks, and sequences an interactive action plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
