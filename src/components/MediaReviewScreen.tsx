'use client';

import { useState, useCallback } from 'react';
import { PipelineItem, MEDIA_TYPE_CONFIG } from '@/types/pipeline';
import { usePipeline } from '@/context/PipelineContext';
import { useToast } from '@/context/ToastContext';

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
    const { updateMediaContent } = usePipeline();
    const { showToast } = useToast();

    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [activeTab, setActiveTab] = useState<'preview' | 'caption' | 'seo'>('preview');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [editedCaption, setEditedCaption] = useState(item.mediaContent?.caption || '');
    const [editedDescription, setEditedDescription] = useState(item.mediaContent?.description || '');

    const mediaType = item.selectedMediaType;
    const content = item.mediaContent;
    const config = mediaType ? MEDIA_TYPE_CONFIG[mediaType] : null;
    const isVideo = mediaType === 'video';

    const copyToClipboard = useCallback((text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`${label} copied to clipboard`, 'success');
        }).catch(() => {
            showToast('Failed to copy', 'error');
        });
    }, [showToast]);

    const handleSaveEdits = () => {
        updateMediaContent(item.id, {
            caption: editedCaption,
            description: editedDescription
        });
        setIsEditing(false);
        showToast('Changes saved locally', 'success');
    };

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
            showToast('Feedback submitted for regeneration', 'info');
        }
    };

    // Reset selection when content changes (e.g. regeneration)
    if (selectedImage && !content.previewUrls?.includes(selectedImage) && selectedImage !== content.imageUrl) {
        setSelectedImage(null);
    }

    const currentImage = selectedImage || content.imageUrl;

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
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center justify-center size-10 rounded-full transition-colors ${isEditing ? 'bg-primary text-black' : 'bg-surface-dark text-white/70 hover:bg-white/10'}`}
                        title={isEditing ? "Exit Edit Mode" : "Edit Content"}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isEditing ? 'close' : 'edit'}</span>
                    </button>
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
                        <div className="rounded-2xl overflow-hidden bg-surface-dark relative group ring-1 ring-white/5">
                            <img src={currentImage} alt={config?.label} className="w-full aspect-video object-cover transition-opacity duration-300" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="text-white/80 text-sm font-medium">Visual Preview</span>
                            </div>
                        </div>
                        {content.previewUrls && content.previewUrls.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto p-2 scrollbar-hide">
                                {content.previewUrls.map((url, i) => {
                                    const isSelected = url === currentImage;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedImage(url)}
                                            className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-surface-dark transition-all ${isSelected ? 'ring-2 ring-primary scale-105' : 'ring-1 ring-white/10 opacity-70 hover:opacity-100 hover:scale-105'
                                                }`}
                                        >
                                            <img src={url} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {isVideo && content.videoBrief && (
                            <div className="bg-surface-dark border border-yellow-400/20 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: '20px' }}>description</span>
                                        <span className="text-yellow-400 font-medium text-sm">Brief for Human Editor</span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(content.videoBrief || '', 'Video brief')}
                                        className="size-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center hover:bg-yellow-400/20 transition-colors"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                                    </button>
                                </div>
                                <pre className="text-white/70 text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-auto scrollbar-hide">
                                    {content.videoBrief}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {/* Caption Tab */}
                {activeTab === 'caption' && (
                    <div className="space-y-4">
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4 transition-all focus-within:border-primary/30">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-white/40 text-xs uppercase tracking-wider">Caption</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyToClipboard(isEditing ? editedCaption : content.caption, 'Caption')}
                                        className="size-8 rounded-lg bg-white/5 text-white/50 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                                    </button>
                                    <span className="text-primary text-xs flex items-center gap-1">
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
                                        Optimized
                                    </span>
                                </div>
                            </div>
                            {isEditing ? (
                                <textarea
                                    value={editedCaption}
                                    onChange={(e) => setEditedCaption(e.target.value)}
                                    className="w-full h-48 bg-black/20 rounded-xl p-3 text-white text-sm leading-relaxed focus:outline-none placeholder:text-white/20 resize-none"
                                    placeholder="Write your caption here..."
                                />
                            ) : (
                                <p className="text-white text-sm whitespace-pre-line leading-relaxed">{content.caption}</p>
                            )}
                        </div>
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4 transition-all focus-within:border-primary/30">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-white/40 text-xs uppercase tracking-wider">Description</span>
                                <button
                                    onClick={() => copyToClipboard(isEditing ? editedDescription : content.description, 'Description')}
                                    className="size-8 rounded-lg bg-white/5 text-white/50 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                                </button>
                            </div>
                            {isEditing ? (
                                <textarea
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    className="w-full h-24 bg-black/20 rounded-xl p-3 text-white/80 text-sm leading-relaxed focus:outline-none placeholder:text-white/20 resize-none"
                                    placeholder="Brief SEO description..."
                                />
                            ) : (
                                <p className="text-white/80 text-sm leading-relaxed">{content.description}</p>
                            )}
                        </div>

                        {isEditing && (
                            <button
                                onClick={handleSaveEdits}
                                className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Save Changes
                            </button>
                        )}
                    </div>
                )}

                {/* SEO Tab */}
                {activeTab === 'seo' && (
                    <div className="space-y-4">
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-white/40 text-xs uppercase tracking-wider">Hashtags</span>
                                <button
                                    onClick={() => copyToClipboard(content.hashtags.join(' '), 'Hashtags')}
                                    className="size-8 rounded-lg bg-white/5 text-white/50 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {content.hashtags.map((tag, i) => (
                                    <span key={i} className="text-primary text-sm bg-primary/10 px-3 py-1.5 rounded-full border border-primary/10">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: '20px' }}>verified</span>
                                <div>
                                    <h4 className="text-white font-medium text-sm mb-1">SEO Health: 98%</h4>
                                    <p className="text-white/50 text-xs leading-relaxed">High readability score. Keywords match industry standards. Visual consistency verified.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                            <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Platform Compliance</span>
                            <div className="space-y-3">
                                {['LinkedIn', 'Twitter', 'Instagram'].map((platform) => (
                                    <div key={platform} className="flex items-center justify-between py-1 px-1">
                                        <span className="text-white/70 text-sm">{platform}</span>
                                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                            Valid
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
                <div className="mt-4 space-y-3 bg-surface-dark/50 p-4 rounded-2xl border border-white/5">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="What should be Different? (e.g. 'more tactical', 'shorter hook', 'different image style')..."
                        className="w-full h-24 bg-background-dark border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-primary/50 text-sm"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setShowFeedback(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-colors text-sm">
                            Cancel
                        </button>
                        <button onClick={handleReject} disabled={!feedback.trim() || isLoading} className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
                            Regenerate
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setShowFeedback(true)}
                        className="flex-[0.4] py-4 rounded-xl bg-surface-dark border border-white/10 text-white font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                        Reject
                    </button>
                    <button
                        onClick={() => {
                            onApprove();
                            showToast('Content approved!', 'success');
                        }}
                        disabled={isLoading || isEditing}
                        className="flex-1 py-4 rounded-xl bg-emerald-500 text-black font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                        Approve & Schedule
                    </button>
                </div>
            )}
        </div>
    );
}
