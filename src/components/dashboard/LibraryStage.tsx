'use client';

import { PipelineItem } from '@/types/pipeline';

interface LibraryStageProps {
    items: PipelineItem[];
    onCardClick: (item: PipelineItem) => void;
    onDelete: (itemId: string) => void;
}

export default function LibraryStage({ items, onCardClick, onDelete }: LibraryStageProps) {
    const inProgress = items.filter(item => item.status !== 'scheduled');
    const published = items.filter(item => item.status === 'scheduled');

    const renderItem = (item: PipelineItem, isPublished: boolean) => (
        <div
            key={item.id}
            onClick={() => onCardClick(item)}
            className="group relative bg-surface-dark border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
        >
            {item.mediaContent?.imageUrl && (
                <div className="h-32 w-full relative overflow-hidden">
                    <img src={item.mediaContent.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {!isPublished && (
                        <div className="absolute top-2 left-2 bg-primary/20 backdrop-blur-md border border-primary/30 px-2 py-1 rounded-lg">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">In Progress</span>
                        </div>
                    )}
                </div>
            )}

            <div className="p-4 flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                        {item.selectedAngle || item.rawInput}
                    </h3>

                    {isPublished ? (
                        <div className="flex gap-2 mt-2">
                            {item.socialPost?.platforms.map(p => (
                                <span key={p} className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest">{p}</span>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-primary/70 text-[10px] uppercase font-bold tracking-widest">
                                {item.status.replace('_', ' ')}
                            </span>
                        </div>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this pipeline?')) {
                            onDelete(item.id);
                        }
                    }}
                    className="p-2 -mr-2 rounded-full hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 mt-4 pb-20 overflow-auto scrollbar-hide">
            {/* In Progress Section */}
            {inProgress.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-l-2 border-primary pl-4">
                        <h3 className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">In Progress</h3>
                        <span className="text-primary/40 text-[10px] font-bold">{inProgress.length} Items</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {inProgress.map(item => renderItem(item, false))}
                    </div>
                </div>
            )}

            {/* Published Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-l-2 border-emerald-500 pl-4">
                    <h3 className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">Published Library</h3>
                    <span className="text-emerald-500/40 text-[10px] font-bold">{published.length} Posts</span>
                </div>

                {published.length === 0 ? (
                    <div className="glass-surface border border-white/5 rounded-2xl p-8 text-center bg-white/[0.02]">
                        <span className="material-symbols-outlined text-white/10 mb-3" style={{ fontSize: '32px' }}>folder_open</span>
                        <p className="text-white/30 text-sm">No scheduled content yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {published.map(item => renderItem(item, true))}
                    </div>
                )}
            </div>
        </div>
    );
}
