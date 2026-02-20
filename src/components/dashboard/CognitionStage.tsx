'use client';

import { PipelineItem } from '@/types/pipeline';

interface CognitionStageProps {
    items: PipelineItem[];
    publishedCount: number;
}

export default function CognitionStage({ items, publishedCount }: CognitionStageProps) {
    return (
        <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <h2 className="text-white text-2xl font-bold tracking-tight">AI Insights</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                    <span className="material-symbols-outlined text-primary mb-2" style={{ fontSize: '24px' }}>trending_up</span>
                    <p className="text-white text-2xl font-bold">{items.length}</p>
                    <p className="text-white/50 text-xs mt-1">Total Pipelines</p>
                </div>
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                    <span className="material-symbols-outlined text-emerald-500 mb-2" style={{ fontSize: '24px' }}>check_circle</span>
                    <p className="text-white text-2xl font-bold">{publishedCount}</p>
                    <p className="text-white/50 text-xs mt-1">Published</p>
                </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>lightbulb</span>
                    <div>
                        <h4 className="text-white font-medium mb-1">Pro Tip</h4>
                        <p className="text-white/60 text-sm">Record thoughts right after meetings when insights are fresh.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
