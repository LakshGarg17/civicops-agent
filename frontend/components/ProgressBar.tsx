"use client";

import React, { useEffect, useState } from "react";
import { Loader2, FileText, Cpu, Sparkles } from "lucide-react";

interface ProgressBarProps {
  filename: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ filename }) => {
  const [progress, setProgress] = useState(25);
  const [stage, setStage] = useState("Ingesting document...");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(55);
      setStage("Extracting text and parsing civic references...");
    }, 800);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setStage("Consulting Gemini 2.0 to translate requirements...");
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-sm">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-civic-50 text-civic-600 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-civic-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg font-semibold text-slate-900">
            Processing your document...
          </h3>
          <p className="text-sm font-medium text-civic-700">
            {stage}
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate max-w-[240px]">{filename}</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full max-w-md bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-civic-500 to-civic-600 h-2.5 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 w-full max-w-md pt-2 text-xs text-slate-400">
          <span className={progress >= 25 ? "text-civic-700 font-medium" : ""}>1. Ingest</span>
          <span className={progress >= 55 ? "text-civic-700 font-medium" : ""}>2. Parse</span>
          <span className={progress >= 85 ? "text-civic-700 font-medium" : ""}>3. Gemini AI</span>
        </div>
      </div>
    </div>
  );
};
