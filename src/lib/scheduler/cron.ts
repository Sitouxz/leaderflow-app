import { getScheduledPosts, updatePostStatus } from './storage';
import { UploadPostService } from './uploadPostService';

export async function runScheduler() {
    console.log('[Scheduler] Checking for pending external posts...');

    try {
        const posts = await getScheduledPosts();

        // Check external job status
        if (process.env.UPLOAD_POST_API_KEY) {
            const externalPosts = posts.filter(post => post.status === 'pending' && post.externalJobId);
            if (externalPosts.length > 0) {
                console.log(`[Scheduler] Checking status for ${externalPosts.length} external jobs...`);
                try {
                    const service = new UploadPostService({
                        apiKey: process.env.UPLOAD_POST_API_KEY,
                        username: process.env.UPLOAD_POST_USERNAME || ''
                    });
                    for (const post of externalPosts) {
                        try {
                            const statusData = await service.getJobStatus(post.externalJobId!);
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
                            console.error(`[Scheduler] Failed to check status for job ${post.externalJobId}: ${err.message}`);
                        }
                    }
                } catch (e) {
                    console.error('[Scheduler] Failed to initialize UploadPostService:', e);
                }
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
