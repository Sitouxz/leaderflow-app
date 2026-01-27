'use client';

import { useState } from 'react';
import { PipelineItem, MediaDesign, MEDIA_TYPE_CONFIG } from '@/types/pipeline';

interface MediaDesignScreenProps {
    item: PipelineItem;
    onApprove: (design: MediaDesign) => void;
    onReject: (feedback: string) => void;
    onBack: () => void;
    isLoading?: boolean;
}

export default function MediaDesignScreen({
    item,
    onApprove,
    onReject,
    onBack,
    isLoading
}: MediaDesignScreenProps) {
    const [selectedDesign, setSelectedDesign] = useState<MediaDesign | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState('');

    const designs = item.mediaDesigns || [];

    const handleApprove = () => {
        if (selectedDesign) {
            onApprove(selectedDesign);
        }
    };

    const handleReject = () => {
        if (feedback.trim()) {
            onReject(feedback.trim());
            setFeedback('');
            setShowFeedback(false);
        }
    };

    // Loading state while generating designs
    if (item.status === 'angle_selected' || designs.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-white text-xl font-bold">Generating Designs</h2>
                        <p className="text-white/50 text-sm mt-1">{item.selectedAngle}</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="size-20 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-400 animate-pulse" style={{ fontSize: '40px' }}>
                            palette
                        </span>
                    </div>
                    <div className="text-center">
                        <p className="text-white font-medium">AI is creating your designs...</p>
                        <p className="text-white/50 text-sm mt-2">Generating infographic, carousel, image, and video options</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                </button>
                <div className="flex-1">
                    <h2 className="text-white text-xl font-bold">Choose Design</h2>
                    <p className="text-white/50 text-sm mt-0.5 truncate">{item.selectedAngle}</p>
                </div>
            </div>

            {/* Design Options Grid */}
            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-2 gap-3">
                    {designs.map((design, index) => {
                        const config = MEDIA_TYPE_CONFIG[design.type];
                        const isSelected = selectedDesign?.type === design.type;

                        return (
                            <button
                                key={index}
                                onClick={() => setSelectedDesign(design)}
                                className={`relative rounded-2xl overflow-hidden transition-all ${isSelected
                                        ? 'ring-2 ring-primary scale-[0.98]'
                                        : 'ring-1 ring-white/10 hover:ring-white/20'
                                    }`}
                            >
                                {/* Image Preview */}
                                <div className="aspect-square bg-surface-dark">
                                    <img
                                        src={design.imageUrl}
                                        alt={design.type}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Label */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>
                                            {config.icon}
                                        </span>
                                        <span className="text-white text-sm font-medium">{config.label}</span>
                                    </div>
                                </div>

                                {/* Selected Checkmark */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 size-6 rounded-full bg-primary flex items-center justify-center">
                                        <span className="material-symbols-outlined text-black" style={{ fontSize: '16px' }}>check</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Selected Design Caption Preview */}
                {selectedDesign && (
                    <div className="mt-4 bg-surface-dark border border-white/5 rounded-xl p-4">
                        <span className="text-white/40 text-xs uppercase tracking-wider">Caption</span>
                        <p className="text-white mt-1">{selectedDesign.caption}</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            {showFeedback ? (
                <div className="mt-4 space-y-3">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Describe what you'd like changed..."
                        className="w-full h-20 bg-background-dark border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-primary/50 text-sm"
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowFeedback(false)}
                            className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={!feedback.trim() || isLoading}
                            className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            Regenerate
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={() => setShowFeedback(true)}
                        className="flex-1 py-4 rounded-xl bg-surface-dark border border-white/10 text-white font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                        Reject
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={!selectedDesign || isLoading}
                        className="flex-1 py-4 rounded-xl bg-emerald-500 text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                        Approve
                    </button>
                </div>
            )}
        </div>
    );
}
