'use client';

import { useState } from 'react';
import { PipelineItem } from '@/types/pipeline';

interface ReviewScreenProps {
    item: PipelineItem;
    onApprove: () => void;
    onFeedback: (feedback: string) => void;
    onBack: () => void;
}

export default function ReviewScreen({ item, onApprove, onFeedback, onBack }: ReviewScreenProps) {
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleSubmitFeedback = () => {
        if (feedback.trim()) {
            onFeedback(feedback.trim());
            setFeedback('');
            setShowFeedbackForm(false);
        }
    };

    if (!item.finalDraft) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <span className="material-symbols-outlined text-yellow-400" style={{ fontSize: '48px' }}>
                    hourglass_top
                </span>
                <p className="text-white/50">Waiting for human team to complete...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        arrow_back
                    </span>
                </button>
                <div>
                    <h2 className="text-white text-xl font-bold">Review Final Draft</h2>
                    <p className="text-white/50 text-sm mt-1">{item.selectedAngle}</p>
                </div>
            </div>

            {/* Content Preview */}
            <div className="flex-1 overflow-auto space-y-4">
                {/* Featured Image */}
                <div className="aspect-video rounded-2xl overflow-hidden bg-surface-dark">
                    <img
                        src={item.finalDraft.imageUrl}
                        alt="Featured visual"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Draft Content */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
                    <div className="prose prose-invert prose-sm max-w-none">
                        {item.finalDraft.text.split('\n').map((line, i) => {
                            if (line.startsWith('# ')) {
                                return <h2 key={i} className="text-white text-lg font-bold mt-0 mb-4">{line.slice(2)}</h2>;
                            }
                            if (line.startsWith('## ')) {
                                return <h3 key={i} className="text-white/90 text-base font-semibold mt-6 mb-3">{line.slice(3)}</h3>;
                            }
                            if (line.startsWith('**') && line.endsWith('**')) {
                                return <p key={i} className="text-white font-medium">{line.slice(2, -2)}</p>;
                            }
                            if (line.match(/^\d+\./)) {
                                return <p key={i} className="text-white/80 pl-4 my-2">{line}</p>;
                            }
                            if (line.trim()) {
                                return <p key={i} className="text-white/70 my-3">{line}</p>;
                            }
                            return null;
                        })}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {showFeedbackForm ? (
                <div className="mt-4 space-y-3">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Describe the changes you'd like..."
                        className="w-full h-24 bg-background-dark border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-primary/50"
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowFeedbackForm(false)}
                            className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmitFeedback}
                            disabled={!feedback.trim()}
                            className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            Send Feedback
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={() => setShowFeedbackForm(true)}
                        className="flex-1 py-4 rounded-xl bg-surface-dark border border-white/10 text-white font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            edit_note
                        </span>
                        Request Changes
                    </button>
                    <button
                        onClick={onApprove}
                        className="flex-1 py-4 rounded-xl bg-emerald-500 text-black font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            check_circle
                        </span>
                        Approve & Schedule
                    </button>
                </div>
            )}
        </div>
    );
}
