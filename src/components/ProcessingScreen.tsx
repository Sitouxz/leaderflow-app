'use client';

import { PipelineItem } from '@/types/pipeline';

interface ProcessingScreenProps {
    item: PipelineItem;
    onBack: () => void;
    onSimulateComplete?: () => void;
}

export default function ProcessingScreen({ item, onBack, onSimulateComplete }: ProcessingScreenProps) {
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
                    <h2 className="text-white text-xl font-bold">In Progress</h2>
                    <p className="text-white/50 text-sm mt-1">Human team is working on this</p>
                </div>
            </div>

            {/* Status Card */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="size-24 rounded-full bg-yellow-400/10 flex items-center justify-center">
                    <span
                        className="material-symbols-outlined text-yellow-400 animate-pulse"
                        style={{ fontSize: '48px' }}
                    >
                        engineering
                    </span>
                </div>

                <div className="text-center max-w-sm">
                    <h3 className="text-white text-lg font-semibold mb-2">
                        {item.selectedAngle}
                    </h3>
                    <p className="text-white/50 text-sm">
                        Our human writing team is crafting your content. You'll be notified when it's ready for review.
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="w-full max-w-xs space-y-3 mt-4">
                    <div className="flex items-center gap-3">
                        <span className="flex size-6 rounded-full bg-primary items-center justify-center">
                            <span className="material-symbols-outlined text-black" style={{ fontSize: '14px' }}>check</span>
                        </span>
                        <span className="text-white/60 text-sm">Angle selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex size-6 rounded-full bg-primary items-center justify-center">
                            <span className="material-symbols-outlined text-black" style={{ fontSize: '14px' }}>check</span>
                        </span>
                        <span className="text-white/60 text-sm">Task assigned to team</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex size-6 rounded-full bg-yellow-400 items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-black" style={{ fontSize: '14px' }}>edit</span>
                        </span>
                        <span className="text-yellow-400 text-sm font-medium">Writing & design in progress</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex size-6 rounded-full bg-white/10 items-center justify-center">
                            <span className="material-symbols-outlined text-white/30" style={{ fontSize: '14px' }}>pending</span>
                        </span>
                        <span className="text-white/30 text-sm">Ready for your review</span>
                    </div>
                </div>
            </div>

            {/* Dev: Simulate Completion Button */}
            {onSimulateComplete && (
                <button
                    onClick={onSimulateComplete}
                    className="mt-4 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-500/30 transition-colors text-sm"
                >
                    🧪 Simulate Human Completion (Dev Only)
                </button>
            )}
        </div>
    );
}
