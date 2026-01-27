'use client';

import { useState } from 'react';
import { PipelineItem, MEDIA_TYPE_CONFIG } from '@/types/pipeline';

interface SchedulingScreenProps {
    item: PipelineItem;
    onConfirm: () => void;
    onBack: () => void;
}

const PLATFORMS = [
    { id: 'linkedin', label: 'LinkedIn', icon: 'work' },
    { id: 'twitter', label: 'Twitter/X', icon: 'tag' },
    { id: 'instagram', label: 'Instagram', icon: 'photo_camera' },
    { id: 'facebook', label: 'Facebook', icon: 'groups' },
];

export default function SchedulingScreen({ item, onConfirm, onBack }: SchedulingScreenProps) {
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
        item.socialPost?.platforms || ['linkedin', 'twitter']
    );

    const socialPost = item.socialPost;
    const mediaContent = item.mediaContent;
    const mediaConfig = item.selectedMediaType ? MEDIA_TYPE_CONFIG[item.selectedMediaType] : null;

    const togglePlatform = (id: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    if (!socialPost || !mediaContent) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: '48px' }}>
                    progress_activity
                </span>
                <p className="text-white/50">Preparing your post...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                </button>
                <div className="flex-1">
                    <h2 className="text-white text-xl font-bold">Schedule Post</h2>
                    <p className="text-white/50 text-sm mt-0.5">Review and publish</p>
                </div>
            </div>

            {/* Content Preview */}
            <div className="flex-1 overflow-auto space-y-4">
                {/* Preview Card */}
                <div className="bg-surface-dark rounded-2xl overflow-hidden">
                    <img
                        src={mediaContent.imageUrl}
                        alt=""
                        className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            {mediaConfig && (
                                <span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{mediaConfig.icon}</span>
                                    {mediaConfig.label}
                                </span>
                            )}
                        </div>
                        <p className="text-white text-sm font-medium truncate">{item.selectedAngle}</p>
                    </div>
                </div>

                {/* Caption - from mediaContent */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-white/40 text-xs uppercase tracking-wider">Caption</span>
                        <span className="text-emerald-400 text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                            Approved
                        </span>
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-line line-clamp-6">{mediaContent.caption}</p>
                </div>

                {/* Hashtags - from mediaContent */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                    <span className="text-white/40 text-xs uppercase tracking-wider mb-3 block">Hashtags</span>
                    <div className="flex flex-wrap gap-2">
                        {mediaContent.hashtags.map((tag, i) => (
                            <span key={i} className="text-primary text-sm bg-primary/10 px-3 py-1 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Platform Selection */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                    <span className="text-white/40 text-xs uppercase tracking-wider mb-3 block">Post to</span>
                    <div className="grid grid-cols-2 gap-2">
                        {PLATFORMS.map((platform) => {
                            const isSelected = selectedPlatforms.includes(platform.id);
                            return (
                                <button
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform.id)}
                                    className={`flex items-center gap-2 p-3 rounded-xl transition-all ${isSelected
                                        ? 'bg-primary/20 border-2 border-primary'
                                        : 'bg-white/5 border-2 border-transparent hover:border-white/10'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined ${isSelected ? 'text-primary' : 'text-white/40'}`} style={{ fontSize: '20px' }}>
                                        {platform.icon}
                                    </span>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-white/60'}`}>
                                        {platform.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Schedule Time */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-white/40 text-xs uppercase tracking-wider block mb-1">Scheduled for</span>
                            <span className="text-white font-medium">
                                {socialPost.scheduledTime.toLocaleString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                        <button className="text-primary text-sm hover:underline">Edit</button>
                    </div>
                </div>
            </div>

            {/* Confirm Button */}
            <button
                onClick={onConfirm}
                disabled={selectedPlatforms.length === 0}
                className="mt-4 w-full py-4 rounded-xl bg-emerald-500 text-black font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>send</span>
                Schedule Post
            </button>
        </div>
    );
}
