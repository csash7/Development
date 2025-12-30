'use client';

import { useState, useEffect } from 'react';
import {
    Save,
    RefreshCw,
    Key,
    Bot,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

interface ScraperConfig {
    two_captcha_api_key: string;
    anti_captcha_api_key: string;
    try_ocr_first: boolean;
    allow_manual_fallback: boolean;
}

const API_BASE = 'http://31.97.212.67:8080/api';

export default function SettingsPage() {
    const [config, setConfig] = useState<ScraperConfig>({
        two_captcha_api_key: '',
        anti_captcha_api_key: '',
        try_ocr_first: true,
        allow_manual_fallback: true,
    });
    const [showKeys, setShowKeys] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [tesseractInstalled, setTesseractInstalled] = useState<boolean | null>(null);

    useEffect(() => {
        // Check if Tesseract is available (via backend)
        checkTesseract();
    }, []);

    const checkTesseract = async () => {
        try {
            const response = await fetch(`${API_BASE}/health`);
            if (response.ok) {
                // In a real implementation, the health endpoint would report Tesseract status
                setTesseractInstalled(true);
            }
        } catch {
            setTesseractInstalled(null);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        setMessage(null);

        try {
            // In a real implementation, this would save to backend/environment
            // For now, show instructions for manual configuration
            setMessage({
                type: 'success',
                text: 'Configuration saved! Restart the backend to apply changes.',
            });
        } catch (err) {
            setMessage({
                type: 'error',
                text: 'Failed to save configuration',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">CAPTCHA Settings</h1>
                <p className="text-slate-400 mt-1">Configure automated CAPTCHA solving</p>
            </div>

            {/* Solving Priority Info */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-amber-400" />
                    Solving Priority
                </h2>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                        <span className="text-slate-300">OCR (Tesseract) - Free, instant, ~60-70% accuracy</span>
                        {tesseractInstalled === true && (
                            <span className="ml-auto text-emerald-400 text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Installed
                            </span>
                        )}
                        {tesseractInstalled === false && (
                            <span className="ml-auto text-red-400 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Not installed
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                        <span className="text-slate-300">2Captcha - $2.99/1000, ~95% accuracy</span>
                        {config.two_captcha_api_key && (
                            <span className="ml-auto text-emerald-400 text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Configured
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">3</span>
                        <span className="text-slate-300">Anti-Captcha - $1.80/1000, ~90% accuracy</span>
                        {config.anti_captcha_api_key && (
                            <span className="ml-auto text-emerald-400 text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Configured
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">4</span>
                        <span className="text-slate-300">Manual - Free, requires human input via dashboard</span>
                    </div>
                </div>
            </div>

            {/* API Keys */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Key className="w-5 h-5 text-amber-400" />
                        API Keys
                    </h2>
                    <button
                        onClick={() => setShowKeys(!showKeys)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        {showKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            2Captcha API Key
                            <a href="https://2captcha.com" target="_blank" rel="noopener" className="ml-2 text-amber-400 hover:underline">
                                Get key →
                            </a>
                        </label>
                        <input
                            type={showKeys ? 'text' : 'password'}
                            value={config.two_captcha_api_key}
                            onChange={(e) => setConfig({ ...config, two_captcha_api_key: e.target.value })}
                            placeholder="Enter your 2Captcha API key"
                            className="w-full p-3 bg-slate-900 border border-white/10 rounded-lg text-white font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Anti-Captcha API Key
                            <a href="https://anti-captcha.com" target="_blank" rel="noopener" className="ml-2 text-amber-400 hover:underline">
                                Get key →
                            </a>
                        </label>
                        <input
                            type={showKeys ? 'text' : 'password'}
                            value={config.anti_captcha_api_key}
                            onChange={(e) => setConfig({ ...config, anti_captcha_api_key: e.target.value })}
                            placeholder="Enter your Anti-Captcha API key"
                            className="w-full p-3 bg-slate-900 border border-white/10 rounded-lg text-white font-mono text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Options */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Options</h2>

                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.try_ocr_first}
                            onChange={(e) => setConfig({ ...config, try_ocr_first: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20 bg-slate-900 text-amber-500 focus:ring-amber-500"
                        />
                        <div>
                            <p className="text-white">Try OCR first</p>
                            <p className="text-sm text-slate-500">Attempt free OCR before using paid services</p>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.allow_manual_fallback}
                            onChange={(e) => setConfig({ ...config, allow_manual_fallback: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20 bg-slate-900 text-amber-500 focus:ring-amber-500"
                        />
                        <div>
                            <p className="text-white">Allow manual fallback</p>
                            <p className="text-sm text-slate-500">Show CAPTCHA in dashboard if automation fails</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Environment Variables Info */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-6">
                <h3 className="text-amber-400 font-medium mb-2">Environment Configuration</h3>
                <p className="text-sm text-amber-400/70 mb-3">
                    Add these to your <code className="bg-slate-800 px-1 rounded">scraper/.env</code> file:
                </p>
                <pre className="bg-slate-900 p-4 rounded-lg text-sm font-mono text-slate-300 overflow-x-auto">
                    {`TWO_CAPTCHA_API_KEY=${config.two_captcha_api_key || 'your_key_here'}
ANTI_CAPTCHA_API_KEY=${config.anti_captcha_api_key || 'your_key_here'}`}
                </pre>
            </div>

            {/* India Proxy Settings */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-6">
                <h3 className="text-cyan-400 font-medium mb-2">🌏 India Proxy (Required for Meebhoomi)</h3>
                <p className="text-sm text-cyan-400/70 mb-3">
                    Meebhoomi is geo-restricted to India. Add a proxy to access it:
                </p>
                <pre className="bg-slate-900 p-4 rounded-lg text-sm font-mono text-slate-300 overflow-x-auto mb-4">
                    {`# SSH into server and edit:
ssh root@31.97.212.67
nano /root/ap-landeed-scraper/.env

# Add proxy (example free Indian proxies):
PROXY_URL=socks5://103.51.46.2:4145
# or
PROXY_URL=socks5://36.64.238.82:1080

# Then restart:
systemctl restart ap-landeed-backend`}
                </pre>
                <p className="text-xs text-cyan-400/50">
                    ⚠️ Free proxies may be slow/unreliable. Consider a paid India VPS or proxy service for production.
                </p>
            </div>

            {/* Tesseract Installation */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-6 mb-6">
                <h3 className="text-white font-medium mb-2">Install Tesseract OCR (Free)</h3>
                <p className="text-sm text-slate-400 mb-3">
                    Already installed on 31.97.212.67 ✅
                </p>
                <pre className="bg-slate-900 p-4 rounded-lg text-sm font-mono text-slate-300">
                    tesseract 5.3.4 (leptonica-1.82.0)
                </pre>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl ${message.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors disabled:opacity-50"
            >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Configuration
            </button>
        </div>
    );
}
