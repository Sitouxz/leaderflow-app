'use client';

import { PipelineItem, MediaType, MEDIA_TYPE_CONFIG } from '@/types/pipeline';

interface MediaTypeScreenProps {
    item: PipelineItem;
    onSelectType: (type: MediaType) => void;
    onBack: () => void;
}

export default function MediaTypeScreen({ item, onSelectType, onBack }: MediaTypeScreenProps) {
    const mediaTypes: MediaType[] = ['infographic', 'carousel', 'image', 'video'];

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
                    <h2 className="text-white text-xl font-bold">Choose Content Type</h2>
                    <p className="text-white/50 text-sm mt-0.5 truncate">{item.selectedAngle}</p>
                </div>
            </div>

            {/* Media Type Options */}
            <div className="flex-1 space-y-3">
                {mediaTypes.map((type) => {
                    const config = MEDIA_TYPE_CONFIG[type];
                    const isHuman = config.generationType === 'human';

                    return (
                        <button
                            key={type}
                            onClick={() => onSelectType(type)}
                            className="w-full flex items-center gap-4 bg-surface-dark border border-white/5 hover:border-primary/30 p-5 rounded-2xl transition-all active:scale-[0.98] text-left group"
                        >
                            <div className={`flex items-center justify-center size-14 rounded-xl ${isHuman ? 'bg-yellow-400/10' : 'bg-primary/10'}`}>
                                <span
                                    className={`material-symbols-outlined ${isHuman ? 'text-yellow-400' : 'text-primary'}`}
                                    style={{ fontSize: '28px' }}
                                >
                                    {config.icon}
                                </span>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-semibold group-hover:text-primary transition-colors">
                                        {config.label}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isHuman
                                            ? 'bg-yellow-400/20 text-yellow-400'
                                            : 'bg-primary/20 text-primary'
                                        }`}>
                                        {isHuman ? 'Human' : 'AI'}
                                    </span>
                                </div>
                                <p className="text-white/50 text-sm mt-1">{config.description}</p>
                            </div>

                            <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors" style={{ fontSize: '20px' }}>
                                arrow_forward
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Info Note */}
            <div className="mt-4 bg-surface-dark/50 border border-white/5 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-white/40" style={{ fontSize: '20px' }}>info</span>
                    <div>
                        <p className="text-white/60 text-sm">
                            <span className="text-primary">AI content</span> is generated instantly.{' '}
                            <span className="text-yellow-400">Human content</span> sends a brief to your creative team.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
