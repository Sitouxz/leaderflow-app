'use client';

import { PipelineItem } from '@/types/pipeline';

interface SuccessStageProps {
    item: PipelineItem;
    onBack: () => void;
}

export default function SuccessStage({ item, onBack }: SuccessStageProps) {
    return (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={onBack} className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                    </button>
                    <h2 className="text-white text-xl font-bold">Published</h2>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="size-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '48px' }}>check_circle</span>
                    </div>
                    <div className="text-center max-w-sm">
                        <h3 className="text-white text-lg font-semibold mb-2">{item.selectedAngle}</h3>
                        <p className="text-white/40 text-xs mt-1">Ready to be published on your brand&apos;s active channels</p>
                        {item.socialPost && (
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {item.socialPost.platforms.map(p => (
                                    <span key={p} className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs capitalize">{p}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
