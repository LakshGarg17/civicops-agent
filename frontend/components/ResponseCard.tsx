"use client";

import React, { useState } from "react";
import { CheckCircle2, FileText, ArrowLeft, Copy, Check, Eye, EyeOff, Sparkles } from "lucide-react";

interface ResponseCardProps {
  filename: string;
  extractedText: string;
  aiResponse: string;
  metadata?: {
    file_size_bytes?: number;
    char_count?: number;
    content_type?: string;
  };
  onReset: () => void;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({
  filename,
  extractedText,
  aiResponse,
  metadata,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic markdown formatting helper for bolding and bullets
  const renderFormattedAIResponse = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Header 1/2/3
      if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
        const cleanTitle = trimmed.replace(/^#+\s*/, "");
        return (
          <h4 key={idx} className="text-base font-bold text-slate-900 mt-4 mb-2 first:mt-0 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-civic-500 inline-block"></span>
            {cleanTitle}
          </h4>
        );
      }
      
      // Bullet list item
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const bulletText = trimmed.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 text-sm leading-relaxed mb-1.5 marker:text-civic-500">
            {formatBoldSegments(bulletText)}
          </li>
        );
      }

      // Numbered list item
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+\.)\s*(.*)$/);
        if (match) {
          return (
            <div key={idx} className="flex gap-2 text-slate-700 text-sm leading-relaxed mb-2 ml-1">
              <span className="font-semibold text-civic-700 flex-shrink-0">{match[1]}</span>
              <span>{formatBoldSegments(match[2])}</span>
            </div>
          );
        }
      }

      // Empty line spacer
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Standard paragraph
      return (
        <p key={idx} className="text-slate-700 text-sm leading-relaxed mb-2">
          {formatBoldSegments(line)}
        </p>
      );
    });
  };

  const formatBoldSegments = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-civic-50 to-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Analysis Complete</h3>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Gemini 2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-medium text-slate-700">{filename}</span>
              {metadata?.char_count && (
                <span>• {metadata.char_count.toLocaleString()} characters extracted</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Guidance"}
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-civic-700 bg-civic-50 border border-civic-200 rounded-lg hover:bg-civic-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Analyze Another
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200/60 pb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-civic-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-civic-600" />
              Plain-Language Guidance & Action Plan
            </h4>
          </div>
          <div className="space-y-1">
            {renderFormattedAIResponse(aiResponse)}
          </div>
        </div>

        {/* Toggle Extracted Raw Text */}
        <div className="border-t border-slate-200/80 pt-4">
          <button
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {showRawText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showRawText ? "Hide Extracted Notice Text" : "View Extracted Raw Notice Text"}
          </button>

          {showRawText && (
            <div className="mt-3 p-4 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
              <pre className="whitespace-pre-wrap font-mono">{extractedText}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
