import { prisma, withRetry } from '@/lib/prisma';
import { BrandProfile } from '@prisma/client';

export type BrandProfileData = Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Get the single brand profile for the user.
 * Creates a default one if it doesn't exist.
 */
export async function getBrandProfile(): Promise<BrandProfile> {
    try {
        const profile = await withRetry(() => prisma.brandProfile.findFirst());

        if (!profile) {
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
        console.error('[BrandService] Failed to fetch brand profile:', error.message);
        throw error; // Let the caller handle the failure (e.g., show error state)
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
