import { getScheduledPosts, updatePostStatus, getAndRefreshSocialAccount } from './storage';
import { postToTwitter } from './twitter';
import { postToLinkedIn } from './linkedin';
import { postToInstagram } from './instagram';
import { UploadPostService } from './uploadPostService';

export async function runScheduler() {
    console.log('[Scheduler] Checking for pending posts...');

    try {
        const posts = await getScheduledPosts();
        const now = new Date();

        // 1. Check external job status
        if (process.env.UPLOAD_POST_API_KEY) {
            const externalPosts = posts.filter(post => post.status === 'pending' && post.externalJobId);
            if (externalPosts.length > 0) {
                console.log(`[Scheduler] Checking status for ${externalPosts.length} external jobs...`);
                try {
                    const service = new UploadPostService({ apiKey: process.env.UPLOAD_POST_API_KEY });
                    for (const post of externalPosts) {
                        try {
                            const statusData = await service.getJobStatus(post.externalJobId!);
                            // The API might return different status strings. Adjust as needed.
                            const status = statusData.status?.toLowerCase();
                            
                            if (status === 'published' || status === 'completed' || status === 'success') {
                                await updatePostStatus(post.id, 'success');
                                console.log(`[Scheduler] External job ${post.externalJobId} completed.`);
                            } else if (status === 'failed' || status === 'error') {
                                const errorMsg = statusData.error || 'External job failed';
                                await updatePostStatus(post.id, 'failed', errorMsg);
                                console.log(`[Scheduler] External job ${post.externalJobId} failed: ${errorMsg}`);
                            }
                        } catch (err: any) {
                            // Don't log full error to avoid clutter, just the message
                            console.error(`[Scheduler] Failed to check status for job ${post.externalJobId}: ${err.message}`);
                        }
                    }
                } catch (e) {
                    console.error('[Scheduler] Failed to initialize UploadPostService:', e);
                }
            }
        }

        // 2. Process local jobs
        // Find pending posts that are due
        // Exclude posts handled by external scheduler (Upload-Post)
        const duePosts = posts.filter(post =>
            post.status === 'pending' &&
            !post.externalJobId &&
            new Date(post.scheduledTime) <= now
        );

        console.log(`[Scheduler] Found ${duePosts.length} due posts.`);

        for (const post of duePosts) {
            console.log(`[Scheduler] Processing post ${post.id}...`);
            const platformErrors: string[] = [];

            // Post to each platform
            for (const platform of post.platforms) {
                try {
                    if (!post.brandId) {
                        throw new Error(`Post ${post.id} has no brand ID`);
                    }
                    const account = await getAndRefreshSocialAccount(post.brandId, platform);

                    if (!account) {
                        throw new Error(`No connected account found for ${platform}`);
                    }

                    if (platform === 'twitter') {
                        await postToTwitter(post.content, {
                            apiKey: process.env.TWITTER_API_KEY!, // App level
                            apiSecret: process.env.TWITTER_API_SECRET!, // App level
                            accessToken: account.accessToken,
                            accessSecret: account.tokenSecret || '', // Not used in OAuth 2.0 but interface requires it
                        });
                    } else if (platform === 'linkedin') {
                        await postToLinkedIn(post.content, {
                            accessToken: account.accessToken,
                            personUrn: account.refreshToken || '', // We stored URN here
                        });
                    } else if (platform === 'instagram') {
                        await postToInstagram(post.content, {
                            accessToken: account.accessToken,
                            instagramAccountId: account.refreshToken || '', // Stored here
                        });
                    }
                } catch (error: any) {
                    console.error(`[Scheduler] Failed to post to ${platform}:`, error);
                    platformErrors.push(`${platform}: ${error.message}`);
                }
            }

            // Update status
            if (platformErrors.length === 0) {
                await updatePostStatus(post.id, 'success');
                console.log(`[Scheduler] Post ${post.id} completed successfully.`);
            } else {
                await updatePostStatus(post.id, 'failed', platformErrors.join('; '));
                console.log(`[Scheduler] Post ${post.id} failed.`);
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error running scheduler:', error);
    }
}

// Global interval reference to prevent multiple schedulers in dev hot-reload
let schedulerInterval: NodeJS.Timeout | null = null;

declare global {
    var schedulerInterval: NodeJS.Timeout | null | undefined;
}

export function initScheduler() {
    if (global.schedulerInterval) {
        return; // Already running
    }

    console.log('[Scheduler] Initializing poller...');

    // Run immediately on start
    runScheduler();

    // Then run every minute
    schedulerInterval = setInterval(runScheduler, 60 * 1000);

    // Store in global to survive hot reloads (in dev) roughly
    // @ts-ignore
    global.schedulerInterval = schedulerInterval;
}
