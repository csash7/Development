'use client';

import { Header } from '@/components/header';
import { MermaidDiagram } from '@/components/mermaid-diagram';
import { Network, BrainCircuit, Eye, Database, Upload, Camera, Shield } from 'lucide-react';

export default function AgentsPage() {

    const chart = `
    graph TD
    classDef gpt fill:#1e40af,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef gemini fill:#059669,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef data fill:#0d1117,stroke:#30363d,stroke-width:1px,color:#8b949e,stroke-dasharray: 5 5;
    classDef output fill:#0f3d2e,stroke:#2ea043,stroke-width:2px,color:#fff;
    classDef input fill:#1a1a2e,stroke:#f59e0b,stroke-width:2px,color:#fff;

    Upload["Image Upload"]:::input --> ImageBytes["Image Bytes"]:::data
    
    subgraph "Stage 1: Extraction"
        ImageBytes --> GPT1["GPT-5.2 Vision OCR"]:::gpt
        GPT1 -->|"Initial JSON"| Extract["Extracted Data"]:::data
    end
    
    subgraph "Stage 2: Verification"
        Extract --> Gemini["Gemini 2.0 Flash"]:::gemini
        ImageBytes -.->|"Cross-reference"| Gemini
        Gemini -->|"Validate & Enhance"| Verified["Verified Data"]:::data
    end
    
    subgraph "Stage 3: Audit"
        Verified --> GPT2["GPT-5.2 Audit Agent"]:::gpt
        Roster["Digital Roster - GPS"]:::data --> GPT2
        GPT2 -->|"Forensic Analysis"| Report["Discrepancy Reports"]:::output
    end
    
    Report --> Table["Dynamic Accordion Table"]:::output
    
    click GPT1 call toast("Extracts text from handwritten logbook using vision")
    click Gemini call toast("Validates extraction and fills missing fields")
    click GPT2 call toast("Compares paper logs vs GPS data to detect fraud")
  `;

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Header />

            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col gap-8">

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
                            <BrainCircuit className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Compound AI System Architecture</h2>
                            <p className="text-text-muted">3-Stage Multi-Model Pipeline: GPT-5.2 + Gemini 2.0 + GPT-5.2</p>
                        </div>
                    </div>

                    {/* Diagram */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-20 pointer-events-none" />
                        <MermaidDiagram chart={chart} />
                    </div>

                    {/* Explainer Cards - Now 4 stages */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-8">
                        <div className="p-5 rounded-xl border border-white/10 bg-surface/30 hover:border-amber-500/50 transition-colors">
                            <Camera className="w-5 h-5 text-amber-400 mb-3" />
                            <h3 className="text-base font-bold text-white mb-2">0. Upload</h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                User uploads a photo of the paper logbook. Image bytes are sent to the backend.
                            </p>
                        </div>

                        <div className="p-5 rounded-xl border border-white/10 bg-surface/30 hover:border-blue-500/50 transition-colors">
                            <Eye className="w-5 h-5 text-blue-400 mb-3" />
                            <h3 className="text-base font-bold text-white mb-2">1. GPT-5.2 Extract</h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                <strong>Initial OCR</strong>: GPT-5.2 reads the image and extracts worker data into structured JSON.
                            </p>
                        </div>

                        <div className="p-5 rounded-xl border border-white/10 bg-surface/30 hover:border-emerald-500/50 transition-colors">
                            <Shield className="w-5 h-5 text-emerald-400 mb-3" />
                            <h3 className="text-base font-bold text-white mb-2">2. Gemini Verify</h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                <strong>Cross-validation</strong>: Gemini 2.0 Flash reviews the image again to fill missing fields and correct errors.
                            </p>
                        </div>

                        <div className="p-5 rounded-xl border border-white/10 bg-surface/30 hover:border-purple-500/50 transition-colors">
                            <BrainCircuit className="w-5 h-5 text-purple-400 mb-3" />
                            <h3 className="text-base font-bold text-white mb-2">3. GPT-5.2 Audit</h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                <strong>Forensic analysis</strong>: Compares verified paper logs against GPS database to detect Ghost Shifts and Time Theft.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
