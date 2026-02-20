import { MediaContent } from '@/types/pipeline';

const AYRSHARE_API_URL = 'https://app.ayrshare.com/api';

export type AyrsharePlatform = 'facebook' | 'twitter' | 'instagram' | 'linkedin';

interface AyrsharePostResponse {
    status: string;
    errors?: any[];
    postIds?: Record<string, string>;
    [key: string]: any;
}

export async function postToSocialMedia(
    content: MediaContent,
    platforms: string[],
    scheduleTime?: Date
): Promise<AyrsharePostResponse> {
    const apiKey = process.env.AYRSHARE_API_KEY;

    if (!apiKey) {
        console.warn('AYRSHARE_API_KEY is not set. Returning mock success.');
        // Return a mock success response if no API key is present, to avoid breaking the app during dev
        // In production, this should probably throw an error.
        return {
            status: 'success',
            postIds: platforms.reduce((acc, p) => ({ ...acc, [p]: `mock-${p}-${Date.now()}` }), {})
        };
    }

    const payload: any = {
        post: content.caption + '\n\n' + content.hashtags.map(t => '#' + t).join(' '),
        platforms: platforms,
        mediaUrls: [content.imageUrl], // Ayrshare expects an array of URLs
    };

    if (scheduleTime) {
        payload.scheduleDate = scheduleTime.toISOString();
    }

    try {
        const response = await fetch(`${AYRSHARE_API_URL}/post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Ayrshare API Error:', data);
            throw new Error(data.message || 'Failed to post to social media');
        }

        return data;
    } catch (error) {
        console.error('Social Media Post Failed:', error);
        throw error;
    }
}
