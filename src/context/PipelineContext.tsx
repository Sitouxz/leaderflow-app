'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PipelineItem, PipelineStatus, MediaType } from '@/types/pipeline';
import { generateStrategicAngles } from '@/services/openaiService';
import { generateMediaContent, regenerateWithFeedback } from '@/services/geminiService';
import { schedulePostAction } from '@/actions/socialActions';
import {
    savePipelineAction,
    getPipelinesAction,
    deletePipelineAction
} from '@/actions/pipelineActions';

interface PipelineContextType {
    items: PipelineItem[];
    currentItem: PipelineItem | null;
    isLoading: boolean;
    error: string | null;

    // Stage 1: Ideation
    startCapture: (rawInput: string) => Promise<void>;
    regenerateAngles: (itemId: string) => Promise<void>;
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
    deleteItem: (itemId: string) => Promise<void>;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function PipelineProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<PipelineItem[]>([]);
    const [currentItem, setCurrentItem] = useState<PipelineItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch from DB
    useEffect(() => {
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const result = await getPipelinesAction();
                if (result.success && result.data) {
                    setItems(result.data);
                }
            } catch (error) {
                console.error('Failed to initial fetch pipelines:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAll();
    }, []);


    // Helper to update item and sync to DB
    // Use functional updates to avoid stale closures
    const updateItem = useCallback(async (itemId: string, updates: Partial<PipelineItem>) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, ...updates };
            }
            return item;
        }));

        setCurrentItem(prev => {
            if (prev?.id === itemId) {
                return { ...prev, ...updates };
            }
            return prev;
        });

        // Persist to DB
        try {
            await savePipelineAction({ id: itemId, ...updates });
        } catch (e) {
            console.error('Failed to sync update to DB:', e);
        }
    }, []);

    // Stage 1: Start capture and generate angles
    const startCapture = useCallback(async (rawInput: string) => {
        setIsLoading(true);
        setError(null);

        const tempId = `item-${Date.now()}`;
        const newItem: PipelineItem = {
            id: tempId,
            rawInput,
            status: 'ideation',
            createdAt: new Date(),
        };

        setItems(prev => [newItem, ...prev]);
        setCurrentItem(newItem);

        try {
            const saveResult = await savePipelineAction(newItem);
            const realId = saveResult.success && saveResult.data ? saveResult.data.id : tempId;

            if (realId !== tempId) {
                setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: realId } : i));
                setCurrentItem(prev => (prev?.id === tempId ? { ...prev, id: realId } : prev));
            }

            const angles = await generateStrategicAngles(rawInput);
            if (!angles || angles.length === 0) {
                throw new Error('No angles were returned from the AI.');
            }

            await updateItem(realId, { angles });
        } catch (err: any) {
            console.error('[PipelineContext] Failed to start capture:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [updateItem]);

    // Regenerate angles
    const regenerateAngles = useCallback(async (itemId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // We need rawInput but we can't use 'items' here easily without dependencies
            // So we'll find it from the items state inside setItems or just accept it's a dependency
            // Actually, regenerateAngles usually only called for the currentItem or similar.
            // Let's add 'items' to dependencies to keep it simple for now, or use a ref.
            // But we already have currentItem. Let's use the ID passed.
            setItems(prev => {
                const item = prev.find(i => i.id === itemId);
                if (item) {
                    generateStrategicAngles(item.rawInput).then(angles => {
                        updateItem(itemId, { angles });
                    }).catch(err => {
                        setError(err.message);
                    }).finally(() => {
                        setIsLoading(false);
                    });
                }
                return prev;
            });
        } catch (err: any) {
            setError(err.message || 'Failed to generate angles.');
            setIsLoading(false);
        }
    }, [updateItem]);

    // Delete item
    const deleteItem = useCallback(async (itemId: string) => {
        try {
            await deletePipelineAction(itemId);
            setItems(prev => prev.filter(i => i.id !== itemId));
            setCurrentItem(prev => (prev?.id === itemId ? null : prev));
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    }, []);

    // Stage 1 → Stage 2
    const selectAngle = useCallback((itemId: string, angle: string) => {
        updateItem(itemId, {
            selectedAngle: angle,
            status: 'media_selection' as PipelineStatus
        });
    }, [updateItem]);

    // Stage 2: Media generation
    const selectMediaType = useCallback(async (itemId: string, mediaType: MediaType) => {
        // We need the selectedAngle. Let's get it from the state.
        // To avoid stale closures, we use the items dependency.
        const item = items.find(i => i.id === itemId);
        if (!item?.selectedAngle) return;

        await updateItem(itemId, {
            selectedMediaType: mediaType,
            status: 'media_generating' as PipelineStatus
        });
        setIsLoading(true);

        try {
            const mediaContent = await generateMediaContent(item.selectedAngle, mediaType);
            await updateItem(itemId, {
                mediaContent,
                status: 'media_review' as PipelineStatus
            });
        } catch (error) {
            console.error('Failed to generate media:', error);
        } finally {
            setIsLoading(false);
        }
    }, [items, updateItem]);

    // Stage 2: Approve
    const approveMedia = useCallback(async (itemId: string) => {
        setIsLoading(true);
        try {
            const socialPost = {
                platforms: ['facebook'],
                scheduledTime: new Date(Date.now() + 3600000),
            };

            await updateItem(itemId, {
                socialPost,
                status: 'scheduling' as PipelineStatus
            });
        } catch (error) {
            console.error('Failed to approve media:', error);
        } finally {
            setIsLoading(false);
        }
    }, [updateItem]);

    // Stage 2: Reject
    const rejectMedia = useCallback(async (itemId: string, feedback: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item?.selectedAngle || !item?.selectedMediaType) return;

        await updateItem(itemId, {
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
            await updateItem(itemId, {
                mediaContent,
                status: 'media_review' as PipelineStatus
            });
        } catch (error) {
            console.error('Failed to regenerate media:', error);
        } finally {
            setIsLoading(false);
        }
    }, [items, updateItem]);

    // Stage 2: Change media type
    const changeMediaType = useCallback((itemId: string) => {
        updateItem(itemId, {
            selectedMediaType: undefined,
            mediaContent: undefined,
            status: 'media_selection' as PipelineStatus
        });
    }, [updateItem]);

    // Stage 3: Confirm post
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
                await updateItem(itemId, { status: 'scheduled' as PipelineStatus });
            } else {
                console.error('Failed to persist post:', result.error);
                alert('Failed to schedule post: ' + result.error);
            }
        } catch (error) {
            console.error('Error in confirmPost:', error);
        } finally {
            setIsLoading(false);
        }
    }, [items, updateItem]);

    const updateMediaContent = useCallback(async (itemId: string, updates: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId && item.mediaContent) {
                return {
                    ...item,
                    mediaContent: { ...item.mediaContent, ...updates }
                };
            }
            return item;
        }));
        setCurrentItem(prev => {
            if (prev?.id === itemId && prev.mediaContent) {
                return {
                    ...prev,
                    mediaContent: { ...prev.mediaContent, ...updates }
                };
            }
            return prev;
        });

        const item = items.find(i => i.id === itemId);
        if (item && item.mediaContent) {
            try {
                await savePipelineAction({
                    id: itemId,
                    mediaContent: { ...item.mediaContent, ...updates }
                });
            } catch (e) {
                console.error('Failed to sync media content update to DB:', e);
            }
        }
    }, [items]);

    const updateScheduledTime = useCallback(async (itemId: string, date: Date) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId && item.socialPost) {
                return {
                    ...item,
                    socialPost: { ...item.socialPost, scheduledTime: date }
                };
            }
            return item;
        }));
        setCurrentItem(prev => {
            if (prev?.id === itemId && prev.socialPost) {
                return {
                    ...prev,
                    socialPost: { ...prev.socialPost, scheduledTime: date }
                };
            }
            return prev;
        });

        const item = items.find(i => i.id === itemId);
        if (item && item.socialPost) {
            try {
                await savePipelineAction({
                    id: itemId,
                    socialPost: { ...item.socialPost, scheduledTime: date }
                });
            } catch (e) {
                console.error('Failed to sync scheduled time update to DB:', e);
            }
        }
    }, [items]);

    return (
        <PipelineContext.Provider
            value={{
                items,
                currentItem,
                isLoading,
                error,
                startCapture,
                regenerateAngles,
                selectAngle,
                selectMediaType,
                approveMedia,
                rejectMedia,
                changeMediaType,
                confirmPost,
                setCurrentItem,
                deleteItem,
                updateMediaContent,
                updateScheduledTime,
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
