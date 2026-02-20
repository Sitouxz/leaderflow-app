import { prisma } from '@/lib/prisma';
import { BrandProfile } from '@prisma/client';

export type BrandProfileData = Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Get the single brand profile for the user.
 * Creates a default one if it doesn't exist.
 */
export async function getBrandProfile(): Promise<BrandProfile> {
    const profile = await prisma.brandProfile.findFirst();

    if (!profile) {
        return await prisma.brandProfile.create({
            data: {
                companyName: '',
                industry: '',
                targetAudience: '',
                toneOfVoice: 'Professional',
                keywords: '',
            }
        });
    }

    return profile;
}

/**
 * Update the brand profile.
 * If ID is provided, updates that specific one (though we enforce singleton logically).
 * If no ID, updates the first found or creates new.
 */
export async function updateBrandProfile(data: Partial<BrandProfileData>): Promise<BrandProfile> {
    const existing = await prisma.brandProfile.findFirst();

    if (existing) {
        return await prisma.brandProfile.update({
            where: { id: existing.id },
            data,
        });
    } else {
        return await prisma.brandProfile.create({
            data: {
                companyName: data.companyName || '',
                industry: data.industry || '',
                targetAudience: data.targetAudience || '',
                toneOfVoice: data.toneOfVoice || 'Professional',
                keywords: data.keywords || '',
            }
        });
    }
}
