"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, FileText, Sparkles, Circle } from "lucide-react";

interface ProgressBarProps {
  filename: string;
}

const STAGES = [
  { id: 1, label: "Uploading document", delay: 0 },
  { id: 2, label: "Reading document", delay: 800 },
  { id: 3, label: "Extracting information", delay: 1800 },
  { id: 4, label: "Identifying notice type", delay: 2800 },
  { id: 5, label: "Building notice summary", delay: 3800 },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ filename }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setActiveStep(2);
        setProgress(35);
      }, 700)
    );

    timers.push(
      setTimeout(() => {
        setActiveStep(3);
        setProgress(60);
      }, 1800)
    );

    timers.push(
      setTimeout(() => {
        setActiveStep(4);
        setProgress(82);
      }, 2800)
    );

    timers.push(
      setTimeout(() => {
        setActiveStep(5);
        setProgress(95);
      }, 3800)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-civic-50 text-civic-600 mb-2">
          <Loader2 className="h-7 w-7 animate-spin text-civic-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Document Intelligence Agent Processing
        </h3>
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-700 truncate max-w-xs">{filename}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mx-auto space-y-1.5">
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-civic-500 to-civic-700 h-2.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
          <span>Multimodal Ingestion</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* 5-Stage Checklist Card */}
      <div className="max-w-md mx-auto bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
          <span>Processing Pipeline</span>
          <span className="text-[11px] font-semibold text-civic-700">Stage {activeStep} of 5</span>
        </div>

        <div className="space-y-2.5">
          {STAGES.map((st) => {
            const isDone = activeStep > st.id;
            const isCurrent = activeStep === st.id;

            return (
              <div
                key={st.id}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-all ${
                  isCurrent
                    ? "bg-white border border-civic-300 shadow-2xs font-semibold text-civic-900"
                    : isDone
                    ? "bg-slate-100/70 text-slate-700"
                    : "text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-civic-600 animate-spin flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                  <span>{st.label}</span>
                </div>

                {isDone && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ✓
                  </span>
                )}
                {isCurrent && (
                  <span className="text-[10px] font-semibold text-civic-700 bg-civic-100 px-1.5 py-0.5 rounded animate-pulse">
                    In progress
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
