'use server'

import { AI_CONFIG } from '@/services/aiConfig';
import { AngleType, GeneratedAngle } from '@/types/pipeline';
import { getBrandProfile } from '@/services/brandService';

// ... interface definitions ...

function formatBrandContext(profile: BrandProfile | null): string {
    if (!profile) return '';

    // Only add context if meaningful fields exist
    const parts = [];
    if (profile.companyName) parts.push(`Brand Name: ${profile.companyName}`);
    if (profile.industry) parts.push(`Industry: ${profile.industry}`);
    if (profile.targetAudience) parts.push(`Target Audience: ${profile.targetAudience}`);
    if (profile.toneOfVoice) parts.push(`Tone of Voice: ${profile.toneOfVoice}`);
    if (profile.keywords) parts.push(`Key Topics/Themes: ${profile.keywords}`);

    if (parts.length === 0) return '';

    return `\n\nBRAND CONTEXT (IMPORTANT - TAILOR OUTPUT TO THIS):\n${parts.join('\n')}`;
}

interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

interface SocialContent {
    caption: string;
    description: string;
    hashtags: string[];
}

// ----------------------------------------------------------------------
// Constants & Prompts
// ----------------------------------------------------------------------

const STRATEGIC_ANGLES_SYSTEM_PROMPT = `You are a thought leadership strategist helping executives turn raw ideas into compelling content angles for social media.

Your role is to take a raw thought, idea, or observation and transform it into 4 distinct strategic content angles that would resonate with a professional audience on LinkedIn, Twitter, and other business platforms.

Each angle should have:
1. A compelling, specific title (max 60 characters) - this becomes the headline
2. A type from: deep_dive, strategic_framework, provocative, tactical, visionary
3. A description explaining the angle's value proposition (max 120 characters)

Type definitions:
- deep_dive: In-depth analysis uncovering hidden insights
- strategic_framework: Structured approach or methodology
- provocative: Bold, contrarian, or challenging perspective
- tactical: Practical, actionable advice
- visionary: Future-focused, trend-setting outlook

Focus on executive-level insights, leadership, business strategy, and professional growth.
Make each angle distinct and valuable on its own.`;

const STRATEGIC_ANGLES_USER_PROMPT_TEMPLATE = `Here's the raw thought or idea to transform into strategic content angles:

"{INPUT}"

Generate 4 distinct strategic angles. Respond with a JSON array of objects with these exact fields:
- title (string, max 60 chars)
- type (one of: deep_dive, strategic_framework, provocative, tactical, visionary)
- description (string, max 120 chars)

Only respond with the JSON array, no additional text.`;

const SOCIAL_CONTENT_PROMPT = `You are a social media strategist for thought leaders. 
Create engaging social media content for this post.

Generate content with these fields (respond in JSON format only):
{
    "caption": "A compelling social media caption (200-300 words) with:
        - Attention-grabbing hook in first line
        - 2-3 key insights or points
        - Personal perspective or experience reference
        - Call to action for engagement
        - Use emojis strategically",
    "description": "Brief SEO description (under 160 chars)",
    "hashtags": ["array", "of", "5-7", "relevant", "hashtags"]
}

Only respond with valid JSON, no additional text.`;

const IMAGE_PROMPT_SYSTEM_PROMPT = `You are a world-class AI art director and cinematic photographer.
Your goal is to write evocative, sophisticated, and authentic prompts for a high-end image generation model.

Follow these principles:
1. **Authentic Cinematography**: Avoid "AI-perfect" looks. Use keywords like "editorial photography", "shot on 35mm film", "analogue warmth", "natural textures", "documentary style", "slight grain", "handheld camera aesthetic".
2. **Masterful Lighting**: Focus on natural or purposeful lighting (e.g., "dappled sunlight through windows", "intentional shadows", "low-key lighting", "soft atmospheric haze"). No generic "glow".
3. **Curation over Cliché**: Avoid shiny blue/cyan tech defaults. Use sophisticated palettes like "muted earth tones", "deep indigo and slate", "warm cedar and brushed steel", "desaturated professional hues".
4. **Human Complexity**: For subjects, aim for "candid moments", "focused intensity", or "thoughtful Pause". Environments should feel lived-in and real.
5. **No Text**: Strictly "no text", "no labels", "clean visual" unless the specific request is for a conceptual data visualization.

Format as a single, potent, sensory-rich paragraph. Do not use labels or quotation marks.`;

import { BrandProfile } from '@prisma/client';

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

interface OpenAIActionResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

interface OpenAIRequestPayload {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    response_format?: { type: 'json_object' };
    temperature?: number;
    max_completion_tokens?: number;
}

/**
 * Helper to call OpenAI API with standard error handling
 */
async function callOpenAI(
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
            console.error('[OpenAI Action] API error:', response.status, errorText);
            return { success: false, error: `OpenAI API error: ${response.status}` };
        }

        const data: OpenAIActionResponse = await response.json();
        return { success: true, data: data.choices[0]?.message?.content };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[OpenAI Action] Service error:', error);
        return { success: false, error: message };
    }
}

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
        console.error('[OpenAI Action] Failed to parse angles:', error);
        throw new Error('Failed to parse AI response');
    }
}

// ----------------------------------------------------------------------
// Server Actions
// ----------------------------------------------------------------------

export async function generateStrategicAnglesAction(
    apiKey: string,
    rawInput: string
): Promise<{ success: boolean; data?: GeneratedAngle[]; error?: string }> {
    const brandProfile = await getBrandProfile();
    const brandContext = formatBrandContext(brandProfile);

    const result = await callOpenAI(apiKey, {
        model: AI_CONFIG.openai.chatModel,
        messages: [
            { role: 'system', content: STRATEGIC_ANGLES_SYSTEM_PROMPT + brandContext },
            { role: 'user', content: STRATEGIC_ANGLES_USER_PROMPT_TEMPLATE.replace('{INPUT}', rawInput) },
        ],
        max_completion_tokens: 4000,
    });

    if (!result.success) return { success: false, error: result.error };
    if (!result.data) return { success: false, error: 'No data returned from OpenAI' };

    try {
        const angles = parseAnglesResponse(result.data);
        return { success: true, data: angles };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateVideoBriefAction(
    apiKey: string,
    angle: string
): Promise<{ success: boolean; data?: string; error?: string }> {
    const brandProfile = await getBrandProfile();
    const brandContext = formatBrandContext(brandProfile);

    const result = await callOpenAI(apiKey, {
        model: AI_CONFIG.openai.chatModel,
        messages: [
            {
                role: 'system',
                content: `You are a video production strategist. Create detailed video production briefs for thought leadership content. Include: title, duration, key messages, visual style, B-roll suggestions, audio notes, and deliverables.${brandContext}`
            },
            {
                role: 'user',
                content: `Create a professional video production brief for this content angle: "${angle}"\n\nThe video should be 2-3 minutes, suitable for LinkedIn and YouTube, with a professional thought leadership tone.\n\nFormat as markdown with clear sections.`
            }
        ],
        max_completion_tokens: 1500,
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data };
}

export async function generateSocialContentAction(
    apiKey: string,
    angle: string,
    mediaType: string
): Promise<{ success: boolean; data?: SocialContent; error?: string }> {
    const brandProfile = await getBrandProfile();
    const brandContext = formatBrandContext(brandProfile);

    const result = await callOpenAI(apiKey, {
        model: AI_CONFIG.openai.chatModel,
        messages: [
            { role: 'system', content: SOCIAL_CONTENT_PROMPT + brandContext },
            { role: 'user', content: `Topic: "${angle}"\nMedia type: ${mediaType}` }
        ],
        max_completion_tokens: 2000,
    });

    if (!result.success) return { success: false, error: result.error };
    if (!result.data) return { success: false, error: 'No data returned from OpenAI' };

    try {
        const cleanContent = result.data.replace(/```json\n?|\n?```/g, '');
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { success: false, error: 'No JSON found' };

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            success: true,
            data: {
                caption: parsed.caption || '',
                description: parsed.description || '',
                hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateImageGenPromptAction(
    apiKey: string,
    angle: string,
    mediaType: string
): Promise<{ success: boolean; data?: string; error?: string }> {
    const brandProfile = await getBrandProfile();
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
            { role: 'system', content: IMAGE_PROMPT_SYSTEM_PROMPT + brandContext },
            { role: 'user', content: promptUser }
        ],
        max_completion_tokens: 500,
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data };
}

export async function generateCarouselPromptsAction(
    apiKey: string,
    angle: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
    const brandProfile = await getBrandProfile();
    const brandContext = formatBrandContext(brandProfile);

    const result = await callOpenAI(apiKey, {
        model: AI_CONFIG.openai.chatModel,
        messages: [
            { role: 'system', content: IMAGE_PROMPT_SYSTEM_PROMPT + brandContext },
            {
                role: 'user',
                content: `Create 3 distinct, sequential image generation prompts for a visual narrative about: "${angle}".

                Sequence:
                1. Slide 1 (The Hook): A visceral, high-impact metaphor. Something that stops the scroll through sheer creative unexpectedness.
                2. Slide 2 (The Friction): A detailed, textured visual representing complexity, struggle, or the "hidden depth" of the problem. Use strong lighting and shadows.
                3. Slide 3 (The Horizon): A clear, inspiring, yet grounded visual representing the "unlocked future". Focus on clarity, open space, and authentic human resolution.

                Aesthetic: 
                - Photorealistic but cinematic. 
                - Strictly NO TEXT.
                - Cohesive visual language across all three.
                
                Respond ONLY with a JSON array of strings: ["prompt 1", "prompt 2", "prompt 3"]`
            }
        ],
        max_completion_tokens: 1000,
    });

    if (!result.success) return { success: false, error: result.error };
    if (!result.data) return { success: false, error: 'No data returned from OpenAI' };

    try {
        const cleanContent = result.data.replace(/```json\n?|\n?```/g, '');
        const prompts = JSON.parse(cleanContent);
        if (!Array.isArray(prompts) || prompts.length === 0) {
            return { success: false, error: 'Failed to parse prompts array' };
        }
        return { success: true, data: prompts.slice(0, 3) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

