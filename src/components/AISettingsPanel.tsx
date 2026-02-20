'use client';

import { useState, useEffect } from 'react';
import {
    getOpenAIKey,
    getGoogleAIKey,
    saveOpenAIKey,
    saveGoogleAIKey,
    getGeminiModel,
    saveGeminiModel,
    GeminiModel
} from '@/services/aiConfig';
import { testOpenAIConnection } from '@/services/openaiService';
import { testGeminiConnection } from '@/services/geminiService';

interface AISettingsPanelProps {
    onBack: () => void;
}

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

export default function AISettingsPanel({ onBack }: AISettingsPanelProps) {
    const [openAIKey, setOpenAIKey] = useState(() => getOpenAIKey() || '');
    const [googleAIKey, setGoogleAIKey] = useState(() => getGoogleAIKey() || '');
    const [openAIStatus, setOpenAIStatus] = useState<ConnectionStatus>('idle');
    const [googleAIStatus, setGoogleAIStatus] = useState<ConnectionStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [showOpenAIKey, setShowOpenAIKey] = useState(false);
    const [showGoogleAIKey, setShowGoogleAIKey] = useState(false);
    const [geminiModel, setGeminiModel] = useState<GeminiModel>(() => getGeminiModel());

    // Connection testing is handled via user action, no mount effect needed for keys anymore
    useEffect(() => {
        // Any other side effects on mount if needed
    }, []);

    const handleSaveOpenAI = async () => {
        if (!openAIKey.trim()) return;
        saveOpenAIKey(openAIKey.trim());
        setOpenAIStatus('testing');
        setStatusMessage('Testing OpenAI connection...');

        const result = await testOpenAIConnection();
        setOpenAIStatus(result.success ? 'success' : 'error');
        setStatusMessage(result.message);
    };

    const handleSaveGoogleAI = async () => {
        if (!googleAIKey.trim()) return;
        saveGoogleAIKey(googleAIKey.trim());
        saveGeminiModel(geminiModel);
        setGoogleAIStatus('testing');
        setStatusMessage('Testing Gemini connection...');

        const result = await testGeminiConnection();
        setGoogleAIStatus(result.success ? 'success' : 'error');
        setStatusMessage(result.message);
    };

    const getStatusIcon = (status: ConnectionStatus) => {
        switch (status) {
            case 'testing': return 'sync';
            case 'success': return 'check_circle';
            case 'error': return 'error';
            default: return 'radio_button_unchecked';
        }
    };

    const getStatusColor = (status: ConnectionStatus) => {
        switch (status) {
            case 'testing': return 'text-yellow-400 animate-spin';
            case 'success': return 'text-emerald-500';
            case 'error': return 'text-red-500';
            default: return 'text-white/40';
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                </button>
                <h2 className="text-white text-xl font-bold">AI Configuration</h2>
            </div>

            <div className="space-y-6 overflow-auto">
                {/* OpenAI Section */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '20px' }}>auto_awesome</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-semibold">OpenAI</h3>
                            <p className="text-white/50 text-xs">Strategic angle generation</p>
                        </div>
                        <span className={`material-symbols-outlined ${getStatusColor(openAIStatus)}`} style={{ fontSize: '20px' }}>
                            {getStatusIcon(openAIStatus)}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type={showOpenAIKey ? 'text' : 'password'}
                                value={openAIKey}
                                onChange={(e) => setOpenAIKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50"
                            />
                            <button
                                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                    {showOpenAIKey ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        <button
                            onClick={handleSaveOpenAI}
                            disabled={!openAIKey.trim() || openAIStatus === 'testing'}
                            className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {openAIStatus === 'testing' ? 'Testing...' : 'Save & Test Connection'}
                        </button>
                    </div>
                    <p className="text-white/30 text-xs mt-3">
                        Get your API key at{' '}
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            platform.openai.com
                        </a>
                    </p>
                </div>

                {/* Google AI Section */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500" style={{ fontSize: '20px' }}>image</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-semibold">Google AI (Gemini)</h3>
                            <p className="text-white/50 text-xs">Image & content generation</p>
                        </div>
                        <span className={`material-symbols-outlined ${getStatusColor(googleAIStatus)}`} style={{ fontSize: '20px' }}>
                            {getStatusIcon(googleAIStatus)}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type={showGoogleAIKey ? 'text' : 'password'}
                                value={googleAIKey}
                                onChange={(e) => setGoogleAIKey(e.target.value)}
                                placeholder="AIza..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50"
                            />
                            <button
                                onClick={() => setShowGoogleAIKey(!showGoogleAIKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                    {showGoogleAIKey ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-white/50 text-xs ml-1">Generation Model</label>
                            <select
                                value={geminiModel}
                                onChange={(e) => setGeminiModel(e.target.value as GeminiModel)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 [&>option]:bg-zinc-900"
                            >
                                <option value="gemini-2.5-flash-image">Gemini 2.5 Flash (Free Tier)</option>
                                <option value="gemini-3-pro-image-preview">Gemini 3 Pro (Paid Tier)</option>
                            </select>
                        </div>

                        <button
                            onClick={handleSaveGoogleAI}
                            disabled={!googleAIKey.trim() || googleAIStatus === 'testing'}
                            className="w-full bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl py-2.5 text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {googleAIStatus === 'testing' ? 'Testing...' : 'Save & Test Connection'}
                        </button>
                    </div>
                    <p className="text-white/30 text-xs mt-3">
                        Get your API key at{' '}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            aistudio.google.com
                        </a>
                    </p>
                </div>

                {/* Status Message */}
                {statusMessage && (
                    <div className={`text-sm text-center py-2 ${openAIStatus === 'success' || googleAIStatus === 'success'
                        ? 'text-emerald-400'
                        : openAIStatus === 'error' || googleAIStatus === 'error'
                            ? 'text-red-400'
                            : 'text-white/60'
                        }`}>
                        {statusMessage}
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>info</span>
                        <div>
                            <h4 className="text-white font-medium mb-1">How it works</h4>
                            <p className="text-white/60 text-sm">
                                OpenAI generates strategic angles from your raw thoughts.
                                Gemini creates visual content and social media copy.
                                Both services fall back to demo mode if keys are not configured.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
