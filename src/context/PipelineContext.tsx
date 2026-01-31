'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { PipelineItem, PipelineStatus, MediaType } from '@/types/pipeline';
import { generateStrategicAngles } from '@/services/openaiService';
import { generateMediaContent, regenerateWithFeedback } from '@/services/geminiService';
import { generateSocialPost } from '@/services/mockSocialPost';

interface PipelineContextType {
    items: PipelineItem[];
    currentItem: PipelineItem | null;
    isLoading: boolean;

    // Stage 1: Ideation
    startCapture: (rawInput: string) => Promise<void>;
    selectAngle: (itemId: string, angle: string) => void;

    // Stage 2: Media
    selectMediaType: (itemId: string, mediaType: MediaType) => Promise<void>;
    approveMedia: (itemId: string) => Promise<void>;
    rejectMedia: (itemId: string, feedback: string) => Promise<void>;
    changeMediaType: (itemId: string) => void;

    // Stage 3: Scheduling
    confirmPost: (itemId: string) => void;
    updateScheduledTime: (itemId: string, date: Date) => void;

    // Navigation
    setCurrentItem: (item: PipelineItem | null) => void;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function PipelineProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<PipelineItem[]>([
        // Demo items showing different stages
        {
            id: 'demo-1',
            rawInput: 'Q3 growth strategy for enterprise market',
            selectedAngle: 'Strategic Planning for Q3 Growth',
            status: 'media_selection',
            createdAt: new Date(),
        },
        {
            id: 'demo-2',
            rawInput: 'Leadership principles for scaling organizations',
            selectedAngle: 'Building High-Performance Teams',
            selectedMediaType: 'carousel',
            mediaContent: {
                type: 'carousel',
                imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
                previewUrls: [
                    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80',
                    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
                    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
                ],
                caption: `🔄 Swipe through for the complete framework →

Building High-Performance Teams

The most successful leaders understand that growth comes from continuous learning and adaptation.

Here's what I've learned after years of building and scaling teams - and why I believe this approach makes all the difference.

💬 What's your experience with this? Share your thoughts below!

⤵️ Save this for later | 🔄 Share with your network`,
                description: 'In this carousel, I break down the key principles behind "Building High-Performance Teams". This framework has helped countless leaders transform their approach.',
                hashtags: ['#Leadership', '#TeamBuilding', '#HighPerformance', '#Management', '#GrowthMindset'],
            },
            status: 'media_review',
            createdAt: new Date(Date.now() - 3600000),
        },
        {
            id: 'demo-3',
            rawInput: 'AI transformation in enterprise',
            selectedAngle: 'The Future of AI in Business',
            selectedMediaType: 'image',
            mediaContent: {
                type: 'image',
                imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
                caption: '💡 The Future of AI in Business\n\nThe most successful leaders understand that AI is not about replacement...',
                description: 'Exploring how AI is transforming modern business practices.',
                hashtags: ['#AI', '#Leadership', '#Innovation', '#FutureOfWork', '#BusinessStrategy'],
            },
            socialPost: {
                platforms: ['linkedin', 'twitter'],
                scheduledTime: new Date(Date.now() + 3600000),
            },
            status: 'posted',
            createdAt: new Date(Date.now() - 86400000),
        },
    ]);
    const [currentItem, setCurrentItem] = useState<PipelineItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Helper to update item
    const updateItem = (itemId: string, updates: Partial<PipelineItem>) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ));
        setCurrentItem(prev => prev?.id === itemId ? { ...prev, ...updates } : prev);
    };

    // Stage 1: Start capture and generate angles
    const startCapture = useCallback(async (rawInput: string) => {
        setIsLoading(true);

        const newItem: PipelineItem = {
            id: `item-${Date.now()}`,
            rawInput,
            status: 'ideation',
            createdAt: new Date(),
        };

        setItems(prev => [newItem, ...prev]);
        setCurrentItem(newItem);

        try {
            const angles = await generateStrategicAngles(rawInput);
            updateItem(newItem.id, { angles });
        } catch (error) {
            console.error('Failed to generate angles:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Stage 1 → Stage 2: Select angle, move to media selection
    const selectAngle = useCallback((itemId: string, angle: string) => {
        updateItem(itemId, {
            selectedAngle: angle,
            status: 'media_selection' as PipelineStatus
        });
    }, []);

    // Stage 2: Select media type and start generation
    const selectMediaType = useCallback(async (itemId: string, mediaType: MediaType) => {
        const item = items.find(i => i.id === itemId);
        if (!item?.selectedAngle) return;

        updateItem(itemId, {
            selectedMediaType: mediaType,
            status: 'media_generating' as PipelineStatus
        });
        setIsLoading(true);

        try {
            const mediaContent = await generateMediaContent(item.selectedAngle, mediaType);
            updateItem(itemId, {
                mediaContent,
                status: 'media_review' as PipelineStatus
            });
        } catch (error) {
            console.error('Failed to generate media:', error);
        } finally {
            setIsLoading(false);
        }
    }, [items]);

    // Stage 2: Approve media → move to scheduling
    const approveMedia = useCallback(async (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item?.selectedAngle || !item?.selectedMediaType) return;

        setIsLoading(true);

        try {
            const socialPost = await generateSocialPost(
                item.selectedAngle,
                item.selectedMediaType,
                ['linkedin', 'twitter', 'instagram']
            );
            updateItem(itemId, {
                socialPost,
                status: 'scheduling' as PipelineStatus
            });
        } catch (error) {
            console.error('Failed to generate social post:', error);
        } finally {
            setIsLoading(false);
        }
    }, [items]);

    // Stage 2: Reject media with feedback → regenerate
    const rejectMedia = useCallback(async (itemId: string, feedback: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item?.selectedAngle || !item?.selectedMediaType) return;

        updateItem(itemId, {
            rejectionFeedback: feedback,
            status: 'media_generating' as PipelineStatus,
            mediaContent: undefined
        });
        setIsLoading(true);

        try {
            const mediaContent = await regenerateWithFeedback(
                item.selectedAngle,
                item.selectedMediaType,
                feedback
            );
            updateItem(itemId, {
                mediaContent,
                status: 'media_review' as PipelineStatus
            });
        } catch (error) {
            console.error('Failed to regenerate media:', error);
        } finally {
            setIsLoading(false);
        }
    }, [items]);

    // Stage 2: Go back to media type selection
    const changeMediaType = useCallback((itemId: string) => {
        updateItem(itemId, {
            selectedMediaType: undefined,
            mediaContent: undefined,
            status: 'media_selection' as PipelineStatus
        });
    }, []);

    // Stage 3: Confirm and post
    const confirmPost = useCallback((itemId: string) => {
        updateItem(itemId, { status: 'posted' as PipelineStatus });
        setCurrentItem(null);
    }, []);

    return (
        <PipelineContext.Provider
            value={{
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
                updateScheduledTime: (itemId: string, date: Date) => {
                    const item = items.find(i => i.id === itemId);
                    if (item?.socialPost) {
                        updateItem(itemId, {
                            socialPost: {
                                ...item.socialPost,
                                scheduledTime: date
                            }
                        });
                    }
                },
            }}
        >
            {children}
        </PipelineContext.Provider>
    );
}

export function usePipeline() {
    const context = useContext(PipelineContext);
    if (context === undefined) {
        throw new Error('usePipeline must be used within a PipelineProvider');
    }
    return context;
}
