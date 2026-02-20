'use server'

import * as OpenAIService from '@/services/openaiService';
import { AngleType, GeneratedAngle, SocialContent } from '@/types/pipeline';
import { getBrandProfile } from '@/services/brandService';

// ----------------------------------------------------------------------
// Server Actions
// ----------------------------------------------------------------------

/**
 * Action to generate strategic angles from raw input
 */
export async function generateStrategicAnglesAction(
    apiKey: string,
    rawInput: string
): Promise<{ success: boolean; data?: GeneratedAngle[]; error?: string }> {
    try {
        const brandProfile = await getBrandProfile();
        const angles = await OpenAIService.generateStrategicAnglesInternal(apiKey, rawInput, brandProfile);
        return { success: true, data: angles };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Action to generate a video production brief
 */
export async function generateVideoBriefAction(
    apiKey: string,
    angle: string
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const brandProfile = await getBrandProfile();
        const brief = await OpenAIService.generateVideoBriefInternal(apiKey, angle, brandProfile);
        return { success: true, data: brief };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Action to generate social content (caption, etc.)
 */
export async function generateSocialContentAction(
    apiKey: string,
    angle: string,
    mediaType: string
): Promise<{ success: boolean; data?: SocialContent; error?: string }> {
    try {
        const brandProfile = await getBrandProfile();
        const content = await OpenAIService.generateSocialContentInternal(apiKey, angle, mediaType, brandProfile);
        return { success: true, data: content };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Action to generate an image generation prompt
 */
export async function generateImageGenPromptAction(
    apiKey: string,
    angle: string,
    mediaType: string
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const brandProfile = await getBrandProfile();
        const prompt = await OpenAIService.generateImageGenPromptInternal(apiKey, angle, mediaType, brandProfile);
        return { success: true, data: prompt };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Action to generate carousel slide prompts
 */
export async function generateCarouselPromptsAction(
    apiKey: string,
    angle: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
        const brandProfile = await getBrandProfile();
        const prompts = await OpenAIService.generateCarouselPromptsInternal(apiKey, angle, brandProfile);
        return { success: true, data: prompts };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

