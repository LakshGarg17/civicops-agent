"use client";

import React, { useState } from "react";
import { 
  Sliders, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Send, 
  Sparkles,
  Zap,
  Activity
} from "lucide-react";

interface DemoStatusControllerProps {
  caseId: string;
  currentStatus: string;
  onStatusChanged: (newStatus: string) => void;
  onTriggerMonitoring: () => Promise<void>;
  isLoading?: boolean;
}

export const DemoStatusController: React.FC<DemoStatusControllerProps> = ({
  caseId,
  currentStatus,
  onStatusChanged,
  onTriggerMonitoring,
  isLoading = false
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleFlipStatus = async (targetStatus: string, message?: string) => {
    setIsFlipping(true);
    try {
      const res = await fetch(`${API_URL}/cases/${caseId}/demo-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          message: message || `Authority determination changed to: ${targetStatus.replace(/_/g, " ")}`,
          source: "Travis County Appraisal Review Board Portal"
        })
      });

      if (res.ok) {
        onStatusChanged(targetStatus);
      }
    } catch (err) {
      console.error("Failed to set demo status:", err);
    } finally {
      setIsFlipping(false);
    }
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-xl p-6 space-y-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Demo Agency Portal Controller (Sandbox)
            </h4>
            <p className="text-[11px] text-slate-400">
              Simulate real-time government agency determinations to test autonomous monitoring
            </p>
          </div>
        </div>

        <button
          onClick={onTriggerMonitoring}
          disabled={isLoading || isFlipping}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-civic-600 hover:bg-civic-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Trigger Monitoring Check</span>
        </button>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Flip Case Determination State:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => handleFlipStatus("under_review", "Application is actively under review by municipal panel.")}
            disabled={isFlipping || isLoading}
            className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
              currentStatus === "under_review"
                ? "bg-amber-950/80 border-amber-500 text-amber-200"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Under Review</span>
              {currentStatus === "under_review" && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Initial intake state</p>
          </button>

          <button
            onClick={() => handleFlipStatus("additional_information_required", "Official notice: Additional ownership documentation (Recorded Deed or Title Certificate) is required.")}
            disabled={isFlipping || isLoading}
            className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
              currentStatus === "additional_information_required"
                ? "bg-rose-950/80 border-rose-500 text-rose-200 shadow-md shadow-rose-950/50"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-rose-300">⚠ Info Required</span>
              {currentStatus === "additional_information_required" && <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Requests ownership deed</p>
          </button>

          <button
            onClick={() => handleFlipStatus("approved", "Property tax assessment dispute approved. Valuation reduced.")}
            disabled={isFlipping || isLoading}
            className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
              currentStatus === "approved"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>✓ Approved</span>
              {currentStatus === "approved" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Dispute granted</p>
          </button>

          <button
            onClick={() => handleFlipStatus("rejected", "Dispute claim denied by reviewing board. Appeal window open.")}
            disabled={isFlipping || isLoading}
            className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
              currentStatus === "rejected"
                ? "bg-red-950/80 border-red-500 text-red-200"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Rejected</span>
              {currentStatus === "rejected" && <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Claim denied</p>
          </button>
        </div>
      </div>
    </div>
  );
};
