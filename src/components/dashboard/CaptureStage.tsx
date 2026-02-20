'use client';

import PipelineCard from '@/components/PipelineCard';
import RecordButton from '@/components/RecordButton';
import { CardSkeleton } from '@/components/Skeleton';
import { PipelineItem } from '@/types/pipeline';

interface CaptureStageProps {
    items: PipelineItem[];
    liveCount: number;
    isLoading: boolean;
    onCardClick: (item: PipelineItem) => void;
    onCaptureSubmit: (text: string) => void;
    onTextClick: () => void;
}

export default function CaptureStage({
    items,
    liveCount,
    isLoading,
    onCardClick,
    onCaptureSubmit,
    onTextClick
}: CaptureStageProps) {
    const activeItems = items.filter(i => i.status !== 'scheduled');

    return (
        <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <h2 className="text-white text-2xl font-bold tracking-tight">Active Pipelines</h2>
                <span className="text-primary text-sm font-medium mb-1">{liveCount} Live</span>
            </div>
            <div className="flex flex-col gap-4 overflow-auto max-h-[300px]">
                {isLoading && activeItems.length === 0 && (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                )}
                {activeItems.length === 0 && !isLoading ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-white/20 mb-4" style={{ fontSize: '48px' }}>inbox</span>
                        <p className="text-white/40">No active pipelines</p>
                        <p className="text-white/30 text-sm mt-1">Tap the record button to start</p>
                    </div>
                ) : (
                    activeItems.map(item => (
                        <PipelineCard key={item.id} item={item} onClick={() => onCardClick(item)} />
                    ))
                )}
            </div>
            <div className="flex-1 min-h-0" />
            <RecordButton
                onRecordComplete={onCaptureSubmit}
                onTextClick={onTextClick}
                isLoading={isLoading}
            />
        </div>
    );
}
