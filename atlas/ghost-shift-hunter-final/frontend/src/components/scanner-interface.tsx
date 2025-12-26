'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText } from 'lucide-react';

interface ScannerProps {
    onScanComplete: () => void;
    onStateChange?: (file: File) => void;
    isScanning: boolean;
    previewUrl?: string | null;
}

export function ScannerInterface({ onScanComplete, onStateChange, isScanning, previewUrl }: ScannerProps) {
    const [fileUploaded, setFileUploaded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileUploaded(true);
            // Call the parent to set the preview URL
            if (onStateChange) {
                onStateChange(file);
            }
            // Simulate processing delay after file selection
            setTimeout(onScanComplete, 800);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-xl bg-surface/50 relative overflow-hidden">

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf"
            />

            {/* PREVIEW LAYER - Shows the uploaded image with hover overlay */}
            {previewUrl && !isScanning && (
                <div
                    className="absolute inset-0 z-0 bg-black flex items-center justify-center cursor-pointer group"
                    onClick={triggerFileInput}
                >
                    <img
                        src={previewUrl}
                        alt="Uploaded Document Preview"
                        className="w-full h-full object-contain opacity-80 group-hover:opacity-40 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors" />

                    {/* Hover overlay for re-upload */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 mb-3">
                            <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-white">Upload New Image</p>
                        <p className="text-xs text-text-muted mt-1">Click to replace</p>
                    </div>
                </div>
            )}

            {/* Upload Button - Only show when no file uploaded and not scanning */}
            {!fileUploaded && !isScanning && !previewUrl && (
                <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
                    <div
                        onClick={triggerFileInput}
                        className="group cursor-pointer flex flex-col items-center gap-4 transition-all hover:scale-105 p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                            <Upload className="w-6 h-6 text-white/50 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-bold text-white">Upload Physical Manifest</h3>
                            <p className="text-xs text-text-muted">Click to Browse</p>
                        </div>
                    </div>

                    <a
                        href="/sample-manifest.png"
                        download="traba_daily_log_sample.png"
                        className="flex items-center justify-center gap-2 p-3 rounded-lg border border-white/10 bg-surface hover:bg-white/5 transition-colors text-xs text-text-muted hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FileText className="w-3 h-3" />
                        Download Sample Log
                    </a>
                </div>
            )}

            {/* Scanning Indicator - Shows spinner overlay on top of preview */}
            {isScanning && (
                <div className="flex flex-col items-center gap-6 relative z-10 bg-black/60 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-16 h-16 rounded-full border-2 border-t-primary border-r-transparent border-b-primary border-l-transparent"
                    />
                    <div className="text-center">
                        <h3 className="text-lg font-mono text-primary animate-pulse">ANALYZING DOCUMENT...</h3>
                        <p className="text-xs font-mono text-text-muted mt-2">OCR EXTRACTION • AUDIT AGENT</p>
                    </div>
                </div>
            )}

            {/* Scan Line Effect */}
            {isScanning && (
                <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="scan-line" />
                </div>
            )}
        </div>
    );
}
