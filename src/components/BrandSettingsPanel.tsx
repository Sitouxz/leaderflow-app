'use client';

import { useState, useEffect } from 'react';
import { BrandProfileData } from '@/services/brandService';
import { getBrandProfileAction, saveBrandProfileAction } from '@/actions/brandActions';

interface BrandSettingsPanelProps {
    onBack: () => void;
}

export default function BrandSettingsPanel({ onBack }: BrandSettingsPanelProps) {
    const [formData, setFormData] = useState<BrandProfileData>({
        companyName: '',
        industry: '',
        targetAudience: '',
        toneOfVoice: 'Professional',
        keywords: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        const result = await getBrandProfileAction();
        if (result.success && result.data) {
            // @ts-ignore - Prisma return type includes id/dates, but we just need the data fields
            setFormData(result.data);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');

        const result = await saveBrandProfileAction(formData);

        if (result.success) {
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } else {
            setMessage('Failed to save settings.');
        }
        setIsSaving(false);
    };

    const handleChange = (field: keyof BrandProfileData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const tones = ['Professional', 'Casual', 'Witty', 'Authoritative', 'Empathetic', 'Inspirational', 'Custom'];

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
                <h2 className="text-white text-xl font-bold">Brand Context</h2>
            </div>

            <div className="space-y-6 overflow-auto pr-2">
                {/* Intro Card */}
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-indigo-400" style={{ fontSize: '24px' }}>psychology</span>
                        <div>
                            <h4 className="text-white font-medium mb-1">Personalize your AI</h4>
                            <p className="text-white/60 text-sm">
                                These details will be injected into the AI's "brain".
                                It will generate ideas and content that sound like you.
                            </p>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-white/40">Loading settings...</div>
                ) : (
                    <div className="space-y-4">
                        {/* Company / Name */}
                        <div>
                            <label className="block text-white/50 text-xs mb-1 ml-1">Company / Personal Brand Name</label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                placeholder="e.g. Acme Corp OR Jane Doe"
                                className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="block text-white/50 text-xs mb-1 ml-1">Industry / Niche</label>
                            <input
                                type="text"
                                value={formData.industry}
                                onChange={(e) => handleChange('industry', e.target.value)}
                                placeholder="e.g. SaaS, Health & Wellness, Fintech"
                                className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Target Audience */}
                        <div>
                            <label className="block text-white/50 text-xs mb-1 ml-1">Target Audience</label>
                            <textarea
                                value={formData.targetAudience}
                                onChange={(e) => handleChange('targetAudience', e.target.value)}
                                placeholder="Who are you talking to? e.g. 'Startup founders looking to scale' or 'Busy moms'"
                                className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50 min-h-[80px]"
                            />
                        </div>

                        {/* Tone of Voice */}
                        <div>
                            <label className="block text-white/50 text-xs mb-1 ml-1">Tone of Voice</label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {tones.map(tone => (
                                    <button
                                        key={tone}
                                        onClick={() => handleChange('toneOfVoice', tone === 'Custom' ? '' : tone)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${(tone === 'Custom' && !tones.includes(formData.toneOfVoice)) || formData.toneOfVoice === tone
                                                ? 'bg-primary/20 border-primary text-white'
                                                : 'bg-surface-dark border-white/5 text-white/60 hover:bg-white/5'
                                            }`}
                                    >
                                        {tone}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={formData.toneOfVoice}
                                onChange={(e) => handleChange('toneOfVoice', e.target.value)}
                                placeholder="Custom tone..."
                                className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Keywords */}
                        <div>
                            <label className="block text-white/50 text-xs mb-1 ml-1">Core Keywords / Topics (Comma separated)</label>
                            <input
                                type="text"
                                value={formData.keywords}
                                onChange={(e) => handleChange('keywords', e.target.value)}
                                placeholder="e.g. productivity, growth, AI, mental health"
                                className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Save Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-primary text-white rounded-xl py-3 font-semibold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </button>
                            {message && (
                                <p className={`text-center text-sm mt-3 ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
