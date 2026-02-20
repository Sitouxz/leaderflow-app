'use server';

import { prisma } from '@/lib/prisma';
import { getBrandProfile } from '@/services/brandService';
import { MediaContent } from '@/types/pipeline';
import { saveScheduledPost } from '@/lib/scheduler/storage';
import { UploadPostService } from '@/lib/scheduler/uploadPostService';

export async function schedulePostAction(
    content: MediaContent,
    platforms: string[],
    scheduleTime: Date
): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
        const brand = await getBrandProfile();
        let externalJobId: string | undefined;

        // Try to schedule with Upload-Post if API key is present
        if (process.env.UPLOAD_POST_API_KEY) {
            console.log('Using Upload-Post API for scheduling...');
            console.log('Schedule Time (UTC):', scheduleTime.toISOString());
            console.log('Platforms:', platforms);

            try {
                const scheduler = new UploadPostService({
                    apiKey: process.env.UPLOAD_POST_API_KEY,
                    username: process.env.UPLOAD_POST_USERNAME || 'leaderflow',
                });

                const result = await scheduler.createScheduledPost(
                    content,
                    platforms,
                    scheduleTime
                );

                if (result.success && result.job_id) {
                    externalJobId = result.job_id;
                    console.log('Successfully scheduled with Upload-Post. Job ID:', externalJobId);
                }
            } catch (externalError: any) {
                console.error('Upload-Post scheduling failed:', externalError);
                // If the external scheduling failed, we should report it to the user
                // instead of silently falling back, as per user requirement.
                return {
                    success: false,
                    error: externalError.message || 'Failed to schedule post with external provider'
                };
            }
        } else {
            console.log('Scheduling post (Free/Self-Hosted) for:', platforms, 'at', scheduleTime);
        }

        // Save to local DB storage
        const post = await saveScheduledPost({
            content,
            platforms,
            scheduledTime: scheduleTime.toISOString(),
            brandId: brand.id,
            externalJobId
        });

        console.log('Post saved to local storage:', post);

        return { success: true, data: post };
    } catch (error: any) {
        console.error('Schedule Action Error:', error);
        return { success: false, error: error.message || 'Failed to schedule post' };
    }
}

export async function getSocialAccountsAction() {
    try {
        const brand = await getBrandProfile();
        const accounts = await prisma.socialAccount.findMany({
            where: { brandId: brand.id }
        });
        return { success: true, data: accounts };
    } catch (error) {
        console.error('Failed to get social accounts:', error);
        return { success: false, error: 'Failed to load social accounts' };
    }
}

export async function saveSocialAccountAction(data: {
    platform: string;
    accessToken: string;
    tokenSecret?: string;
    refreshToken?: string;
    expiresAt?: Date;
}) {
    try {
        const brand = await getBrandProfile();

        const account = await prisma.socialAccount.upsert({
            where: {
                platform_brandId: {
                    platform: data.platform,
                    brandId: brand.id
                }
            },
            update: {
                accessToken: data.accessToken,
                tokenSecret: data.tokenSecret || null,
                refreshToken: data.refreshToken || null,
                expiresAt: data.expiresAt || null,
            },
            create: {
                platform: data.platform,
                accessToken: data.accessToken,
                tokenSecret: data.tokenSecret || null,
                refreshToken: data.refreshToken || null,
                expiresAt: data.expiresAt || null,
                brandId: brand.id
            }
        });

        return { success: true, data: account };
    } catch (error) {
        console.error('Failed to save social account:', error);
        return { success: false, error: 'Failed to save account' };
    }
}

export async function deleteSocialAccountAction(platform: string) {
    try {
        const brand = await getBrandProfile();
        await prisma.socialAccount.delete({
            where: {
                platform_brandId: {
                    platform,
                    brandId: brand.id
                }
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to delete social account:', error);
        return { success: false, error: 'Failed to delete account' };
    }
}
