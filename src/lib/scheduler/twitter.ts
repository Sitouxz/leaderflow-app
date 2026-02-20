import { MediaContent } from '@/types/pipeline';

// We need to install 'twitter-api-v2' package
// npm install twitter-api-v2

export interface TwitterCredentials {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
}

export async function postToTwitter(content: MediaContent, credentials: TwitterCredentials): Promise<void> {
    try {
        // Dynamic import to allow build even if package is missing initially
        const { TwitterApi } = await import('twitter-api-v2');

        const client = new TwitterApi({
            appKey: credentials.apiKey,
            appSecret: credentials.apiSecret,
            accessToken: credentials.accessToken,
            accessSecret: credentials.accessSecret,
        });

        // Simple text tweet for v2 Free Tier
        const tweetText = `${content.caption}\n\n${content.hashtags.map(t => '#' + t).join(' ')}`;

        await client.v2.tweet(tweetText);
        console.log('Successfully posted to Twitter');

    } catch (error: any) {
        console.error('Twitter Post Error:', error);
        throw new Error(`Twitter API Error: ${error.message}`);
    }
}
