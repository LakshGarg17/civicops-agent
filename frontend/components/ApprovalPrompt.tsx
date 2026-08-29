"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Send, 
  X, 
  Sparkles,
  Info,
  HelpCircle,
  Cpu
} from "lucide-react";

interface ApprovalPromptProps {
  caseId: string;
  targetAuthority: string;
  onApprove: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ApprovalPrompt: React.FC<ApprovalPromptProps> = ({
  caseId,
  targetAuthority,
  onApprove,
  onCancel,
  isLoading = false
}) => {
  const [operatorName, setOperatorName] = useState("Citizen / Property Owner");

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-7 relative overflow-hidden">
      {/* Decorative background security glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-civic-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 border border-amber-400/40">
                Human-in-the-Loop Security Gate
              </span>
              <span className="text-xs font-mono text-slate-400">{caseId}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
              Authorization Required For Consequential Action
            </h3>
          </div>
        </div>

        <span className="hidden sm:inline-flex text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Server-Enforced Gate
        </span>
      </div>

      {/* Action Summary & Risk Assessment */}
      <div className="space-y-4 relative z-10 text-xs">
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-civic-400" />
            CivicOps Autonomous Pipeline Has Prepared:
          </h4>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Structured formal administrative petition & dispute letter</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Attached and verified all available supporting documents</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Built verifiable submission manifest package</span>
            </li>
          </ul>
        </div>

        {/* The Action Requiring Explicit Approval */}
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-300 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>Action Awaiting Your Approval:</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-white text-sm">Submit Application Package</p>
              <p className="text-slate-400 mt-0.5">Target Destination: {targetAuthority}</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
              Consequential Step
            </span>
          </div>

          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            By approving, you authorize CivicOps to transmit your dispute package to the Demo Gateway. The server will cryptographically record your authorization.
          </p>
        </div>

        {/* Sandbox Disclaimer */}
        <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-start gap-2.5 text-[11px] text-blue-200">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-blue-300">Demo Gateway Simulation:</span> Submissions are securely executed in a sandbox demo environment with simulated confirmation receipts. No real government databases are altered.
          </div>
        </div>
      </div>

      {/* Operator Signature & Action Buttons */}
      <div className="space-y-4 pt-2 border-t border-slate-800 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <label className="text-slate-400 font-semibold">Authorizing Operator Name:</label>
          <input
            type="text"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs w-full sm:w-64"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition-colors"
          >
            Cancel / Edit Application
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
            <span>{isLoading ? "Submitting to Demo Gateway..." : "Approve & Execute Submission (Demo)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
