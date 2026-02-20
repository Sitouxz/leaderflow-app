'use client';

import { PipelineItem } from '@/types/pipeline';

interface LibraryStageProps {
    items: PipelineItem[];
    onCardClick: (item: PipelineItem) => void;
}

export default function LibraryStage({ items, onCardClick }: LibraryStageProps) {
    return (
        <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <h2 className="text-white text-2xl font-bold tracking-tight">Content Library</h2>
                <span className="text-primary text-sm font-medium mb-1">{items.length} Posts</span>
            </div>
            {items.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-symbols-outlined text-white/20 mb-4" style={{ fontSize: '48px' }}>folder_open</span>
                    <p className="text-white/40">No published content yet</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {items.map(item => (
                        <div key={item.id} onClick={() => onCardClick(item)} className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/10 transition-all active:scale-[0.98]">
                            {item.mediaContent && <img src={item.mediaContent.imageUrl} alt="" className="w-full h-32 object-cover" />}
                            <div className="p-4">
                                <h3 className="text-white font-medium truncate">{item.selectedAngle}</h3>
                                <div className="flex gap-2 mt-2">
                                    {item.socialPost?.platforms.map(p => (
                                        <span key={p} className="text-emerald-400 text-xs capitalize">{p}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
