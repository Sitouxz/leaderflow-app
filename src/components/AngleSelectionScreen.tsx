'use client';

import { PipelineItem } from '@/types/pipeline';
import { GeneratedAngle, ANGLE_TYPE_CONFIG } from '@/types/pipeline';

interface AngleSelectionScreenProps {
    item: PipelineItem;
    onSelectAngle: (angle: string) => void;
    onBack: () => void;
    isLoading?: boolean;
}

export default function AngleSelectionScreen({ item, onSelectAngle, onBack, isLoading }: AngleSelectionScreenProps) {
    const angles = item.angles || [];

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
                <div className="flex-1">
                    <h2 className="text-white text-xl font-bold">Choose Your Angle</h2>
                    <p className="text-white/50 text-sm mt-0.5">
                        {isLoading ? 'AI is analyzing your input...' : 'Select the strategic direction for your content'}
                    </p>
                </div>
            </div>

            {/* Your Input Section */}
            <div className="mb-6">
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-2">Your Input</span>
                <div className="bg-surface-dark/50 border border-white/5 rounded-xl p-4">
                    <p className="text-white/80 text-sm">{item.rawInput}</p>
                </div>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="relative size-5">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                    </div>
                    <span className="text-primary text-sm font-medium">Generating strategic angles...</span>
                </div>
            )}

            {/* Angles List or Loading Skeleton */}
            <div className="flex-1 overflow-auto space-y-3">
                {isLoading ? (
                    <LoadingSkeleton />
                ) : (
                    angles.map((angle: GeneratedAngle, index: number) => {
                        const typeConfig = ANGLE_TYPE_CONFIG[angle.type];
                        return (
                            <button
                                key={index}
                                onClick={() => onSelectAngle(angle.title)}
                                className="w-full bg-surface-dark/80 hover:bg-surface-dark border border-white/5 hover:border-primary/30 rounded-2xl p-4 transition-all group text-left"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Number Badge */}
                                    <div className="flex-shrink-0 flex items-center justify-center size-10 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold">
                                        {index + 1}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Type Badge */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className={`material-symbols-outlined ${typeConfig.color}`} style={{ fontSize: '14px' }}>
                                                {typeConfig.icon}
                                            </span>
                                            <span className={`text-xs font-medium ${typeConfig.color}`}>
                                                {typeConfig.label}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-white font-semibold text-base leading-snug mb-2 group-hover:text-primary transition-colors">
                                            {angle.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-white/50 text-sm line-clamp-2">
                                            {angle.description}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex-shrink-0 flex items-center justify-center size-8 text-white/30 group-hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Regenerate Button */}
            <button className="mt-4 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-medium transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                Generate New Angles
            </button>
        </div>
    );
}

// Loading skeleton component
const LoadingSkeleton = () => (
    <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="w-full bg-surface-dark/80 border border-white/5 rounded-2xl p-4">
                <div className="flex items-start gap-4">
                    {/* Number Badge Skeleton */}
                    <div className="flex-shrink-0 size-10 rounded-full bg-white/10" />

                    {/* Content Skeleton */}
                    <div className="flex-1 min-w-0">
                        {/* Type Badge Skeleton */}
                        <div className="flex items-center gap-1.5 mb-2">
                            <div className="h-4 w-20 bg-white/10 rounded" />
                        </div>

                        {/* Title Skeleton */}
                        <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />

                        {/* Description Skeleton */}
                        <div className="space-y-1.5">
                            <div className="h-3 w-full bg-white/10 rounded" />
                            <div className="h-3 w-2/3 bg-white/10 rounded" />
                        </div>
                    </div>

                    {/* Arrow Skeleton */}
                    <div className="flex-shrink-0 size-8 rounded bg-white/5" />
                </div>
            </div>
        ))}
    </div>
);
