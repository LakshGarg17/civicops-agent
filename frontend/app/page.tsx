"use client";

import React, { useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { ProgressBar } from "@/components/ProgressBar";
import { NoticeSummaryCard, NoticeStructuredData } from "@/components/NoticeSummaryCard";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { AgentActivity, AgentActivityState } from "@/components/AgentActivity";
import { ActionPlanCard, WorkflowCase, ProcedureResearchData } from "@/components/ActionPlanCard";
import { ApplicationReviewCard, ApplicationDocument } from "@/components/ApplicationReviewCard";
import { ApprovalPrompt } from "@/components/ApprovalPrompt";
import { CaseStatusCard, SubmissionRecord, CaseNotification } from "@/components/CaseStatusCard";
import { CaseActivityTimeline, TimelineEvent } from "@/components/CaseActivityTimeline";
import { DemoStatusController } from "@/components/DemoStatusController";
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
  RotateCcw, 
  ShieldCheck, 
  FolderLock, 
  ListOrdered, 
  Activity, 
  Send, 
  Lock, 
  Cloud, 
  Database,
  Search,
  CheckCircle2
} from "lucide-react";

interface UploadResult {
  status: string;
  filename: string;
  notice_data: NoticeStructuredData;
  processing_stages?: string[];
  extracted_text?: string;
  ai_response?: string;
  metadata?: {
    document_id?: string;
    gcs_uri?: string;
    storage_path?: string;
    file_size_bytes?: number;
    saved_path?: string;
    content_type?: string;
  };
}

interface CivicCaseFull {
  case_id: string;
  title?: string;
  status: string;
  deadline?: string;
  notice: NoticeStructuredData;
  research: ProcedureResearchData;
  workflow: WorkflowCase;
  application?: ApplicationDocument;
  submission?: SubmissionRecord;
  approval_record?: any;
  timeline: TimelineEvent[];
  unread_notification?: CaseNotification | null;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  // Multi-agent workflow execution states
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
  const [isPreparingApplication, setIsPreparingApplication] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const [activeCase, setActiveCase] = useState<CivicCaseFull | null>(null);
  const [activeTab, setActiveTab] = useState<"action_plan" | "application" | "timeline" | "notice">("action_plan");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedChangeCallout, setDetectedChangeCallout] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Derive agent activity states strictly from backend completion
  const agentActivityState: AgentActivityState = {
    documentAnalyzed: !!uploadResult?.notice_data,
    procedureIdentified: !!activeCase?.research?.procedure_name,
    actionPlanGenerated: !!activeCase?.workflow?.tasks?.length,
    applicationPrepared: !!activeCase?.application?.to,
    documentsVerified: !!activeCase?.workflow?.matched_documents?.length || !!activeCase?.workflow?.tasks?.length,
    humanApproved: !!activeCase?.approval_record,
    applicationSubmitted: !!activeCase?.submission?.confirmation_number,
    monitoringActive: activeCase?.status === "submitted" || activeCase?.status === "under_review" || activeCase?.status === "additional_information_required"
  };

  // Step 1: Upload Notice to Cloud Storage & Firestore
  const handleFileUpload = async (file: File) => {
    setCurrentFile(file);
    setIsUploading(true);
    setErrorMessage(null);
    setUploadResult(null);
    setActiveCase(null);
    setDetectedChangeCallout(null);

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
        err.message || "Unable to analyze this document. Please try: a clearer scan, a PDF with selectable text, or a supported image format."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2 & 3: Run Research Agent and Workflow Agent (Persisting in Firestore)
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
      const wfCase: WorkflowCase = workflowJson.workflow;

      // 3. Fetch persistent case from Firestore
      const caseRes = await fetch(`${API_URL}/cases/${wfCase.case_id}`);
      if (caseRes.ok) {
        const caseFull: CivicCaseFull = await caseRes.json();
        setActiveCase(caseFull);
      }
      setActiveTab("action_plan");
    } catch (err: any) {
      console.error("Workflow error:", err);
      setErrorMessage(
        err.message || "CivicOps couldn't verify the required procedure from authoritative sources. No unverified requirement has been added."
      );
    } finally {
      setIsGeneratingWorkflow(false);
    }
  };

  // Step 4: Action Agent prepares Application Draft
  const handlePrepareApplication = async () => {
    if (!activeCase) return;

    setIsPreparingApplication(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_URL}/cases/${activeCase.case_id}/prepare-application`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: activeCase.notice.citizen_name || "Citizen / Property Owner"
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Action Agent failed (${res.status})`);
      }

      const updatedCase: CivicCaseFull = await res.json();
      setActiveCase(updatedCase);
      setActiveTab("application");
    } catch (err: any) {
      console.error("Prepare application error:", err);
      setErrorMessage(err.message || "Failed to prepare application draft.");
    } finally {
      setIsPreparingApplication(false);
    }
  };

  // Step 5: Save Edits to Application
  const handleSaveApplicationEdits = async (updatedFields: Partial<ApplicationDocument>) => {
    if (!activeCase) return;

    try {
      const res = await fetch(`${API_URL}/cases/${activeCase.case_id}/application`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to update application (${res.status})`);
      }

      const updatedCase: CivicCaseFull = await res.json();
      setActiveCase(updatedCase);
    } catch (err: any) {
      console.error("Save application edits error:", err);
      setErrorMessage(err.message || "Failed to save application changes.");
    }
  };

  // Step 6: Human Approves Action & Submits to Sandbox Gateway
  const handleApproveAndSubmit = async () => {
    if (!activeCase) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Send explicit approval record to server
      const approveRes = await fetch(`${API_URL}/cases/${activeCase.case_id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: "submit_application",
          approved_by: activeCase.application?.applicant_name || "Citizen Operator",
          notes: "Approved by user via CivicOps Web UI."
        })
      });

      if (!approveRes.ok) {
        const errData = await approveRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Authorization failed (${approveRes.status})`);
      }

      // 2. Trigger server-gated sandbox submission
      const submitRes = await fetch(`${API_URL}/cases/${activeCase.case_id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!submitRes.ok) {
        const errData = await submitRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Sandbox submission failed (${submitRes.status})`);
      }

      const finalCase: CivicCaseFull = await submitRes.json();
      setActiveCase(finalCase);
      setShowApprovalModal(false);
      setActiveTab("timeline");
    } catch (err: any) {
      console.error("Approval/Submission error:", err);
      setErrorMessage(err.message || "Failed to complete approved submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 7: Trigger Autonomous Monitoring Check
  const handleTriggerMonitoring = async () => {
    if (!activeCase) return;

    setIsMonitoring(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_URL}/monitor/${activeCase.case_id}`, {
        method: "POST"
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Monitoring check failed (${res.status})`);
      }

      const data = await res.json();
      const updatedCase: CivicCaseFull = data.case;
      setActiveCase(updatedCase);

      if (data.analysis?.change_detected) {
        setDetectedChangeCallout({
          previousStatus: data.analysis.previous_status,
          currentStatus: data.analysis.current_status,
          summary: data.analysis.summary,
          nextAction: data.analysis.next_action
        });
      }
    } catch (err: any) {
      console.error("Monitoring error:", err);
      setErrorMessage(err.message || "Failed to run autonomous monitoring cycle.");
    } finally {
      setIsMonitoring(false);
    }
  };

  // Step 8: Handle Demo Gateway Status Flip
  const handleDemoStatusChanged = async (newStatus: string) => {
    if (!activeCase) return;

    try {
      const caseRes = await fetch(`${API_URL}/cases/${activeCase.case_id}`);
      if (caseRes.ok) {
        const caseFull: CivicCaseFull = await caseRes.json();
        setActiveCase(caseFull);

        if (caseFull.unread_notification) {
          setDetectedChangeCallout({
            previousStatus: "under_review",
            currentStatus: newStatus,
            summary: caseFull.unread_notification.message,
            nextAction: caseFull.unread_notification.action_label || "Upload ownership proof"
          });
        }
      }
    } catch (err) {
      console.error("Refresh case error:", err);
    }
  };

  // Step 9: Acknowledge Notification
  const handleAcknowledgeNotification = async () => {
    if (!activeCase) return;
    try {
      const res = await fetch(`${API_URL}/cases/${activeCase.case_id}/acknowledge-notification`, {
        method: "POST"
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveCase(updated);
      }
    } catch (err) {
      console.error("Acknowledge notification error:", err);
    }
  };

  const handleReset = () => {
    setCurrentFile(null);
    setIsUploading(false);
    setIsGeneratingWorkflow(false);
    setIsPreparingApplication(false);
    setIsSubmitting(false);
    setIsMonitoring(false);
    setUploadResult(null);
    setActiveCase(null);
    setShowApprovalModal(false);
    setErrorMessage(null);
    setDetectedChangeCallout(null);
    setActiveTab("action_plan");
  };

  // Sample quick load helper
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
      {/* Home Page Polish (Clear, direct copy) */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900">
          CivicOps
        </h1>
        <p className="text-xl sm:text-2xl font-bold text-civic-700">
          Turn government paperwork into action.
        </p>
        <p className="text-sm sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
          Upload a government notice. CivicOps understands what it means, researches what you need to do, prepares the next steps, and keeps track of your case.
        </p>

        {/* 4-step strip: Understand → Plan → Act → Track */}
        <div className="pt-3 pb-2">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200/90 px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs">
            <span className="flex items-center gap-1 text-slate-900 font-extrabold">
              <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
              Understand
            </span>
            <span className="text-slate-300">→</span>
            <span className="flex items-center gap-1 text-slate-900 font-extrabold">
              <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
              Plan
            </span>
            <span className="text-slate-300">→</span>
            <span className="flex items-center gap-1 text-slate-900 font-extrabold">
              <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
              Act
            </span>
            <span className="text-slate-300">→</span>
            <span className="flex items-center gap-1 text-civic-700 font-extrabold">
              <span className="h-5 w-5 rounded-full bg-civic-600 text-white flex items-center justify-center text-[10px]">4</span>
              Track
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Work Area */}
      <div className="w-full space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Notice Processing Note</p>
              <p className="text-red-600 mt-0.5">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="mt-3 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* State 1: Uploading Notice with staged activity */}
        {isUploading && currentFile ? (
          <div className="space-y-4">
            <ProgressBar filename={currentFile.name} />
            <AgentActivity
              activityState={{
                documentAnalyzed: false,
                procedureIdentified: false,
                actionPlanGenerated: false,
                applicationPrepared: false,
                documentsVerified: false,
                humanApproved: false,
                applicationSubmitted: false,
                monitoringActive: false
              }}
              isLoading={true}
            />
          </div>
        ) : uploadResult && currentFile ? (
          <div className="space-y-8">
            {/* Top Navigation Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Upload Another Notice
              </button>

              {activeCase && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                    {activeCase.case_id}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    activeCase.status === "additional_information_required"
                      ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                      : activeCase.status === "submitted" || activeCase.status === "approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {activeCase.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Case Status Dashboard Card (When Case Exists) */}
            {activeCase && (
              <CaseStatusCard
                submission={activeCase.submission}
                caseId={activeCase.case_id}
                status={activeCase.status}
                title={activeCase.title || `${activeCase.notice.notice_type} Correction`}
                deadline={activeCase.deadline || activeCase.notice.deadline}
                notification={activeCase.unread_notification}
                detectedChange={detectedChangeCallout}
                onViewTimeline={() => setActiveTab("timeline")}
                onViewRequiredAction={() => setActiveTab("action_plan")}
                onAcknowledgeNotification={handleAcknowledgeNotification}
              />
            )}

            {/* Demo Status Gateway Controller (For Hackathon Presentations) */}
            {activeCase && (
              <DemoStatusController
                caseId={activeCase.case_id}
                currentStatus={activeCase.status}
                onStatusChanged={handleDemoStatusChanged}
                onTriggerMonitoring={handleTriggerMonitoring}
                isLoading={isMonitoring}
              />
            )}

            {/* Navigation Tabs */}
            {activeCase && (
              <div className="flex border-b border-slate-200 overflow-x-auto gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("action_plan")}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "action_plan"
                      ? "bg-civic-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Action Plan ({activeCase.workflow.tasks.length} tasks)</span>
                </button>

                {activeCase.application && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("application")}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                      activeTab === "application"
                        ? "bg-civic-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Application Package</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab("timeline")}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "timeline"
                      ? "bg-civic-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Multi-Agent Timeline ({activeCase.timeline.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("notice")}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === "notice"
                      ? "bg-civic-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Notice Extraction</span>
                </button>
              </div>
            )}

            {/* Agent Activity Screen */}
            <AgentActivity
              activityState={agentActivityState}
              sourcesChecked={activeCase?.research?.source_information || []}
              isLoading={isGeneratingWorkflow}
              detectedChange={detectedChangeCallout}
            />

            {/* TAB 1: Action Plan & Checklist */}
            {(!activeCase || activeTab === "action_plan") && (
              <div className="space-y-6">
                {activeCase?.workflow && (
                  <ActionPlanCard
                    workflow={activeCase.workflow}
                    researchData={activeCase.research}
                    onPrepareApplication={handlePrepareApplication}
                    isPreparingApplication={isPreparingApplication}
                    hasApplication={!!activeCase.application}
                  />
                )}

                <DocumentChecklist
                  documents={uploadResult.notice_data?.mentioned_documents || []}
                  onGenerateWorkflow={handleGenerateWorkflow}
                  isLoading={isGeneratingWorkflow}
                  hasGeneratedWorkflow={!!activeCase}
                />
              </div>
            )}

            {/* TAB 2: Application Review */}
            {activeCase?.application && activeTab === "application" && (
              <div className="space-y-6">
                <ApplicationReviewCard
                  application={activeCase.application}
                  onSaveEdits={handleSaveApplicationEdits}
                  onProceedToApproval={() => setShowApprovalModal(true)}
                  isSubmitted={activeCase.status === "submitted" || activeCase.status === "under_review" || activeCase.status === "additional_information_required"}
                />

                {showApprovalModal && (
                  <ApprovalPrompt
                    caseId={activeCase.case_id}
                    targetAuthority={activeCase.application.to}
                    onApprove={handleApproveAndSubmit}
                    onCancel={() => setShowApprovalModal(false)}
                    isLoading={isSubmitting}
                  />
                )}
              </div>
            )}

            {/* TAB 3: Multi-Agent Timeline */}
            {activeCase && activeTab === "timeline" && (
              <div className="space-y-6">
                <CaseActivityTimeline
                  timeline={activeCase.timeline}
                  caseId={activeCase.case_id}
                  caseStatus={activeCase.status}
                />
              </div>
            )}

            {/* TAB 4: Extracted Notice Summary */}
            {(!activeCase || activeTab === "notice") && (
              <NoticeSummaryCard
                filename={uploadResult.filename}
                noticeData={uploadResult.notice_data}
                metadata={uploadResult.metadata}
                onReset={handleReset}
              />
            )}
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
              Try a Sample Civic Notice (1-Click End-to-End Pipeline)
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

      {/* 5-Agent Architecture Footer Summary */}
      <div className="border-t border-slate-200/80 pt-8 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">CivicOps Autonomous 5-Agent Architecture</h3>
          <p className="text-xs text-slate-500">Autonomous preparation with human-in-the-loop governance and continuous monitoring</p>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1 shadow-2xs">
            <div className="h-6 w-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-900">Document Agent</h4>
            <p className="text-[11px] text-slate-500">Cloud Storage upload & structured notice metadata indexing.</p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1 shadow-2xs">
            <div className="h-6 w-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-900">Research Agent</h4>
            <p className="text-[11px] text-slate-500">Grounds procedures, statutory codes, & fees on official portals.</p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1 shadow-2xs">
            <div className="h-6 w-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-900">Workflow Agent</h4>
            <p className="text-[11px] text-slate-500">Diffs citizen documents & builds Firestore action plan.</p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1 shadow-2xs">
            <div className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h4 className="text-xs font-bold text-slate-900">Action + Approval</h4>
            <p className="text-[11px] text-slate-500">Drafts formal petition with server-enforced human authorization.</p>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1 shadow-2xs">
            <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              5
            </div>
            <h4 className="text-xs font-bold text-slate-900">Monitoring Agent</h4>
            <p className="text-[11px] text-slate-500">Async Cloud Tasks polling, change detection, & adaptive tasks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
