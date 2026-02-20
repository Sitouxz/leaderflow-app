'use server';

import { getBrandProfile, updateBrandProfile, BrandProfileData } from '@/services/brandService';
import { revalidatePath } from 'next/cache';

export async function getBrandProfileAction() {
    try {
        const profile = await getBrandProfile();
        return { success: true, data: profile };
    } catch (error) {
        console.error('Failed to get brand profile:', error);
        return { success: false, error: 'Failed to load brand profile' };
    }
}

export async function saveBrandProfileAction(data: BrandProfileData) {
    try {
        const profile = await updateBrandProfile(data);
        revalidatePath('/');
        return { success: true, data: profile };
    } catch (error) {
        console.error('Failed to save brand profile:', error);
        return { success: false, error: 'Failed to save brand profile' };
    }
}
