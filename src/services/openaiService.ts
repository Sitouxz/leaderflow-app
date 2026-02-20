/**
 * OpenAI service for generating strategic angles and voice transcription.
 * Uses GPT-4o for thought leadership content generation.
 * Uses Whisper for voice-to-text transcription.
 */

import { AI_CONFIG, getOpenAIKey } from './aiConfig';
import { GeneratedAngle, AngleType, SocialContent } from '@/types/pipeline';
import { BrandProfile } from '@prisma/client';
import * as Prompts from '@/lib/prompts';

// ----------------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------------

export interface OpenAIRequestPayload {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    response_format?: { type: 'json_object' };
    temperature?: number;
    max_completion_tokens?: number;
}

export interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export interface WhisperResponse {
    text: string;
}

// ----------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------

/**
 * Helper to call OpenAI API with standard error handling
 */
export async function callOpenAI(
    apiKey: string,
    payload: OpenAIRequestPayload
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[OpenAI Service] API error:', response.status, errorText);
            return { success: false, error: `OpenAI API error: ${response.status}` };
        }

        const data: OpenAIResponse = await response.json();
        return { success: true, data: data.choices[0]?.message?.content };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[OpenAI Service] Service error:', error);
        return { success: false, error: message };
    }
}

/**
 * Format brand context for AI prompts
 */
export function formatBrandContext(profile: BrandProfile | null): string {
    if (!profile) return '';

    const parts = [];
    if (profile.companyName) parts.push(`Brand Name: ${profile.companyName}`);
    if (profile.industry) parts.push(`Industry: ${profile.industry}`);
    if (profile.targetAudience) parts.push(`Target Audience: ${profile.targetAudience}`);
    if (profile.toneOfVoice) parts.push(`Tone of Voice: ${profile.toneOfVoice}`);
    if (profile.keywords) parts.push(`Key Topics/Themes: ${profile.keywords}`);

    if (parts.length === 0) return '';

    return `\n\nBRAND CONTEXT (IMPORTANT - TAILOR OUTPUT TO THIS):\n${parts.join('\n')}`;
}

/**
 * Parse angles from AI response
 */
function parseAnglesResponse(content: string): GeneratedAngle[] {
    try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('No JSON array found in response');

        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) throw new Error('Response is not an array');

        const validTypes: AngleType[] = ['deep_dive', 'strategic_framework', 'provocative', 'tactical', 'visionary'];

        return parsed.slice(0, 4).map((item: any) => ({
            title: String(item.title || 'Untitled Angle').slice(0, 80),
            type: (validTypes.includes(item.type) ? item.type : 'deep_dive') as AngleType,
            description: String(item.description || 'Strategic insight for leaders').slice(0, 150),
        }));
    } catch (error) {
        console.error('[OpenAI Service] Failed to parse angles:', error);
        throw new Error('Failed to parse AI response');
    }
}

// ----------------------------------------------------------------------
// Core Logic
// ----------------------------------------------------------------------

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
 * Internal logic for generating strategic angles
 */
export async function generateStrategicAnglesInternal(
    apiKey: string,
    rawInput: string,
    brandProfile: BrandProfile | null
): Promise<GeneratedAngle[]> {
    const brandContext = formatBrandContext(brandProfile);

    const result = await callOpenAI(apiKey, {
        model: AI_CONFIG.openai.chatModel,
        messages: [
            { role: 'system', content: Prompts.STRATEGIC_ANGLES_SYSTEM_PROMPT + brandContext },
            { role: 'user', content: Prompts.STRATEGIC_ANGLES_USER_PROMPT_TEMPLATE.replace('{INPUT}', rawInput) },
        ],
        max_completion_tokens: 4000,
    });

    if (!result.success || !result.data) {
        throw new Error(result.error || 'No data returned from OpenAI');
    }

    return parseAnglesResponse(result.data);
}

/**
 * Internal logic for generating video briefs
 */
export async function generateVideoBriefInternal(
    apiKey: string,
    angle: string,
    brandProfile: BrandProfile | null
): Promise<string> {
    const brandContext = formatBrandContext(brandProfile);

    const result = await callOpenAI(apiKey, {
        model: AI_CONFIG.openai.chatModel,
        messages: [
            { role: 'system', content: Prompts.VIDEO_BRIEF_SYSTEM_PROMPT + brandContext },
            { role: 'user', content: Prompts.VIDEO_BRIEF_USER_PROMPT_TEMPLATE.replace('{ANGLE}', angle) }
        ],
        max_completion_tokens: 1500,
    });

    if (!result.success || !result.data) {
        return getDefaultVideoBrief(angle);
    }
    return result.data;
}

/**
 * Internal logic for generating social content
 */
export async function generateSocialContentInternal(
    apiKey: string,
    angle: string,
    mediaType: string,
    brandProfile: BrandProfile | null
): Promise<SocialContent> {
    const brandContext = formatBrandContext(brandProfile);

    const result = await callOpenAI(apiKey, {
        model: AI_CONFIG.openai.chatModel,
        messages: [
            { role: 'system', content: Prompts.SOCIAL_CONTENT_PROMPT + brandContext },
            { role: 'user', content: `Topic: "${angle}"\nMedia type: ${mediaType}` }
        ],
        max_completion_tokens: 2000,
    });

    if (!result.success || !result.data) {
        throw new Error(result.error || 'No data returned from OpenAI');
    }

    try {
        const cleanContent = result.data.replace(/```json\n?|\n?```/g, '');
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            caption: parsed.caption || '',
            description: parsed.description || '',
            hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        };
    } catch (error: any) {
        console.error('[OpenAI Service] Failed to parse social content:', error);
        throw new Error('Failed to parse AI response');
    }
}

/**
 * Internal logic for generating image prompts
 */
export async function generateImageGenPromptInternal(
    apiKey: string,
    angle: string,
    mediaType: string,
    brandProfile: BrandProfile | null
): Promise<string> {
    const brandContext = formatBrandContext(brandProfile);

    const promptUser = mediaType === 'infographic'
        ? `Create a prompt for a "conceptual data visualization" or "editorial infographic" about: "${angle}".
           Style: Avoid flat vectors or boring charts. Think "dimensional data art", "physical representation of information", "woven structures representing networks", or "macro photography of a complex physical model".
           Focus on texture, visual hierarchy, and the "flow of ideas" rather than literal text.
           Important: Use minimal text; focus on the visual metaphor of the data.`
        : `Create a cinematic, realistic image generation prompt for a ${mediaType} about: "${angle}". 
    
           Context: A premium thought-leadership visual for an executive audience. 
           Style: Moody, authentic, high-contrast, avoiding "corporate stock" clichés. Focus on the raw texture of the environment and the gravity of the thought.`;

    const result = await callOpenAI(apiKey, {
        model: AI_CONFIG.openai.chatModel,
        messages: [
            { role: 'system', content: Prompts.IMAGE_PROMPT_SYSTEM_PROMPT + brandContext },
            { role: 'user', content: promptUser }
        ],
        max_completion_tokens: 500,
    });

    if (!result.success || !result.data) {
        throw new Error(result.error || 'No data returned from OpenAI');
    }
    return result.data;
}

/**
 * Internal logic for generating carousel prompts
 */
export async function generateCarouselPromptsInternal(
    apiKey: string,
    angle: string,
    brandProfile: BrandProfile | null
): Promise<string[]> {
    const brandContext = formatBrandContext(brandProfile);

    const result = await callOpenAI(apiKey, {
        model: AI_CONFIG.openai.chatModel,
        messages: [
            { role: 'system', content: Prompts.IMAGE_PROMPT_SYSTEM_PROMPT + brandContext },
            { role: 'user', content: Prompts.CAROUSEL_PROMPT_TEMPLATE.replace('{ANGLE}', angle) }
        ],
        max_completion_tokens: 1000,
    });

    if (!result.success || !result.data) {
        throw new Error(result.error || 'No data returned from OpenAI');
    }

    try {
        const cleanContent = result.data.replace(/```json\n?|\n?```/g, '');
        const prompts = JSON.parse(cleanContent);
        if (!Array.isArray(prompts) || prompts.length === 0) {
            throw new Error('Failed to parse prompts array');
        }
        return prompts.slice(0, 3);
    } catch (error: any) {
        console.error('[OpenAI Service] Failed to parse carousel prompts:', error);
        throw new Error('Failed to parse AI response');
    }
}

// ----------------------------------------------------------------------
// Wrappers (Used by Client)
// ----------------------------------------------------------------------

/**
 * These wrappers call server actions to ensure API keys remain secure.
 */

export async function generateStrategicAngles(rawInput: string): Promise<GeneratedAngle[]> {
    const { generateStrategicAnglesAction } = await import('@/actions/openai');
    const apiKey = getOpenAIKey();
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const result = await generateStrategicAnglesAction(apiKey, rawInput);
    if (!result.success || !result.data) throw new Error(result.error || 'Request failed');
    return result.data;
}

export async function generateVideoBrief(angle: string): Promise<string> {
    const { generateVideoBriefAction } = await import('@/actions/openai');
    const apiKey = getOpenAIKey();
    if (!apiKey) return getDefaultVideoBrief(angle);

    const result = await generateVideoBriefAction(apiKey, angle);
    return result.success && result.data ? result.data : getDefaultVideoBrief(angle);
}

export async function generateSocialContent(angle: string, mediaType: string): Promise<SocialContent> {
    const { generateSocialContentAction } = await import('@/actions/openai');
    const apiKey = getOpenAIKey();

    const defaultContent: SocialContent = {
        caption: `💡 ${angle}\n\nThe best leaders know that real impact comes from sharing insights that matter.\n\n💬 What's your take? Share your thoughts below!`,
        description: 'Leadership insights for professionals.',
        hashtags: ['#Leadership', '#ThoughtLeadership', '#BusinessStrategy', '#ExecutiveInsights'],
    };

    if (!apiKey) return defaultContent;

    try {
        const result = await generateSocialContentAction(apiKey, angle, mediaType);
        return result.success && result.data ? result.data : defaultContent;
    } catch {
        return defaultContent;
    }
}

export async function generateImageGenPrompt(angle: string, mediaType: string): Promise<string> {
    const { generateImageGenPromptAction } = await import('@/actions/openai');
    const apiKey = getOpenAIKey();

    const defaultPrompt = `Professional business visual about "${angle}". Dark gradient background, cyan accents, modern minimalist style. High quality, 4k.`;
    if (!apiKey) return defaultPrompt;

    try {
        const result = await generateImageGenPromptAction(apiKey, angle, mediaType);
        return result.success && result.data ? result.data : defaultPrompt;
    } catch {
        return defaultPrompt;
    }
}

export async function generateCarouselPrompts(angle: string): Promise<string[]> {
    const { generateCarouselPromptsAction } = await import('@/actions/openai');
    const apiKey = getOpenAIKey();
    if (!apiKey) return [];

    try {
        const result = await generateCarouselPromptsAction(apiKey, angle);
        return result.success && result.data ? result.data : [];
    } catch {
        return [];
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

export async function testOpenAIConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = getOpenAIKey();
    if (!apiKey) return { success: false, message: 'No API key configured' };

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (response.ok) return { success: true, message: 'Connected successfully' };
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        return { success: false, message: error.error?.message || `Error: ${response.status}` };
    } catch (error) {
        return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}
