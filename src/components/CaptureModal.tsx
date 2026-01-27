'use client';

import { useState } from 'react';

interface CaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (text: string) => void;
    isLoading?: boolean;
}

export default function CaptureModal({ isOpen, onClose, onSubmit, isLoading }: CaptureModalProps) {
    const [text, setText] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text.trim());
            setText('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-md bg-surface-dark border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white text-xl font-bold">Type Your Thought</h2>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-white/60" style={{ fontSize: '20px' }}>close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Describe your thought, topic, or strategic idea..."
                        className="w-full h-32 bg-background-dark border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-primary/50 transition-colors"
                        disabled={isLoading}
                        autoFocus
                    />

                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!text.trim() || isLoading}
                            className="flex-1 py-3 px-4 rounded-xl bg-primary text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
                                    Generate Angles
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
