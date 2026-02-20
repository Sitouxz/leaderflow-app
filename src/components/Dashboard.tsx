'use client';

import { useState, useEffect } from 'react';
import { usePipeline } from '@/context/PipelineContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import BackgroundGradients from '@/components/BackgroundGradients';
import CaptureModal from '@/components/CaptureModal';

// Modular Stage Components
import CaptureStage from './dashboard/CaptureStage';
import IdeationStage from './dashboard/IdeationStage';
import MediaSelectionStage from './dashboard/MediaSelectionStage';
import MediaReviewStage from './dashboard/MediaReviewStage';
import SchedulingStage from './dashboard/SchedulingStage';
import SuccessStage from './dashboard/SuccessStage';
import LibraryStage from './dashboard/LibraryStage';
import CognitionStage from './dashboard/CognitionStage';

// Settings Panels
import AISettingsPanel from '@/components/AISettingsPanel';
import BrandSettingsPanel from '@/components/BrandSettingsPanel';

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
    const [activeTab, setActiveTab] = useState<NavTab>('capture');


    const liveCount = items.filter(item => item.status !== 'scheduled').length;
    const scheduledItems = items.filter(item => item.status === 'scheduled');

    const handleCaptureSubmit = async (text: string) => {
        setShowCaptureModal(false);
        await startCapture(text);
    };

    // Helper for settings screens
    const SettingsLayout = ({ children, onBack }: { children: React.ReactNode, onBack: () => void }) => (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <BackgroundGradients />
            <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 py-4 relative z-10 overflow-hidden">
                {children}
            </main>
            <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); onBack(); }} />
        </div>
    );

    if (showAISettings) return <SettingsLayout onBack={() => setShowAISettings(false)}><AISettingsPanel onBack={() => setShowAISettings(false)} /></SettingsLayout>;
    if (showBrandSettings) return <SettingsLayout onBack={() => setShowBrandSettings(false)}><BrandSettingsPanel onBack={() => setShowBrandSettings(false)} /></SettingsLayout>;

    if (showSettings) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden">
                <BackgroundGradients />
                <Header onSettingsClick={() => setShowSettings(false)} showBack />
                <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-auto">
                    <h2 className="text-white text-2xl font-bold mt-4 mb-6">Settings</h2>
                    <div className="space-y-4">
                        <div className="bg-surface-dark border border-white/5 rounded-2xl p-5">
                            <h3 className="text-white font-semibold mb-4">AI & Integrations</h3>
                            <div className="space-y-3">
                                <button onClick={() => { setShowSettings(false); setShowAISettings(true); }} className="w-full flex items-center justify-between py-3 text-white/70 hover:text-white transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>auto_awesome</span>
                                        <span>AI Configuration</span>
                                    </div>
                                    <span className="material-symbols-outlined text-white/40" style={{ fontSize: '18px' }}>chevron_right</span>
                                </button>
                                <button onClick={() => { setShowSettings(false); setShowBrandSettings(true); }} className="w-full flex items-center justify-between py-3 text-white/70 hover:text-white transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-indigo-400" style={{ fontSize: '20px' }}>psychology</span>
                                        <span>Brand Context</span>
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

    const renderContent = () => {
        if (currentItem) {
            switch (currentItem.status) {
                case 'ideation':
                    return <IdeationStage item={currentItem} isLoading={isLoading} onSelectAngle={(angle) => selectAngle(currentItem.id, angle)} onBack={() => setCurrentItem(null)} onSettingsClick={() => setShowSettings(true)} />;
                case 'media_selection':
                    return <MediaSelectionStage item={currentItem} onSelectType={(type) => selectMediaType(currentItem.id, type)} onBack={() => setCurrentItem(null)} />;
                case 'media_generating':
                case 'media_review':
                    return <MediaReviewStage item={currentItem} onApprove={() => approveMedia(currentItem.id)} onReject={(feedback) => rejectMedia(currentItem.id, feedback)} onChangeType={() => changeMediaType(currentItem.id)} onBack={() => setCurrentItem(null)} isLoading={isLoading} />;
                case 'scheduling':
                    return <SchedulingStage item={currentItem} onConfirm={() => confirmPost(currentItem.id)} onBack={() => setCurrentItem(null)} onUpdateSchedule={(date) => updateScheduledTime(currentItem.id, date)} />;
                case 'scheduled':
                    return <SuccessStage item={currentItem} onBack={() => setCurrentItem(null)} />;
                default:
                    return null;
            }
        }

        switch (activeTab) {
            case 'library':
                return <LibraryStage items={scheduledItems} onCardClick={setCurrentItem} />;
            case 'cognition':
                return <CognitionStage items={items} publishedCount={scheduledItems.length} />;
            default:
                return (
                    <CaptureStage
                        items={items}
                        liveCount={liveCount}
                        isLoading={isLoading}
                        onCardClick={setCurrentItem}
                        onCaptureSubmit={handleCaptureSubmit}
                        onTextClick={() => setShowCaptureModal(true)}
                    />
                );
        }
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <BackgroundGradients />
            <Header onSettingsClick={() => setShowSettings(true)} />
            <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 relative z-10 overflow-hidden">
                {renderContent()}
            </main>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            <CaptureModal isOpen={showCaptureModal} onClose={() => setShowCaptureModal(false)} onSubmit={handleCaptureSubmit} isLoading={isLoading} />
        </div>
    );
}
