'use client';

import MediaReviewScreen from '@/components/MediaReviewScreen';
import { PipelineItem } from '@/types/pipeline';

interface MediaReviewStageProps {
    item: PipelineItem;
    isLoading: boolean;
    onApprove: () => void;
    onReject: (feedback: string) => void;
    onChangeType: () => void;
    onBack: () => void;
}

export default function MediaReviewStage({
    item,
    isLoading,
    onApprove,
    onReject,
    onChangeType,
    onBack
}: MediaReviewStageProps) {
    return (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
            <MediaReviewScreen
                item={item}
                onApprove={onApprove}
                onReject={onReject}
                onChangeType={onChangeType}
                onBack={onBack}
                isLoading={isLoading}
            />
        </div>
    );
}
