import { MediaContent } from '@/types/pipeline';

export interface LinkedInCredentials {
    accessToken: string;
    personUrn: string;
}

export async function postToLinkedIn(content: MediaContent, credentials: LinkedInCredentials): Promise<void> {
    // This is a simplified text-share implementation.
    const postBody = {
        author: credentials.personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
            'com.linkedin.ugc.ShareContent': {
                shareCommentary: {
                    text: `${content.caption}\n\n${content.hashtags.map(t => '#' + t).join(' ')}`
                },
                shareMediaCategory: 'NONE'
            }
        },
        visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
    };

    try {
        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify(postBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || response.statusText);
        }

        console.log('Successfully posted to LinkedIn');

    } catch (error: any) {
        console.error('LinkedIn Post Error:', error);
        throw new Error(`LinkedIn API Error: ${error.message}`);
    }
}
