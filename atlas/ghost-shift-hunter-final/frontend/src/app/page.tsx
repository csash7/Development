'use client';

import { useState, useRef, useEffect } from 'react';
import { ScannerInterface } from '@/components/scanner-interface';
import { AuditTable } from '@/components/audit-table';
import { AuditResponse } from '@/lib/types';
import { API_URL } from '@/lib/config';
import { Search, Play, RefreshCw, Upload, Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { StatusStream } from '@/components/status-stream';

export default function Home() {
  /* State */
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);

  // Store the actual file for upload
  const uploadedFileRef = useRef<File | null>(null);

  const handleFileChange = (file: File) => {
    // Create immediate blob URL for preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    uploadedFileRef.current = file;

    // Convert to base64 for persistence (skip if file is too large)
    if (file.size < 2 * 1024 * 1024) { // Only persist images < 2MB
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        try {
          localStorage.setItem('auditPreview', base64);
        } catch (e) {
          console.warn('Image too large to persist in localStorage');
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Clear old preview if new image is too large
      localStorage.removeItem('auditPreview');
    }
  };

  const addLog = (msg: string) => {
    setAgentLogs(prev => [...prev, msg]);
  };

  const runAudit = async () => {
    setAnalyzing(true);
    setResult(null);
    setAgentLogs([]);

    try {
      // --- STEP 1: GPT-5.2 EXTRACTION ---
      addLog("[STAGE 1] GPT-5.2 VISION EXTRACTION");
      addLog("Uploading image to GPT-5.2...");

      let perceiveData;

      if (uploadedFileRef.current) {
        const formData = new FormData();
        formData.append('file', uploadedFileRef.current);

        const perceiveRes = await fetch(`${API_URL}/api/perceive-image`, {
          method: 'POST',
          body: formData
        });

        // Check for rate limit error
        if (perceiveRes.status === 429) {
          const errorData = await perceiveRes.json();
          addLog("⚠️ RATE LIMIT EXCEEDED");
          addLog(errorData.detail || "Maximum 10 uploads per hour. Please try again later.");
          setAnalyzing(false);
          return;
        }

        if (!perceiveRes.ok) {
          const errorData = await perceiveRes.json();
          throw new Error(errorData.detail || 'Failed to process image');
        }

        perceiveData = await perceiveRes.json();

        addLog("GPT-5.2 extraction complete.");

        // --- STEP 2: GEMINI VERIFICATION ---
        if (perceiveData.gemini_verified) {
          addLog("[STAGE 2] GEMINI 2.0 VERIFICATION");
          addLog("Cross-validating extraction with Gemini...");
          addLog("Filling missing fields and correcting errors...");
        } else {
          addLog("[STAGE 2] GEMINI SKIPPED (No API Key)");
        }
      } else {
        addLog("NO IMAGE DETECTED. USING DEMO DATA...");
        const perceiveRes = await fetch(`${API_URL}/api/perceive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: 'ghost' })
        });
        perceiveData = await perceiveRes.json();
      }

      // Report findings
      const workerCount = perceiveData.cleaned_logs?.length || 0;
      const workerNames = perceiveData.cleaned_logs?.map((l: any) => l.standardized_name).join(", ") || "None";

      addLog(`EXTRACTION COMPLETE: ${workerCount} workers found`);
      addLog(`Workers: [${workerNames}]`);

      // --- STEP 3: GPT-5.2 AUDIT ---
      addLog("[STAGE 3] GPT-5.2 FORENSIC AUDIT");
      addLog("Cross-referencing with GPS database...");
      addLog("Analyzing time deltas and signatures...");

      const reasonRes = await fetch(`${API_URL}/api/reason`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shifts: perceiveData.shifts,
          cleaned_logs: perceiveData.cleaned_logs,
          audit_id: perceiveData.audit_id  // Pass audit_id to update history
        })
      });

      const reasonData = await reasonRes.json();

      const finalResult: AuditResponse = {
        shifts: perceiveData.shifts,
        logs: perceiveData.logs || [],
        reports: reasonData.reports,
        column_headers: perceiveData.column_headers || []
      };

      addLog("AUDIT COMPLETE. GENERATING REPORT...");

      setTimeout(() => {
        setResult(finalResult);
        setAnalyzing(false);
      }, 1000);

    } catch (e) {
      console.error("Audit failed", e);
      addLog("ERROR: AGENT CONNECTION FAILED.");
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header>
        <div className="text-xs font-mono text-primary">
          GPT-5.2 VISION • REAL OCR
        </div>
      </Header>

      {/* Content - Asymmetric layout: small image left, large table right */}
      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">

        {/* Left: Input / Scanner (Smaller) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold flex items-center gap-2">
              <Search className="w-4 h-4 opacity-50" />
              Input Source
            </h2>
          </div>

          <div className="h-[300px]">
            <ScannerInterface
              isScanning={analyzing}
              onScanComplete={runAudit}
              onStateChange={handleFileChange}
              previewUrl={previewUrl}
            />
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/5 text-[10px] text-text-muted font-mono leading-relaxed">
            <strong className="text-white">SYSTEM:</strong><br />
            • GPT-5.2 Vision OCR<br />
            • GPT-5.2 Audit Agent
          </div>
        </div>

        {/* Right: Results (Larger) */}
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold flex items-center gap-2">
              <Play className="w-4 h-4 opacity-50" />
              Audit Results
            </h2>
            {result && (
              <button onClick={runAudit} className="text-xs text-primary hover:text-primary-glow flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Re-Run
              </button>
            )}
          </div>

          {analyzing && (
            <StatusStream logs={agentLogs} />
          )}

          {!analyzing && !result && (
            <div className="space-y-4 md:space-y-6">
              {/* Welcome Section */}
              <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Welcome to Ghost Shift Hunter
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  AI-powered operations audit that compares physical worker logs against digital records
                  to detect discrepancies, ghost shifts, and compliance issues in real-time.
                </p>
              </div>

              {/* How to Start */}
              <div className="bg-surface border border-white/10 rounded-xl p-4 md:p-6">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  How to Get Started
                </h4>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
                    <div>
                      <span className="text-white font-medium">Upload a photo</span>
                      <p className="text-text-muted text-xs mt-0.5">Take a picture of your paper timesheet or worker logbook</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
                    <div>
                      <span className="text-white font-medium">AI extracts the data</span>
                      <p className="text-text-muted text-xs mt-0.5">GPT-5.2 Vision reads names, times, and roles from the image</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">3</span>
                    <div>
                      <span className="text-white font-medium">Get instant audit results</span>
                      <p className="text-text-muted text-xs mt-0.5">View flagged issues, ghost shifts, and compliance alerts</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface/50 border border-white/10 rounded-lg p-3 md:p-4">
                  <AlertTriangle className="w-5 h-5 text-alert-yellow mb-2" />
                  <h5 className="text-xs md:text-sm font-semibold text-white">Ghost Shift Detection</h5>
                  <p className="text-[10px] md:text-xs text-text-muted mt-1">Find workers clocked in digitally but absent from paper logs</p>
                </div>
                <div className="bg-surface/50 border border-white/10 rounded-lg p-3 md:p-4">
                  <Clock className="w-5 h-5 text-primary mb-2" />
                  <h5 className="text-xs md:text-sm font-semibold text-white">Time Discrepancies</h5>
                  <p className="text-[10px] md:text-xs text-text-muted mt-1">Spot differences between logged and scheduled hours</p>
                </div>
                <div className="bg-surface/50 border border-white/10 rounded-lg p-3 md:p-4">
                  <CheckCircle className="w-5 h-5 text-success-green mb-2" />
                  <h5 className="text-xs md:text-sm font-semibold text-white">Compliance Audit</h5>
                  <p className="text-[10px] md:text-xs text-text-muted mt-1">Ensure attendance records match across systems</p>
                </div>
                <div className="bg-surface/50 border border-white/10 rounded-lg p-3 md:p-4">
                  <Upload className="w-5 h-5 text-primary mb-2" />
                  <h5 className="text-xs md:text-sm font-semibold text-white">Photo Upload</h5>
                  <p className="text-[10px] md:text-xs text-text-muted mt-1">Works with handwritten or printed logbooks</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <AuditTable
              reports={result.reports}
              columnHeaders={result.column_headers || []}
            />
          )}

        </div>

      </main>
    </div>
  );
}
