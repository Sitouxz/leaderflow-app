'use client';

import { useState, useEffect } from 'react';
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
import AISettingsPanel from '@/components/AISettingsPanel';
import BrandSettingsPanel from '@/components/BrandSettingsPanel';
import SocialAccountsPanel from '@/components/SocialAccountsPanel';

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
        setCurrentItem,
        updateScheduledTime
    } = usePipeline();

    const [showCaptureModal, setShowCaptureModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showAISettings, setShowAISettings] = useState(false);
    const [showBrandSettings, setShowBrandSettings] = useState(false);
    const [showSocialSettings, setShowSocialSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<NavTab>('capture');

    // Handle OAuth Redirect auto-open
    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get('settings') === 'social') {
            setShowSocialSettings(true);
            // Clean up URL
            window.history.replaceState({}, '', '/');
        }
    }, []);

    const liveCount = items.filter(item => item.status !== 'scheduled').length;
    const scheduledItems = items.filter(item => item.status === 'scheduled');

    const handleCaptureSubmit = async (text: string) => {
        setShowCaptureModal(false);
        await startCapture(text);
    };

    const handleCardClick = (item: typeof items[0]) => {
        setCurrentItem(item);
    };

    // AI Settings Screen
    if (showAISettings) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden">
                <BackgroundGradients />
                <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 py-4 relative z-10 overflow-hidden">
                    <AISettingsPanel onBack={() => setShowAISettings(false)} />
                </main>
                <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setShowAISettings(false); }} />
            </div>
        );
    }

    // Brand Settings Screen
    if (showBrandSettings) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden">
                <BackgroundGradients />
                <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 py-4 relative z-10 overflow-hidden">
                    <BrandSettingsPanel onBack={() => setShowBrandSettings(false)} />
                </main>
                <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setShowBrandSettings(false); }} />
            </div>
        );
    }

    // Social Settings Screen
    if (showSocialSettings) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden">
                <BackgroundGradients />
                <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 py-4 relative z-10 overflow-hidden">
                    <SocialAccountsPanel onBack={() => setShowSocialSettings(false)} />
                </main>
                <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setShowSocialSettings(false); }} />
            </div>
        );
    }

    // Settings Screen
    if (showSettings) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden">
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
                            <h3 className="text-white font-semibold mb-4">AI & Integrations</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => { setShowSettings(false); setShowAISettings(true); }}
                                    className="w-full flex items-center justify-between py-3 text-white/70 hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>auto_awesome</span>
                                        <span>AI Configuration</span>
                                    </div>
                                    <span className="material-symbols-outlined text-white/40" style={{ fontSize: '18px' }}>chevron_right</span>
                                </button>

                                <button
                                    onClick={() => { setShowSettings(false); setShowBrandSettings(true); }}
                                    className="w-full flex items-center justify-between py-3 text-white/70 hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-indigo-400" style={{ fontSize: '20px' }}>psychology</span>
                                        <span>Brand Context</span>
                                    </div>
                                    <span className="material-symbols-outlined text-white/40" style={{ fontSize: '18px' }}>chevron_right</span>
                                </button>

                                <button
                                    onClick={() => { setShowSettings(false); setShowSocialSettings(true); }}
                                    className="w-full flex items-center justify-between py-3 text-white/70 hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '20px' }}>link</span>
                                        <span>Connected Accounts</span>
                                    </div>
                                    <span className="material-symbols-outlined text-white/40" style={{ fontSize: '18px' }}>chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setShowSettings(false); }} />
            </div>
        );
    }

    // Item Detail Screens
    if (currentItem) {
        // Stage 1: Ideation
        if (currentItem.status === 'ideation') {
            return (
                <div className="flex flex-col h-full w-full overflow-hidden">
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
                </div>
            );
        }

        // Stage 2a: Media Type Selection
        if (currentItem.status === 'media_selection') {
            return (
                <div className="flex flex-col h-full w-full overflow-hidden">
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
                </div>
            );
        }

        // Stage 2b: Media Generating / Review
        if (currentItem.status === 'media_generating' || currentItem.status === 'media_review') {
            return (
                <div className="flex flex-col h-full w-full overflow-hidden">
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
                </div>
            );
        }

        // Stage 3: Scheduling
        if (currentItem.status === 'scheduling') {
            return (
                <div className="flex flex-col h-full w-full overflow-hidden">
                    <BackgroundGradients />
                    <Header onSettingsClick={() => setShowSettings(true)} />
                    <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
                        <SchedulingScreen
                            item={currentItem}
                            onConfirm={() => confirmPost(currentItem.id)}
                            onBack={() => setCurrentItem(null)}
                            onUpdateSchedule={(date) => updateScheduledTime(currentItem.id, date)}
                        />
                    </main>
                    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
            );
        }

        // Posted - Success View
        if (currentItem.status === 'scheduled') {
            return (
                <div className="flex flex-col h-full w-full overflow-hidden">
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
                </div>
            );
        }
    }

    // Library Tab
    if (activeTab === 'library') {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden">
                <BackgroundGradients />
                <Header onSettingsClick={() => setShowSettings(true)} />
                <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-auto">
                    <div className="flex flex-col gap-6 mt-4">
                        <div className="flex items-end justify-between border-b border-white/10 pb-4">
                            <h2 className="text-white text-2xl font-bold tracking-tight">Content Library</h2>
                            <span className="text-primary text-sm font-medium mb-1">{scheduledItems.length} Posts</span>
                        </div>
                        {scheduledItems.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-white/20 mb-4" style={{ fontSize: '48px' }}>folder_open</span>
                                <p className="text-white/40">No published content yet</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {scheduledItems.map(item => (
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
            </div>
        );
    }

    // Cognition Tab
    if (activeTab === 'cognition') {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden">
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
                                <p className="text-white text-2xl font-bold">{scheduledItems.length}</p>
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
            </div>
        );
    }

    // Default: Capture Tab
    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <BackgroundGradients />
            <Header onSettingsClick={() => setShowSettings(true)} />
            <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
                <div className="flex flex-col gap-6 mt-4">
                    <div className="flex items-end justify-between border-b border-white/10 pb-4">
                        <h2 className="text-white text-2xl font-bold tracking-tight">Active Pipelines</h2>
                        <span className="text-primary text-sm font-medium mb-1">{liveCount} Live</span>
                    </div>
                    <div className="flex flex-col gap-4 overflow-auto max-h-[300px]">
                        {items.filter(i => i.status !== 'scheduled').length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-white/20 mb-4" style={{ fontSize: '48px' }}>inbox</span>
                                <p className="text-white/40">No active pipelines</p>
                                <p className="text-white/30 text-sm mt-1">Tap the record button to start</p>
                            </div>
                        ) : (
                            items.filter(i => i.status !== 'scheduled').map(item => (
                                <PipelineCard key={item.id} item={item} onClick={() => handleCardClick(item)} />
                            ))
                        )}
                    </div>
                </div>
                <div className="flex-1 min-h-0" />
                <RecordButton
                    onRecordComplete={handleCaptureSubmit}
                    onTextClick={() => setShowCaptureModal(true)}
                    isLoading={isLoading}
                />
            </main>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            <CaptureModal isOpen={showCaptureModal} onClose={() => setShowCaptureModal(false)} onSubmit={handleCaptureSubmit} isLoading={isLoading} />
        </div>
    );
}
