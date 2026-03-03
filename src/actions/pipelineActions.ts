'use server';

import { prisma, withRetry } from '@/lib/prisma';
import { PipelineItem, PipelineStatus, MediaType, GeneratedAngle, MediaContent, SocialPost } from '@/types/pipeline';
import { getBrandProfile } from '@/services/brandService';
import { revalidatePath } from 'next/cache';

/**
 * Save a new pipeline or create it
 */
export async function savePipelineAction(item: Partial<PipelineItem>): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const brand = await getBrandProfile();

        const result = await withRetry(() => prisma.pipeline.upsert({
            where: { id: item.id || 'new' },
            create: {
                id: item.id,
                rawInput: item.rawInput || '',
                status: item.status || 'ideation',
                angles: item.angles ? JSON.stringify(item.angles) : null,
                selectedAngle: item.selectedAngle || null,
                selectedMediaType: item.selectedMediaType || null,
                mediaContent: item.mediaContent ? JSON.stringify(item.mediaContent) : null,
                rejectionFeedback: item.rejectionFeedback || null,
                socialPost: item.socialPost ? JSON.stringify(item.socialPost) : null,
                brandId: brand.id,
            },
            update: {
                ...(item.rawInput !== undefined && { rawInput: item.rawInput }),
                ...(item.status !== undefined && { status: item.status }),
                ...(item.angles !== undefined && { angles: item.angles ? JSON.stringify(item.angles) : null }),
                ...(item.selectedAngle !== undefined && { selectedAngle: item.selectedAngle }),
                ...(item.selectedMediaType !== undefined && { selectedMediaType: item.selectedMediaType }),
                ...(item.mediaContent !== undefined && { mediaContent: item.mediaContent ? JSON.stringify(item.mediaContent) : null }),
                ...(item.rejectionFeedback !== undefined && { rejectionFeedback: item.rejectionFeedback }),
                ...(item.socialPost !== undefined && { socialPost: item.socialPost ? JSON.stringify(item.socialPost) : null }),
            },
        }));

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Save Pipeline Action Error:', error);
        return { success: false, error: error.message || 'Failed to save pipeline' };
    }
}

/**
 * Fetch all pipelines for the current brand
 */
export async function getPipelinesAction(): Promise<{ success: boolean; data?: PipelineItem[]; error?: string }> {
    try {
        const brand = await getBrandProfile();

        const pipelines = await withRetry(() => prisma.pipeline.findMany({
            where: { brandId: brand.id },
            orderBy: { createdAt: 'desc' }
        }));

        const mapped: PipelineItem[] = pipelines.map(p => ({
            id: p.id,
            rawInput: p.rawInput,
            status: p.status as PipelineStatus,
            createdAt: p.createdAt,
            angles: p.angles ? JSON.parse(p.angles) : undefined,
            selectedAngle: p.selectedAngle || undefined,
            selectedMediaType: p.selectedMediaType as MediaType || undefined,
            mediaContent: p.mediaContent ? JSON.parse(p.mediaContent) : undefined,
            rejectionFeedback: p.rejectionFeedback || undefined,
            socialPost: p.socialPost ? JSON.parse(p.socialPost) : undefined,
        }));

        return { success: true, data: mapped };
    } catch (error: any) {
        console.error('Get Pipelines Action Error:', error);
        return { success: false, error: error.message || 'Failed to fetch pipelines' };
    }
}

/**
 * Delete a pipeline
 */
export async function deletePipelineAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await withRetry(() => prisma.pipeline.delete({
            where: { id }
        }));
        return { success: true };
    } catch (error: any) {
        console.error('Delete Pipeline Action Error:', error);
        return { success: false, error: error.message || 'Failed to delete pipeline' };
    }
}

/**
 * Batch sync action for multiple pipelines
 */
export async function syncPipelinesAction(items: PipelineItem[]): Promise<{ success: boolean; error?: string }> {
    try {
        const brand = await getBrandProfile();

        // This is a simple implementation, ideally we'd use a transaction or bulk upsert
        for (const item of items) {
            const data: any = {
                id: item.id,
                rawInput: item.rawInput,
                status: item.status,
                angles: item.angles ? JSON.stringify(item.angles) : null,
                selectedAngle: item.selectedAngle || null,
                selectedMediaType: item.selectedMediaType || null,
                mediaContent: item.mediaContent ? JSON.stringify(item.mediaContent) : null,
                rejectionFeedback: item.rejectionFeedback || null,
                socialPost: item.socialPost ? JSON.stringify(item.socialPost) : null,
                brandId: brand.id,
            };

            await withRetry(() => prisma.pipeline.upsert({
                where: { id: item.id },
                create: {
                    id: item.id,
                    rawInput: item.rawInput,
                    status: item.status,
                    angles: item.angles ? JSON.stringify(item.angles) : null,
                    selectedAngle: item.selectedAngle || null,
                    selectedMediaType: item.selectedMediaType || null,
                    mediaContent: item.mediaContent ? JSON.stringify(item.mediaContent) : null,
                    rejectionFeedback: item.rejectionFeedback || null,
                    socialPost: item.socialPost ? JSON.stringify(item.socialPost) : null,
                    brandId: brand.id,
                },
                update: {
                    rawInput: item.rawInput,
                    status: item.status,
                    angles: item.angles ? JSON.stringify(item.angles) : null,
                    selectedAngle: item.selectedAngle || null,
                    selectedMediaType: item.selectedMediaType || null,
                    mediaContent: item.mediaContent ? JSON.stringify(item.mediaContent) : null,
                    rejectionFeedback: item.rejectionFeedback || null,
                    socialPost: item.socialPost ? JSON.stringify(item.socialPost) : null,
                },
            }));
        }

        return { success: true };
    } catch (error: any) {
        console.error('Sync Pipelines Action Error:', error);
        return { success: false, error: error.message || 'Failed to sync pipelines' };
    }
}
