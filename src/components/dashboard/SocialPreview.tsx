'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialPreviewProps {
    type: 'image' | 'video' | 'text' | 'carousel';
    mediaUrl?: string;
    caption: string;
    hashtags: string[];
    platforms: string[];
}

export default function SocialPreview({ type, mediaUrl, caption, hashtags, platforms }: SocialPreviewProps) {
    const [activePlatform, setActivePlatform] = useState(platforms.includes('facebook') ? 'facebook' : (platforms[0] || 'linkedin'));

    const fullText = `${caption}\n\n${hashtags.map(t => t.startsWith('#') ? t : '#' + t).join(' ')}`;

    const renderPreview = () => {
        switch (activePlatform) {
            case 'facebook':
                return (
                    <div className="bg-white rounded-lg overflow-hidden border border-black/10 text-black text-sm max-w-sm mx-auto shadow-xl">
                        <div className="p-3 flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">f</div>
                            <div>
                                <div className="font-bold flex items-center gap-1">
                                    LeaderFlow AI
                                    <span className="material-symbols-outlined text-[14px] text-blue-500">verified</span>
                                </div>
                                <div className="text-xs text-gray-500">Sponsored • Now • <span className="material-symbols-outlined text-[10px] align-middle">public</span></div>
                            </div>
                        </div>
                        <div className="px-3 mb-3 text-[14px] leading-normal whitespace-pre-wrap line-clamp-4 overflow-hidden">{fullText}</div>
                        {mediaUrl && (
                            <div className="relative aspect-video bg-gray-100 border-y border-black/5">
                                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex-1">
                                <div className="text-[12px] text-gray-500 uppercase">LEADERFLOW.AI</div>
                                <div className="font-bold text-[16px]">Transform your content today</div>
                            </div>
                            <button className="bg-gray-200 px-4 py-1.5 rounded-md font-bold text-sm">Learn More</button>
                        </div>
                        <div className="p-2 flex justify-around text-gray-500 font-semibold items-center text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                                Like
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                                Comment
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px]">share</span>
                                Share
                            </div>
                        </div>
                    </div>
                );
            case 'linkedin':
                return (
                    <div className="bg-white rounded-lg overflow-hidden border border-black/10 text-black text-sm max-w-sm mx-auto shadow-xl">
                        <div className="p-3 flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gray-200" />
                            <div>
                                <div className="font-bold">LeaderFlow User</div>
                                <div className="text-xs text-gray-500">Professional • Now</div>
                            </div>
                        </div>
                        <div className="px-3 mb-3 line-clamp-3 overflow-hidden whitespace-pre-wrap text-[13px] leading-snug">{fullText}</div>
                        {mediaUrl && (
                            <div className="relative aspect-video bg-gray-100">
                                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-2 border-t flex justify-around text-gray-500 font-semibold">
                            <span>Like</span>
                            <span>Comment</span>
                            <span>Republish</span>
                            <span>Send</span>
                        </div>
                    </div>
                );
            case 'x':
                return (
                    <div className="bg-black rounded-xl overflow-hidden border border-white/20 text-white text-sm max-w-sm mx-auto shadow-xl font-sans">
                        <div className="p-3 flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="flex items-center gap-1">
                                    <span className="font-bold">LeaderFlow</span>
                                    <span className="text-gray-500">@leaderflow • Now</span>
                                </div>
                                <div className="mt-1 mb-3 whitespace-pre-wrap">{fullText}</div>
                                {mediaUrl && (
                                    <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video">
                                        <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="mt-3 flex justify-between text-gray-500 max-w-[250px]">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat_bubble</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>repeat</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>favorite</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>analytics</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'instagram':
                return (
                    <div className="bg-white rounded-lg overflow-hidden border border-black/10 text-black text-sm max-w-sm mx-auto shadow-xl">
                        <div className="p-3 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1px]">
                                <div className="w-full h-full rounded-full bg-white p-[2px]">
                                    <div className="w-full h-full rounded-full bg-gray-200" />
                                </div>
                            </div>
                            <span className="font-bold text-xs">leaderflow_app</span>
                        </div>
                        {mediaUrl && (
                            <div className="aspect-square bg-gray-50">
                                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-3">
                            <div className="flex gap-4 mb-2">
                                <span className="material-symbols-outlined">favorite</span>
                                <span className="material-symbols-outlined text-flip">mode_comment</span>
                                <span className="material-symbols-outlined">send</span>
                            </div>
                            <div className="font-bold text-xs mb-1">12 likes</div>
                            <div className="text-xs">
                                <span className="font-bold mr-2">leaderflow_app</span>
                                {caption.length > 100 ? (
                                    <>
                                        {caption.substring(0, 100)}... <span className="text-gray-400">more</span>
                                    </>
                                ) : caption}
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div className="text-white/50 text-center py-10">Select a platform to preview</div>;
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-2">
                {platforms.map(p => (
                    <button
                        key={p}
                        onClick={() => setActivePlatform(p)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${activePlatform === p
                            ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20 scale-105'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                            }`}
                    >
                        {p.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="relative p-6 glass-surface glass-border rounded-3xl min-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activePlatform}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full relative z-10"
                    >
                        {renderPreview()}
                    </motion.div>
                </AnimatePresence>
            </div>

            <p className="text-center text-[10px] text-white/30 italic">
                * Simulated preview. Actual appearance may vary by platform.
            </p>
        </div>
    );
}
