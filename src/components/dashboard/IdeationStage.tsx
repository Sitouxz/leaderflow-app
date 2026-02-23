'use client';

import Header from '@/components/Header';
import AngleSelectionScreen from '@/components/AngleSelectionScreen';
import { PipelineItem } from '@/types/pipeline';

interface IdeationStageProps {
    item: PipelineItem;
    isLoading: boolean;
    error: string | null;
    onSelectAngle: (angle: string) => void;
    onRegenerate: () => void;
    onBack: () => void;
    onSettingsClick: () => void;
}

export default function IdeationStage({
    item,
    isLoading,
    error,
    onSelectAngle,
    onRegenerate,
    onBack,
    onSettingsClick
}: IdeationStageProps) {
    return (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
            <AngleSelectionScreen
                item={item}
                onSelectAngle={onSelectAngle}
                onRegenerate={onRegenerate}
                onBack={onBack}
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
}
