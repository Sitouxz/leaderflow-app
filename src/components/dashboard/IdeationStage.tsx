'use client';

import Header from '@/components/Header';
import AngleSelectionScreen from '@/components/AngleSelectionScreen';
import { PipelineItem } from '@/types/pipeline';

interface IdeationStageProps {
    item: PipelineItem;
    isLoading: boolean;
    onSelectAngle: (angle: string) => void;
    onBack: () => void;
    onSettingsClick: () => void;
}

export default function IdeationStage({
    item,
    isLoading,
    onSelectAngle,
    onBack,
    onSettingsClick
}: IdeationStageProps) {
    return (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
            <AngleSelectionScreen
                item={item}
                onSelectAngle={onSelectAngle}
                onBack={onBack}
                isLoading={isLoading}
            />
        </div>
    );
}
