import { MediaContent } from '@/types/pipeline';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface InstagramCredentials {
    accessToken: string;
    instagramAccountId: string; // The Instagram Business Account ID
}

async function handleBase64Image(imageUrl: string): Promise<string> {
    if (!imageUrl.startsWith('data:image')) {
        return imageUrl;
    }

    // Extract base64 data
    const matches = imageUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image string');
    }

    const ext = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    // Create unique filename
    const filename = `ig-${crypto.randomUUID()}.${ext}`;
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    // Construct public URL
    // NOTE: In production/tunneling, NEXT_PUBLIC_APP_URL must be set to the public domain
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const publicUrl = `${appUrl}/uploads/${filename}`;

    console.log(`[Instagram] Converted base64 to file: ${publicUrl}`);
    return publicUrl;
}

export async function postToInstagram(content: MediaContent, credentials: InstagramCredentials): Promise<void> {
    const API_VERSION = 'v19.0';
    const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

    try {
        // Step 0: Handle Image URL (Convert base64 if needed)
        const imageUrl = await handleBase64Image(content.imageUrl);

        // Step 1: Create Media Container
        // Instagram Graph API requires the image URL to be publicly accessible
        const createMediaUrl = `${BASE_URL}/${credentials.instagramAccountId}/media`;
        
        // Construct caption with hashtags
        const fullCaption = `${content.caption}\n\n${content.hashtags.map(t => '#' + t).join(' ')}`;

        const createParams = new URLSearchParams({
            image_url: imageUrl,
            caption: fullCaption,
            access_token: credentials.accessToken
        });

        // Add media_type if video (future proofing, though type says 'image' mostly)
        // if (content.type === 'video') ...

        console.log('[Instagram] Creating media container...');
        const createResponse = await fetch(`${createMediaUrl}?${createParams.toString()}`, {
            method: 'POST'
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json();
            throw new Error(`Create Media Error: ${errorData.error?.message || createResponse.statusText}`);
        }

        const createData = await createResponse.json();
        const creationId = createData.id;

        if (!creationId) {
            throw new Error('Failed to get media creation ID');
        }

        console.log(`[Instagram] Media container created: ${creationId}`);

        // Step 2: Publish Media
        // Sometimes it takes a moment for the container to be ready, but usually for images it's fast.
        // For videos, we might need to poll status. For this tutorial, we assume image and immediate publish.
        
        const publishUrl = `${BASE_URL}/${credentials.instagramAccountId}/media_publish`;
        const publishParams = new URLSearchParams({
            creation_id: creationId,
            access_token: credentials.accessToken
        });

        console.log('[Instagram] Publishing media...');
        const publishResponse = await fetch(`${publishUrl}?${publishParams.toString()}`, {
            method: 'POST'
        });

        if (!publishResponse.ok) {
            const errorData = await publishResponse.json();
            throw new Error(`Publish Media Error: ${errorData.error?.message || publishResponse.statusText}`);
        }

        const publishData = await publishResponse.json();
        console.log(`[Instagram] Successfully posted. Media ID: ${publishData.id}`);

    } catch (error: any) {
        console.error('Instagram Post Error:', error);
        throw new Error(`Instagram API Error: ${error.message}`);
    }
}
