/**
 * Mock service for generating social post details (Stage 3).
 * Simplified - only handles platform selection and scheduling.
 */

import { SocialPost, MediaType } from '@/types/pipeline';

export async function generateSocialPost(
    selectedAngle: string,
    mediaType: MediaType,
    platforms: string[]
): Promise<SocialPost> {
    // Simulate brief processing
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        platforms,
        scheduledTime: new Date(Date.now() + 3600000), // 1 hour from now
    };
}
