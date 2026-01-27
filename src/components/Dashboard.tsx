'use client';

import { useState } from 'react';
import { usePipeline } from '@/context/PipelineContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import BackgroundGradients from '@/components/BackgroundGradients';
import PipelineCard from '@/components/PipelineCard';
import RecordButton from '@/components/RecordButton';
import CaptureModal from '@/components/CaptureModal';
import AngleSelectionScreen from '@/components/AngleSelectionScreen';
import MediaTypeScreen from '@/components/MediaTypeScreen';
import MediaReviewScreen from '@/components/MediaReviewScreen';
import SchedulingScreen from '@/components/SchedulingScreen';

type NavTab = 'capture' | 'library' | 'cognition';

export default function Dashboard() {
    const {
        items,
        currentItem,
        isLoading,
        startCapture,
        selectAngle,
        selectMediaType,
        approveMedia,
        rejectMedia,
        changeMediaType,
        confirmPost,
        setCurrentItem
    } = usePipeline();

    const [showCaptureModal, setShowCaptureModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<NavTab>('capture');

    const liveCount = items.filter(item => item.status !== 'posted').length;
    const postedItems = items.filter(item => item.status === 'posted');

    const handleCaptureSubmit = async (text: string) => {
        setShowCaptureModal(false);
        await startCapture(text);
    };

    const handleCardClick = (item: typeof items[0]) => {
        setCurrentItem(item);
    };

    // Settings Screen
    if (showSettings) {
        return (
            <>
                <BackgroundGradients />
                <Header onSettingsClick={() => setShowSettings(false)} showBack />
                <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-auto">
                    <h2 className="text-white text-2xl font-bold mt-4 mb-6">Settings</h2>
                    <div className="space-y-4">
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                            <h3 className="text-white font-semibold mb-4">Account</h3>
                            <div className="space-y-3">
                                {['Profile', 'Notifications', 'Privacy'].map(item => (
                                    <button key={item} className="w-full flex items-center justify-between py-3 text-white/70 hover:text-white transition-colors">
                                        <span>{item}</span>
                                        <span className="material-symbols-outlined text-white/40" style={{ fontSize: '18px' }}>chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                            <h3 className="text-white font-semibold mb-4">Integrations</h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center justify-between py-3 text-white/70 hover:text-white transition-colors">
                                    <span>Connected Accounts</span>
                                    <span className="text-emerald-500 text-xs">4 Active</span>
                                </button>
                                <button className="w-full flex items-center justify-between py-3 text-white/70 hover:text-white transition-colors">
                                    <span>AI Provider</span>
                                    <span className="text-primary text-xs">OpenAI</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setShowSettings(false); }} />
            </>
        );
    }

    // Item Detail Screens
    if (currentItem) {
        // Stage 1: Ideation
        if (currentItem.status === 'ideation') {
            return (
                <>
                    <BackgroundGradients />
                    <Header onSettingsClick={() => setShowSettings(true)} />
                    <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
                        <AngleSelectionScreen
                            item={currentItem}
                            onSelectAngle={(angle) => selectAngle(currentItem.id, angle)}
                            onBack={() => setCurrentItem(null)}
                            isLoading={isLoading}
                        />
                    </main>
                    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                </>
            );
        }

        // Stage 2a: Media Type Selection
        if (currentItem.status === 'media_selection') {
            return (
                <>
                    <BackgroundGradients />
                    <Header onSettingsClick={() => setShowSettings(true)} />
                    <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
                        <MediaTypeScreen
                            item={currentItem}
                            onSelectType={(type) => selectMediaType(currentItem.id, type)}
                            onBack={() => setCurrentItem(null)}
                        />
                    </main>
                    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                </>
            );
        }

        // Stage 2b: Media Generating / Review
        if (currentItem.status === 'media_generating' || currentItem.status === 'media_review') {
            return (
                <>
                    <BackgroundGradients />
                    <Header onSettingsClick={() => setShowSettings(true)} />
                    <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
                        <MediaReviewScreen
                            item={currentItem}
                            onApprove={() => approveMedia(currentItem.id)}
                            onReject={(feedback) => rejectMedia(currentItem.id, feedback)}
                            onChangeType={() => changeMediaType(currentItem.id)}
                            onBack={() => setCurrentItem(null)}
                            isLoading={isLoading}
                        />
                    </main>
                    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                </>
            );
        }

        // Stage 3: Scheduling
        if (currentItem.status === 'scheduling') {
            return (
                <>
                    <BackgroundGradients />
                    <Header onSettingsClick={() => setShowSettings(true)} />
                    <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
                        <SchedulingScreen
                            item={currentItem}
                            onConfirm={() => confirmPost(currentItem.id)}
                            onBack={() => setCurrentItem(null)}
                        />
                    </main>
                    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                </>
            );
        }

        // Posted - Success View
        if (currentItem.status === 'posted') {
            return (
                <>
                    <BackgroundGradients />
                    <Header onSettingsClick={() => setShowSettings(true)} />
                    <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-4 mb-6">
                                <button onClick={() => setCurrentItem(null)} className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                                </button>
                                <h2 className="text-white text-xl font-bold">Published</h2>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                <div className="size-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '48px' }}>check_circle</span>
                                </div>
                                <div className="text-center max-w-sm">
                                    <h3 className="text-white text-lg font-semibold mb-2">{currentItem.selectedAngle}</h3>
                                    <p className="text-white/50 text-sm mb-4">Successfully posted to social media!</p>
                                    {currentItem.socialPost && (
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {currentItem.socialPost.platforms.map(p => (
                                                <span key={p} className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs capitalize">{p}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                </>
            );
        }
    }

    // Library Tab
    if (activeTab === 'library') {
        return (
            <>
                <BackgroundGradients />
                <Header onSettingsClick={() => setShowSettings(true)} />
                <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-auto">
                    <div className="flex flex-col gap-6 mt-4">
                        <div className="flex items-end justify-between border-b border-white/10 pb-4">
                            <h2 className="text-white text-2xl font-bold tracking-tight">Content Library</h2>
                            <span className="text-primary text-sm font-medium mb-1">{postedItems.length} Posts</span>
                        </div>
                        {postedItems.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-white/20 mb-4" style={{ fontSize: '48px' }}>folder_open</span>
                                <p className="text-white/40">No published content yet</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {postedItems.map(item => (
                                    <div key={item.id} onClick={() => handleCardClick(item)} className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/10 transition-all active:scale-[0.98]">
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
                </main>
                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            </>
        );
    }

    // Cognition Tab
    if (activeTab === 'cognition') {
        return (
            <>
                <BackgroundGradients />
                <Header onSettingsClick={() => setShowSettings(true)} />
                <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-auto">
                    <div className="flex flex-col gap-6 mt-4">
                        <div className="flex items-end justify-between border-b border-white/10 pb-4">
                            <h2 className="text-white text-2xl font-bold tracking-tight">AI Insights</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                                <span className="material-symbols-outlined text-primary mb-2" style={{ fontSize: '24px' }}>trending_up</span>
                                <p className="text-white text-2xl font-bold">{items.length}</p>
                                <p className="text-white/50 text-xs mt-1">Total Pipelines</p>
                            </div>
                            <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                                <span className="material-symbols-outlined text-emerald-500 mb-2" style={{ fontSize: '24px' }}>check_circle</span>
                                <p className="text-white text-2xl font-bold">{postedItems.length}</p>
                                <p className="text-white/50 text-xs mt-1">Published</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>lightbulb</span>
                                <div>
                                    <h4 className="text-white font-medium mb-1">Pro Tip</h4>
                                    <p className="text-white/60 text-sm">Record thoughts right after meetings when insights are fresh.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            </>
        );
    }

    // Default: Capture Tab
    return (
        <>
            <BackgroundGradients />
            <Header onSettingsClick={() => setShowSettings(true)} />
            <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10">
                <div className="flex flex-col gap-6 mt-4">
                    <div className="flex items-end justify-between border-b border-white/10 pb-4">
                        <h2 className="text-white text-2xl font-bold tracking-tight">Active Pipelines</h2>
                        <span className="text-primary text-sm font-medium mb-1">{liveCount} Live</span>
                    </div>
                    <div className="flex flex-col gap-4 overflow-auto max-h-[300px]">
                        {items.filter(i => i.status !== 'posted').length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-white/20 mb-4" style={{ fontSize: '48px' }}>inbox</span>
                                <p className="text-white/40">No active pipelines</p>
                                <p className="text-white/30 text-sm mt-1">Tap the record button to start</p>
                            </div>
                        ) : (
                            items.filter(i => i.status !== 'posted').map(item => (
                                <PipelineCard key={item.id} item={item} onClick={() => handleCardClick(item)} />
                            ))
                        )}
                    </div>
                </div>
                <div className="flex-1" />
                <RecordButton
                    onRecordComplete={handleCaptureSubmit}
                    onTextClick={() => setShowCaptureModal(true)}
                    isLoading={isLoading}
                />
            </main>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            <CaptureModal isOpen={showCaptureModal} onClose={() => setShowCaptureModal(false)} onSubmit={handleCaptureSubmit} isLoading={isLoading} />
        </>
    );
}
