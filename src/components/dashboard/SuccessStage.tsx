'use client';

import { useState } from 'react';
import { PipelineItem, MEDIA_TYPE_CONFIG } from '@/types/pipeline';

interface SuccessStageProps {
    item: PipelineItem;
    onBack: () => void;
}

export default function SuccessStage({ item, onBack }: SuccessStageProps) {
    const [activeTab, setActiveTab] = useState<'preview' | 'caption' | 'seo'>('preview');

    const mediaType = item.selectedMediaType;
    const content = item.mediaContent;
    const config = mediaType ? MEDIA_TYPE_CONFIG[mediaType] : null;
    const isVideo = mediaType === 'video';

    if (!content) return null;

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <button onClick={onBack} className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                </button>
                <div className="flex-1">
                    <h2 className="text-white text-xl font-bold">Scheduled Post</h2>
                    <p className="text-emerald-400 text-xs mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                        Live tracking active
                    </p>
                </div>
            </div>

            {/* Scheduled Time Card */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '20px' }}>calendar_today</span>
                    </div>
                    <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Scheduled For</p>
                        <p className="text-white font-medium">
                            {item.socialPost ? formatDate(new Date(item.socialPost.scheduledTime)) : 'Pending'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-dark rounded-xl p-1 mb-4">
                {[
                    { id: 'preview', label: 'Preview', icon: 'image' },
                    { id: 'caption', label: 'Caption', icon: 'notes' },
                    { id: 'seo', label: 'SEO', icon: 'tag' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-black' : 'text-white/50 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto pr-1">
                {activeTab === 'preview' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl overflow-hidden bg-surface-dark ring-1 ring-white/5">
                            <img src={content.imageUrl} alt={config?.label} className="w-full aspect-video object-cover" />
                        </div>
                        {content.previewUrls && content.previewUrls.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto p-2 scrollbar-hide">
                                {content.previewUrls.map((url, i) => (
                                    <div key={i} className="shrink-0 w-16 h-16 rounded-xl overflow-hidden ring-1 ring-white/10 opacity-70">
                                        <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {isVideo && content.videoBrief && (
                            <div className="bg-surface-dark border border-yellow-400/20 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: '20px' }}>description</span>
                                    <span className="text-yellow-400 font-medium text-sm">Video Production Brief</span>
                                </div>
                                <pre className="text-white/70 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                                    {content.videoBrief}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'caption' && (
                    <div className="space-y-4 text-left">
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                            <p className="text-white text-sm whitespace-pre-line leading-relaxed">{content.caption}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'seo' && (
                    <div className="space-y-4 text-left">
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                            <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Meta Description</span>
                            <p className="text-white/80 text-sm leading-relaxed">{content.description}</p>
                        </div>
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                            <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Hashtags</span>
                            <div className="flex flex-wrap gap-2">
                                {content.hashtags.map((tag, i) => (
                                    <span key={i} className="text-primary text-xs bg-primary/10 px-3 py-1.5 rounded-full border border-primary/10">
                                        #{tag.replace('#', '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                            <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Target Platforms</span>
                            <div className="flex gap-2">
                                {item.socialPost?.platforms.map(p => (
                                    <span key={p} className="bg-white/5 text-white/70 px-3 py-1 rounded-full text-xs capitalize">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-center text-white/20 text-[10px] uppercase tracking-[0.1em]">
                    Scheduled via leaderflow strategic pipeline
                </p>
            </div>
        </div>
    );
}
