'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PipelineItem, PipelineStatus, MediaType } from '@/types/pipeline';
import { generateStrategicAngles } from '@/services/openaiService';
import { generateMediaContent, regenerateWithFeedback } from '@/services/geminiService';
import { schedulePostAction, getScheduledPostsAction } from '@/actions/socialActions';
// Social generation is now handled within scheduling flow or via real actions if ready
// but keeping the call structure generic.

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

    // Stage 2: Update content manually
    updateMediaContent: (itemId: string, updates: any) => void;

    // Navigation
    setCurrentItem: (item: PipelineItem | null) => void;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function PipelineProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<PipelineItem[]>([]);
    const [currentItem, setCurrentItem] = useState<PipelineItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initial fetch from DB
    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const result = await getScheduledPostsAction();
                if (result.success && result.data) {
                    const dbItems: PipelineItem[] = result.data.map((post: any) => ({
                        id: post.id,
                        rawInput: 'Imported from database', // Raw input isn't stored in DB currently
                        status: 'scheduled' as PipelineStatus,
                        createdAt: new Date(post.createdAt),
                        selectedAngle: post.content.title || 'Imported Post',
                        selectedMediaType: post.content.type as MediaType,
                        mediaContent: post.content,
                        socialPost: {
                            platforms: post.platforms,
                            scheduledTime: new Date(post.scheduledTime)
                        }
                    }));
                    setItems(dbItems);
                }
            } catch (error) {
                console.error('Failed to initial fetch posts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, []);

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
            // In a production app, this would call a real content verification or platform-specific check
            // For now, we move directly to scheduling stage with default platforms
            const socialPost = {
                platforms: ['linkedin', 'twitter', 'instagram'],
                scheduledTime: new Date(Date.now() + 3600000), // Default 1 hour delay
            };

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

    const confirmPost = useCallback(async (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item?.mediaContent || !item?.socialPost) return;

        setIsLoading(true);
        try {
            const result = await schedulePostAction(
                item.mediaContent,
                item.socialPost.platforms,
                item.socialPost.scheduledTime
            );

            if (result.success) {
                updateItem(itemId, { status: 'scheduled' as PipelineStatus });
            } else {
                console.error('Failed to persist post:', result.error);
                alert('Failed to schedule post in database: ' + result.error);
            }
        } catch (error) {
            console.error('Error in confirmPost:', error);
        } finally {
            setIsLoading(false);
        }
    }, [items]);

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
                updateMediaContent: (itemId: string, updates: any) => {
                    const item = items.find(i => i.id === itemId);
                    if (item?.mediaContent) {
                        updateItem(itemId, {
                            mediaContent: {
                                ...item.mediaContent,
                                ...updates
                            }
                        });
                    }
                },
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
