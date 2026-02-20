'use client';

import SchedulingScreen from '@/components/SchedulingScreen';
import { PipelineItem } from '@/types/pipeline';

interface SchedulingStageProps {
    item: PipelineItem;
    onConfirm: () => void;
    onBack: () => void;
    onUpdateSchedule: (date: Date) => void;
}

export default function SchedulingStage({
    item,
    onConfirm,
    onBack,
    onUpdateSchedule
}: SchedulingStageProps) {
    return (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
            <SchedulingScreen
                item={item}
                onConfirm={onConfirm}
                onBack={onBack}
                onUpdateSchedule={onUpdateSchedule}
            />
        </div>
    );
}
