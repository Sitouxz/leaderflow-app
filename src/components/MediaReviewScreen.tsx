'use client';

import { useState } from 'react';
import { PipelineItem, MEDIA_TYPE_CONFIG } from '@/types/pipeline';

interface MediaReviewScreenProps {
    item: PipelineItem;
    onApprove: () => void;
    onReject: (feedback: string) => void;
    onChangeType: () => void;
    onBack: () => void;
    isLoading?: boolean;
}

export default function MediaReviewScreen({
    item,
    onApprove,
    onReject,
    onChangeType,
    onBack,
    isLoading
}: MediaReviewScreenProps) {
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [activeTab, setActiveTab] = useState<'preview' | 'caption' | 'seo'>('preview');

    const mediaType = item.selectedMediaType;
    const content = item.mediaContent;
    const config = mediaType ? MEDIA_TYPE_CONFIG[mediaType] : null;
    const isVideo = mediaType === 'video';

    // Loading state
    if (item.status === 'media_generating' || !content) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={onBack} className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-white text-xl font-bold">Creating Content</h2>
                        <p className="text-white/50 text-sm mt-1">{config?.label || 'Media'}</p>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className={`size-20 rounded-full ${isVideo ? 'bg-yellow-400/10' : 'bg-primary/10'} flex items-center justify-center`}>
                        <span className={`material-symbols-outlined ${isVideo ? 'text-yellow-400' : 'text-primary'} animate-pulse`} style={{ fontSize: '40px' }}>
                            {isVideo ? 'videocam' : 'palette'}
                        </span>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-medium">{isVideo ? 'Preparing brief for human editor...' : 'AI is generating your content...'}</p>
                        <p className="text-white/50 text-sm mt-2">Including optimized caption, description & hashtags</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleReject = () => {
        if (feedback.trim()) {
            onReject(feedback.trim());
            setFeedback('');
            setShowFeedback(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-3">
                <button onClick={onBack} className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                </button>
                <div className="flex-1">
                    <h2 className="text-white text-xl font-bold">Review {config?.label}</h2>
                    <p className="text-white/50 text-sm mt-0.5 truncate">{item.selectedAngle}</p>
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
            <div className="flex-1 overflow-auto">
                {/* Preview Tab */}
                {activeTab === 'preview' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl overflow-hidden bg-surface-dark">
                            <img src={content.imageUrl} alt={config?.label} className="w-full aspect-video object-cover" />
                        </div>
                        {content.previewUrls && content.previewUrls.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {content.previewUrls.map((url, i) => (
                                    <div key={i} className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-surface-dark ring-2 ring-white/10">
                                        <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {isVideo && content.videoBrief && (
                            <div className="bg-surface-dark border border-yellow-400/20 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: '20px' }}>description</span>
                                    <span className="text-yellow-400 font-medium text-sm">Brief for Human Editor</span>
                                </div>
                                <pre className="text-white/70 text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-auto">
                                    {content.videoBrief}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {/* Caption Tab */}
                {activeTab === 'caption' && (
                    <div className="space-y-4">
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-white/40 text-xs uppercase tracking-wider">AI-Optimized Caption</span>
                                <span className="text-primary text-xs flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
                                    SEO Optimized
                                </span>
                            </div>
                            <p className="text-white text-sm whitespace-pre-line leading-relaxed">{content.caption}</p>
                        </div>
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                            <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Description</span>
                            <p className="text-white/80 text-sm leading-relaxed">{content.description}</p>
                        </div>
                    </div>
                )}

                {/* SEO Tab */}
                {activeTab === 'seo' && (
                    <div className="space-y-4">
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                            <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Hashtags</span>
                            <div className="flex flex-wrap gap-2">
                                {content.hashtags.map((tag, i) => (
                                    <span key={i} className="text-primary text-sm bg-primary/10 px-3 py-1.5 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/10 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>tips_and_updates</span>
                                <div>
                                    <h4 className="text-white font-medium text-sm mb-1">SEO Score: Excellent</h4>
                                    <p className="text-white/50 text-xs">Caption is optimized for engagement with strong hook, clear CTA, and trending hashtags.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                            <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Platform Optimization</span>
                            <div className="space-y-2">
                                {['LinkedIn', 'Twitter', 'Instagram'].map((platform) => (
                                    <div key={platform} className="flex items-center justify-between py-2">
                                        <span className="text-white/70 text-sm">{platform}</span>
                                        <span className="text-emerald-400 text-xs flex items-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                            Ready
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            {showFeedback ? (
                <div className="mt-4 space-y-3">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Describe what you'd like changed (media, caption, hashtags, etc.)..."
                        className="w-full h-20 bg-background-dark border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-primary/50 text-sm"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setShowFeedback(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-colors text-sm">
                            Cancel
                        </button>
                        <button onClick={handleReject} disabled={!feedback.trim() || isLoading} className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
                            Regenerate
                        </button>
                        <button onClick={onChangeType} className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-semibold hover:opacity-90 transition-opacity text-sm">
                            Change Type
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2 mt-4">
                    <button onClick={() => setShowFeedback(true)} className="flex-1 py-4 rounded-xl bg-surface-dark border border-white/10 text-white font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                        Reject
                    </button>
                    <button onClick={onApprove} disabled={isLoading} className="flex-1 py-4 rounded-xl bg-emerald-500 text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                        Approve
                    </button>
                </div>
            )}
        </div>
    );
}
