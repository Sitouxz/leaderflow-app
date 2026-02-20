'use client';

import MediaTypeScreen from '@/components/MediaTypeScreen';
import { PipelineItem, MediaType } from '@/types/pipeline';

interface MediaSelectionStageProps {
    item: PipelineItem;
    onSelectType: (type: MediaType) => void;
    onBack: () => void;
}

export default function MediaSelectionStage({
    item,
    onSelectType,
    onBack
}: MediaSelectionStageProps) {
    return (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
            <MediaTypeScreen
                item={item}
                onSelectType={onSelectType}
                onBack={onBack}
            />
        </div>
    );
}
