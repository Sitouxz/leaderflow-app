import fs from 'fs';
import path from 'path';
import { MediaContent } from '@/types/pipeline';

const API_BASE_URL = 'https://api.upload-post.com/api';

export interface UploadPostConfig {
    apiKey: string;
    username: string;
}

export interface ScheduledJob {
    job_id: string;
    scheduled_date: string;
    post_type: string;
    profile_username: string;
    title: string;
    preview_url: string | null;
}

export interface SchedulePostResponse {
    success: boolean;
    job_id?: string;
    scheduled_date?: string;
    title?: string;
    caption?: string;
    error?: string;
}

export class UploadPostService {
    private apiKey: string;
    private username: string;
    private profileEnsured: boolean = false;

    constructor(config: UploadPostConfig) {
        this.apiKey = config.apiKey;
        this.username = config.username;
    }

    /**
     * Ensure the user profile exists on Upload-Post.
     * Creates it if it doesn't exist yet.
     */
    private async ensureUserProfile(): Promise<void> {
        if (this.profileEnsured) return;

        try {
            // Try to create the user profile
            const response = await fetch(`${API_BASE_URL}/uploadposts/users`, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: this.username }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`[UploadPost] User profile created/verified for: ${this.username}`);
            } else if (response.status === 409 || (data.message && data.message.includes('already exists'))) {
                // Profile already exists - that's fine
                console.log(`[UploadPost] User profile already exists for: ${this.username}`);
            } else {
                console.warn(`[UploadPost] User profile check response:`, data);
            }

            this.profileEnsured = true;
        } catch (error) {
            console.warn('[UploadPost] Failed to ensure user profile, proceeding anyway:', error);
            // Don't block the upload; the profile might already exist
            this.profileEnsured = true;
        }
    }

    private getHeaders() {
        return {
            'Authorization': `Apikey ${this.apiKey}`,
        };
    }

    /**
     * Get status of a scheduled job
     */
    async getJobStatus(jobId: string): Promise<any> {
        return this.retry(async () => {
            const response = await fetch(`${API_BASE_URL}/uploadposts/status?job_id=${jobId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) throw new Error('401 Unauthorized');
                throw new Error(data.error || `Failed to get job status: ${response.status} ${response.statusText}`);
            }

            return data;
        });
    }

    /**
     * List all scheduled posts
     */
    async listScheduledPosts(): Promise<ScheduledJob[]> {
        return this.retry(async () => {
            const response = await fetch(`${API_BASE_URL}/uploadposts/schedule`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error('401 Unauthorized: Invalid API Key');
                throw new Error(`Failed to list scheduled posts: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        });
    }

    /**
     * Cancel a scheduled post
     */
    async cancelScheduledPost(jobId: string): Promise<void> {
        return this.retry(async () => {
            const response = await fetch(`${API_BASE_URL}/uploadposts/schedule/${jobId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                if (response.status === 404) throw new Error('404 Job not found');
                if (response.status === 401) throw new Error('401 Unauthorized');
                throw new Error(`Failed to cancel job: ${response.status} ${response.statusText}`);
            }
        });
    }

    /**
     * Update a scheduled post
     */
    async updateScheduledPost(jobId: string, updates: { scheduled_date?: string; title?: string; caption?: string }): Promise<SchedulePostResponse> {
        return this.retry(async () => {
            const response = await fetch(`${API_BASE_URL}/uploadposts/schedule/${jobId}`, {
                method: 'PATCH',
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404) {
                    throw new Error(`${response.status} ${data.error || response.statusText}`);
                }
                throw new Error(data.error || `Failed to update job: ${response.status} ${response.statusText}`);
            }

            return data;
        });
    }

    /**
     * Create a scheduled post by uploading content
     */
    async createScheduledPost(
        content: MediaContent,
        platforms: string[],
        scheduledDate: Date
    ): Promise<SchedulePostResponse> {
        // Validation
        if (!content.imageUrl) {
            throw new Error('Image URL is required for scheduling.');
        }

        // Ensure user profile exists before uploading
        await this.ensureUserProfile();

        return this.retry(async () => {
            const formData = new FormData();

            // Ensure scheduled date is at least 5 minutes in the future
            const minTime = new Date(Date.now() + 5 * 60 * 1000);
            let finalDate = scheduledDate;

            if (finalDate < minTime) {
                console.log(`[UploadPost] Adjusted schedule time to ${minTime.toISOString()} (min 5m buffer)`);
                finalDate = minTime;
            }

            // Add common fields
            // Use a much larger limit for title as some platforms (FB) use it as the main content
            const title = content.caption ? content.caption.substring(0, 1000) : 'New Post';
            formData.append('title', title);

            const fullCaption = `${content.caption}\n\n${content.hashtags.map(t => t.startsWith('#') ? t : '#' + t).join(' ')}`;
            formData.append('caption', fullCaption);

            console.log(`[UploadPost] Constructing payload - Title: "${title.substring(0, 30)}...", Caption: "${fullCaption.substring(0, 30)}..."`);
            const isoDate = finalDate.toISOString().split('.')[0] + 'Z';
            formData.append('scheduled_date', isoDate);
            formData.append('timezone', 'UTC');
            formData.append('user', this.username);

            // Add platforms
            platforms.forEach(platform => {
                formData.append('platform[]', platform);
            });

            // Handle file upload
            let endpoint = '';
            let fileField = '';

            if (content.type === 'video') {
                endpoint = '/upload_videos';
                fileField = 'video';
            } else {
                endpoint = '/upload_photos';
                fileField = 'photos[]';
            }

            console.log(`[UploadPost] Preparing upload to ${endpoint} with field '${fileField}'`);

            // Resolve file
            const fileData = await this.resolveFile(content.imageUrl);

            // Determine filename/extension
            let filename = content.type === 'video' ? 'upload.mp4' : 'upload.jpg';
            if (fileData.type) {
                const mimeToExt: Record<string, string> = {
                    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
                    'video/mp4': '.mp4', 'video/quicktime': '.mov',
                };
                const ext = mimeToExt[fileData.type];
                if (ext) filename = `upload${ext}`;
            }

            if (!fileData || fileData.size === 0) {
                console.warn('[UploadPost] File resolution returned empty blob. Trying to send URL directly.');
                if (content.imageUrl.startsWith('http')) {
                    formData.append('url', content.imageUrl);
                    if (content.type !== 'video') {
                        formData.append('photo_urls[]', content.imageUrl);
                    }
                } else {
                    throw new Error('Failed to resolve file and cannot send local URL.');
                }
            } else {
                formData.append(fileField, fileData, filename);
                // Try also 'photo' and 'photos' for better compatibility
                if (content.type !== 'video') {
                    formData.append('photo', fileData, filename);
                    formData.append('photos', fileData, filename);
                }
            }

            // If it's a photo, maybe the API expects photo_urls to be present even if empty?
            if (content.type !== 'video' && content.imageUrl.startsWith('http')) {
                formData.append('photo_urls[]', content.imageUrl);
            }

            console.log(`[UploadPost] Uploading ${fileData?.size || 0} bytes...`);

            let response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Apikey ${this.apiKey}`,
                },
                body: formData,
            });

            let data = await response.json();

            // Retry logic for 400 "Photo files or URLs are required"
            if (!response.ok && response.status === 400 &&
                (JSON.stringify(data).includes('Photo files or URLs are required') ||
                    JSON.stringify(data).includes('required'))) {

                console.warn('[UploadPost] 400 Error detected. Retrying with fallback strategies...');

                // Strategy 1: Try sending URL if available
                if (content.imageUrl.startsWith('http')) {
                    console.log('[UploadPost] Retrying with URL upload...');
                    const retryFormData = new FormData();
                    retryFormData.append('title', title);
                    retryFormData.append('caption', `${content.caption}\n\n${content.hashtags.map(t => t.startsWith('#') ? t : '#' + t).join(' ')}`);
                    retryFormData.append('scheduled_date', isoDate);
                    retryFormData.append('timezone', 'UTC');
                    retryFormData.append('user', this.username);
                    platforms.forEach(p => retryFormData.append('platform[]', p));
                    retryFormData.append('url', content.imageUrl);
                    if (content.type !== 'video') retryFormData.append('photo_urls[]', content.imageUrl);

                    const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Apikey ${this.apiKey}` },
                        body: retryFormData
                    });

                    if (retryResponse.ok) return await retryResponse.json();
                }

                // Strategy 2: Try singular 'file' field
                if (fileField === 'photos[]' && fileData && fileData.size > 0) {
                    console.log('[UploadPost] Retrying with singular "file" field...');
                    const retryFormData = new FormData();
                    retryFormData.append('title', title);
                    retryFormData.append('caption', `${content.caption}\n\n${content.hashtags.map(t => t.startsWith('#') ? t : '#' + t).join(' ')}`);
                    retryFormData.append('scheduled_date', isoDate);
                    retryFormData.append('timezone', 'UTC');
                    retryFormData.append('user', this.username);
                    platforms.forEach(p => retryFormData.append('platform[]', p));
                    retryFormData.append('file', fileData, filename);

                    const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Apikey ${this.apiKey}` },
                        body: retryFormData
                    });

                    if (retryResponse.ok) return await retryResponse.json();
                }

                // Strategy 3: Try 'photo' and 'photos' explicitly
                if (content.type !== 'video' && fileData && fileData.size > 0) {
                    console.log('[UploadPost] Retrying with "photo" and "photos" fields...');
                    const retryFormData = new FormData();
                    retryFormData.append('title', title);
                    retryFormData.append('caption', `${content.caption}\n\n${content.hashtags.map(t => t.startsWith('#') ? t : '#' + t).join(' ')}`);
                    retryFormData.append('scheduled_date', isoDate);
                    retryFormData.append('timezone', 'UTC');
                    retryFormData.append('user', this.username);
                    platforms.forEach(p => retryFormData.append('platform[]', p));
                    retryFormData.append('photo', fileData, filename);
                    retryFormData.append('photos', fileData, filename);

                    const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Apikey ${this.apiKey}` },
                        body: retryFormData
                    });

                    if (retryResponse.ok) return await retryResponse.json();

                    response = retryResponse;
                    data = await retryResponse.json();
                }
            }

            if (!response.ok) {
                console.error('Upload-Post API Error:', { status: response.status, data });
                const errorMessage = data.error || data.message || JSON.stringify(data) || response.statusText;
                throw new Error(`${response.status} ${errorMessage}`);
            }

            return data;
        });
    }

    private async resolveFile(url: string): Promise<Blob> {
        if (url.startsWith('data:')) {
            const matches = url.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) throw new Error('Invalid data URI format');
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            return new Blob([buffer], { type: mimeType });
        }

        if (url.startsWith('http') && url.includes('/uploads/')) {
            try {
                const urlObj = new URL(url);
                const filename = path.basename(urlObj.pathname);
                const localPath = path.join(process.cwd(), 'public', 'uploads', filename);

                if (fs.existsSync(localPath)) {
                    const buffer = await fs.promises.readFile(localPath);
                    const ext = path.extname(filename).toLowerCase();
                    const mimeMap: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4' };
                    return new Blob([buffer], { type: mimeMap[ext] || 'application/octet-stream' });
                }
            } catch (e) {
                console.warn('Failed to resolve local path, falling back to fetch', e);
            }
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image from ${url}`);
        return await response.blob();
    }

    private async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
        try {
            return await fn();
        } catch (error: any) {
            if (retries === 0) throw error;
            if (error.message.includes('401') || error.message.includes('400') || error.message.includes('404')) {
                throw error;
            }
            console.warn(`Retrying operation... attempts left: ${retries}. Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retry(fn, retries - 1, delay * 2);
        }
    }
}
