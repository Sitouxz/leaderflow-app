/**
 * OpenAI service for generating strategic angles and voice transcription.
 * Uses GPT-5 for thought leadership content generation.
 * Uses Whisper for voice-to-text transcription.
 */

import { AI_CONFIG, getOpenAIKey } from './aiConfig';
import { generateStrategicAngles as mockGenerateAngles, GeneratedAngle, AngleType, ANGLE_TYPE_CONFIG } from './mockOpenAI';
import {
    generateStrategicAnglesAction,
    generateVideoBriefAction,
    generateSocialContentAction,
    generateImageGenPromptAction
} from '@/actions/openai';

export { ANGLE_TYPE_CONFIG };
export type { GeneratedAngle, AngleType };

interface WhisperResponse {
    text: string;
}

/**
 * Transcribe audio using OpenAI Whisper
 * (Kept as client-side fetch for now, can be moved to server action if needed)
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    const apiKey = getOpenAIKey();

    if (!apiKey) {
        console.log('[Whisper] No API key configured');
        throw new Error('OpenAI API key not configured');
    }

    try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', AI_CONFIG.openai.whisperModel);
        formData.append('language', 'en');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Whisper] API error:', response.status, errorData);
            throw new Error(`Whisper API error: ${response.status}`);
        }

        const data: WhisperResponse = await response.json();
        return data.text || '';
    } catch (error) {
        console.error('[Whisper] Transcription error:', error);
        throw error;
    }
}

/**
 * Generate strategic angles using OpenAI GPT-5 (via Server Action)
 */
export async function generateStrategicAngles(rawInput: string): Promise<GeneratedAngle[]> {
    const apiKey = getOpenAIKey();

    // Fall back to mock if no API key configured
    if (!apiKey) {
        console.log('[OpenAI] No API key configured, using mock service');
        return mockGenerateAngles(rawInput);
    }

    try {
        console.log('[OpenAI] Calling server action for angles...');
        const result = await generateStrategicAnglesAction(apiKey, rawInput);

        if (!result.success || !result.data) {
            console.error('[OpenAI] Server action failed:', result.error);
            // Fall back to mock on API error if configured
            if (AI_CONFIG.useMockFallback) {
                console.log('[OpenAI] Falling back to mock service');
                return mockGenerateAngles(rawInput);
            }
            throw new Error(result.error || 'Unknown error');
        }

        return result.data;
    } catch (error) {
        console.error('[OpenAI] Service error:', error);

        // Fall back to mock on any error if configured
        if (AI_CONFIG.useMockFallback) {
            console.log('[OpenAI] Falling back to mock service due to error');
            return mockGenerateAngles(rawInput);
        }

        throw error;
    }
}

/**
 * Generate video brief using GPT-5 (via Server Action)
 */
export async function generateVideoBrief(angle: string): Promise<string> {
    const apiKey = getOpenAIKey();

    if (!apiKey) {
        return getDefaultVideoBrief(angle);
    }

    try {
        const result = await generateVideoBriefAction(apiKey, angle);
        if (!result.success || !result.data) {
            return getDefaultVideoBrief(angle);
        }
        return result.data;
    } catch {
        return getDefaultVideoBrief(angle);
    }
}

function getDefaultVideoBrief(angle: string): string {
    return `# Video Production Brief

## Content Title
${angle}

## Target Duration
2-3 minutes

## Key Messages
1. Opening hook - capture attention in first 5 seconds
2. Main insight - core message from the angle
3. Supporting points - 2-3 examples or data points
4. Call to action - engagement prompt

## Visual Style
- Professional, clean aesthetic
- Brand colors: Cyan (#00eaff) accents on dark background
- Modern typography overlays
- Smooth transitions

## B-Roll Suggestions
- Office/workspace footage
- Team collaboration scenes
- Technology/innovation imagery

## Audio
- Background music: Inspiring, upbeat
- Clear voiceover narration
- Sound design for transitions

## Deliverables
- 16:9 ratio for YouTube/LinkedIn
- 9:16 ratio for Stories/Reels
- Thumbnail image
`;
}

/**
 * Test OpenAI API connection
 * (Client-side test, susceptible to CORS if checking models endpoint directly. 
 *  We might want to move this too, but leaving for now as user didn't complain about test)
 */
export async function testOpenAIConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = getOpenAIKey();

    if (!apiKey) {
        return { success: false, message: 'No API key configured' };
    }

    try {
        // Simple client-side check. If CORS fails here too, we should move it.
        // Assuming models endpoint might be CORS restricted too.
        // Let's try calling a simple server action instead if this fails? 
        // For now, leaving as is to minimize changes scope, but noting it.
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.ok) {
            return { success: true, message: 'Connected successfully' };
        } else {
            const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
            return { success: false, message: error.error?.message || `Error: ${response.status}` };
        }
    } catch (error) {
        return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

/**
 * Generate social media content (caption, description, hashtags) using GPT-5 (via Server Action)
 */
export interface SocialContent {
    caption: string;
    description: string;
    hashtags: string[];
}

export async function generateSocialContent(
    angle: string,
    mediaType: string
): Promise<SocialContent> {
    const apiKey = getOpenAIKey();

    // Default fallback content
    const defaultContent: SocialContent = {
        caption: `💡 ${angle}\n\nThe best leaders know that real impact comes from sharing insights that matter.\n\n💬 What's your take? Share your thoughts below!`,
        description: 'Leadership insights for professionals.',
        hashtags: ['#Leadership', '#ThoughtLeadership', '#BusinessStrategy', '#ExecutiveInsights'],
    };

    if (!apiKey) {
        console.log('[OpenAI] No API key, using default content');
        return defaultContent;
    }

    try {
        const result = await generateSocialContentAction(apiKey, angle, mediaType);

        if (!result.success || !result.data) {
            console.error('[OpenAI] Social content action failed:', result.error);
            return defaultContent;
        }

        return result.data;
    } catch (error) {
        console.error('[OpenAI] Error generating social content:', error);
        return defaultContent;
    }
}

/**
 * Generate a high-quality image prompt using GPT-5 (via Server Action)
 */
export async function generateImageGenPrompt(
    angle: string,
    mediaType: string
): Promise<string> {
    const apiKey = getOpenAIKey();

    // Default fallback prompt if no API key
    const defaultPrompt = `Professional business visual about "${angle}". Dark gradient background, cyan accents, modern minimalist style. High quality, 4k.`;

    if (!apiKey) {
        console.log('[OpenAI] No API key, using default image prompt');
        return defaultPrompt;
    }

    try {
        const result = await generateImageGenPromptAction(apiKey, angle, mediaType);
        console.log('[OpenAI Client] generateImageGenPromptAction result:', result);

        if (!result.success || !result.data) {
            console.error('[OpenAI] Image prompt action failed:', result.error || 'Empty data returned');
            return defaultPrompt;
        }

        return result.data;

    } catch (error) {
        console.error('[OpenAI] Error generating image prompt:', error);
        return defaultPrompt;
    }
}
