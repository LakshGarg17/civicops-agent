"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, AlertCircle, Sparkles } from "lucide-react";

interface UploadCardProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const UploadCard: React.FC<UploadCardProps> = ({ onFileSelected, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSelectFile = (file: File) => {
    setErrorMsg(null);
    const validExtensions = [".txt", ".pdf"];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMsg("Please upload a .txt or .pdf government notice.");
      return;
    }

    if (file.size === 0) {
      setErrorMsg("The selected file is empty.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds 10MB limit.");
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 bg-white/80 shadow-sm ${
          isDragging
            ? "border-civic-500 bg-civic-50/50 scale-[1.01]"
            : "border-slate-300 hover:border-civic-400 hover:bg-slate-50/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-civic-50 text-civic-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-civic-100 transition-transform">
            <UploadCloud className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-slate-900">
              Upload Notice or Paperwork
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Drag and drop your document here, or click to browse files from your device.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={disabled}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-civic-600 hover:bg-civic-700 active:scale-95 shadow-sm shadow-civic-200 transition-all"
            >
              <FileText className="w-4 h-4" />
              Upload Notice
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
            <span>Supports .TXT and .PDF</span>
            <span>•</span>
            <span>Max 10 MB</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-center gap-2 p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
