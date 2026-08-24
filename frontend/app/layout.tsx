import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicOps — AI Civic Paperwork Assistant",
  description: "Transform complex government notices, tax bills, and citations into clear, actionable guidance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-civic-100 selection:text-civic-900">
        <div className="min-h-screen flex flex-col justify-between">
          <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-civic-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-civic-200">
                  🏛️
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight text-slate-900">CivicOps</span>
                  <span className="hidden sm:inline-block ml-2 text-xs font-semibold uppercase tracking-wider bg-civic-50 text-civic-700 px-2 py-0.5 rounded border border-civic-200">
                    Day 1 Foundation
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Gemini Flash 2.0
                </span>
              </div>
            </div>
          </header>

          <main className="flex-grow">
            {children}
          </main>

          <footer className="border-t border-slate-200 bg-white/50 text-xs text-slate-500 py-6 text-center">
            <div className="max-w-6xl mx-auto px-4">
              <p>CivicOps — Autonomous Civic Paperwork & Workflow System • Built for Public Good</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
