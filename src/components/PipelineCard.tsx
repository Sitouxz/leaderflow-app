'use client';

import { PipelineItem, STATUS_CONFIG, MEDIA_TYPE_CONFIG } from '@/types/pipeline';

interface PipelineCardProps {
    item: PipelineItem;
    onClick?: () => void;
}

const ICONS: Record<string, string> = {
    'Q3': 'strategy',
    'Leadership': 'account_tree',
    'Strategy': 'strategy',
    'Framework': 'account_tree',
    'Growth': 'trending_up',
    'Team': 'groups',
    'AI': 'smart_toy',
    'Future': 'rocket_launch',
    'default': 'lightbulb',
};

function getIcon(title: string): string {
    for (const [key, icon] of Object.entries(ICONS)) {
        if (title.includes(key)) return icon;
    }
    return ICONS.default;
}

export default function PipelineCard({ item, onClick }: PipelineCardProps) {
    const statusConfig = STATUS_CONFIG[item.status];
    const displayTitle = item.selectedAngle || item.rawInput.slice(0, 50);
    const icon = getIcon(displayTitle);
    const mediaConfig = item.selectedMediaType ? MEDIA_TYPE_CONFIG[item.selectedMediaType] : null;

    return (
        <div
            onClick={onClick}
            className="group relative flex items-center justify-between bg-surface-dark border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-all active:scale-[0.98] cursor-pointer"
        >
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                    <span
                        className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors"
                        style={{ fontSize: '20px' }}
                    >
                        {icon}
                    </span>
                    <span className="text-white text-lg font-semibold tracking-tight">
                        {displayTitle.length > 22 ? displayTitle.slice(0, 22) + '...' : displayTitle}
                    </span>
                </div>
                <div className="flex items-center gap-2 pl-[32px]">
                    <span
                        className={`flex size-2 rounded-full ${statusConfig.bgColor} ${statusConfig.shadowColor}`}
                    />
                    <span className={`${statusConfig.color} text-xs font-medium uppercase tracking-wider`}>
                        {statusConfig.label}
                    </span>
                    {mediaConfig && (
                        <span className="text-white/30 text-xs flex items-center gap-1 ml-2">
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{mediaConfig.icon}</span>
                            {mediaConfig.label}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-center size-8 rounded-full bg-white/5">
                <span className="material-symbols-outlined text-white/40" style={{ fontSize: '18px' }}>
                    chevron_right
                </span>
            </div>
        </div>
    );
}
