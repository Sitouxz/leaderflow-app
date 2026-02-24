import { prisma, withRetry } from '@/lib/prisma';
import { BrandProfile } from '@prisma/client';

export type BrandProfileData = Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Get the single brand profile for the user.
 * Creates a default one if it doesn't exist.
 */
export async function getBrandProfile(): Promise<BrandProfile> {
    const defaultProfile: BrandProfile = {
        id: 'default-brand',
        companyName: '',
        industry: '',
        targetAudience: '',
        toneOfVoice: 'Professional',
        keywords: '',
        updatedAt: new Date(),
    };

    try {
        // Use withRetry to handle transient connection issues
        // If it still fails after retries, it will throw, and we catch it below
        const profile = await withRetry(() => prisma.brandProfile.findFirst());

        if (!profile) {
            // Try to create a new profile if none exists
            // We also retry this operation
            return await withRetry(() => prisma.brandProfile.create({
                data: {
                    companyName: '',
                    industry: '',
                    targetAudience: '',
                    toneOfVoice: 'Professional',
                    keywords: '',
                }
            }));
        }

        return profile;
    } catch (error: any) {
        console.error('[BrandService] Failed to fetch brand profile, using defaults:', error.message);
        // Ensure we return a valid profile even if DB is down
        return defaultProfile;
    }
}

/**
 * Update the brand profile.
 * If ID is provided, updates that specific one (though we enforce singleton logically).
 * If no ID, updates the first found or creates new.
 */
export async function updateBrandProfile(data: Partial<BrandProfileData>): Promise<BrandProfile> {
    try {
        const existing = await withRetry(() => prisma.brandProfile.findFirst());

        if (existing) {
            return await withRetry(() => prisma.brandProfile.update({
                where: { id: existing.id },
                data,
            }));
        } else {
            return await withRetry(() => prisma.brandProfile.create({
                data: {
                    companyName: data.companyName || '',
                    industry: data.industry || '',
                    targetAudience: data.targetAudience || '',
                    toneOfVoice: data.toneOfVoice || 'Professional',
                    keywords: data.keywords || '',
                }
            }));
        }
    } catch (error) {
        console.error('[BrandService] Failed to update brand profile:', error);
        throw new Error('Database connection failed. Please check your Supabase settings.');
    }
}
