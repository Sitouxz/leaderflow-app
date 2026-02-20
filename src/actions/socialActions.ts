'use server';

import { getBrandProfile } from '@/services/brandService';
import { MediaContent } from '@/types/pipeline';
import { saveScheduledPost, getScheduledPosts } from '@/lib/scheduler/storage';
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
                return {
                    success: false,
                    error: externalError.message || 'Failed to schedule post with external provider'
                };
            }
        }

        // Save to local DB storage for tracking
        const post = await saveScheduledPost({
            content,
            platforms,
            scheduledTime: scheduleTime.toISOString(),
            brandId: brand.id,
            externalJobId
        });

        return { success: true, data: post };
    } catch (error: any) {
        console.error('Schedule Action Error:', error);
        return { success: false, error: error.message || 'Failed to schedule post' };
    }
}
export async function getScheduledPostsAction(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
        const posts = await getScheduledPosts();
        return { success: true, data: posts };
    } catch (error: any) {
        console.error('Get Scheduled Posts Action Error:', error);
        return { success: false, error: error.message || 'Failed to fetch posts' };
    }
}
