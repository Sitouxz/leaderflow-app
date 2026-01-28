/**
 * OpenAI service for generating strategic angles and voice transcription.
 * Uses GPT-5 for thought leadership content generation.
 * Uses Whisper for voice-to-text transcription.
 */

import { AI_CONFIG, getOpenAIKey } from './aiConfig';
import { generateStrategicAngles as mockGenerateAngles, GeneratedAngle, AngleType, ANGLE_TYPE_CONFIG } from './mockOpenAI';

export { ANGLE_TYPE_CONFIG };
export type { GeneratedAngle, AngleType };

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

interface WhisperResponse {
    text: string;
}

const SYSTEM_PROMPT = `You are a thought leadership strategist helping executives turn raw ideas into compelling content angles for social media.

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

const USER_PROMPT_TEMPLATE = `Here's the raw thought or idea to transform into strategic content angles:

"{INPUT}"

Generate 4 distinct strategic angles. Respond with a JSON array of objects with these exact fields:
- title (string, max 60 chars)
- type (one of: deep_dive, strategic_framework, provocative, tactical, visionary)
- description (string, max 120 chars)

Only respond with the JSON array, no additional text.`;

/**
 * Parse OpenAI response into GeneratedAngle array
 */
function parseResponse(content: string): GeneratedAngle[] {
    try {
        // Try to extract JSON array from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No JSON array found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (!Array.isArray(parsed)) {
            throw new Error('Response is not an array');
        }

        const validTypes: AngleType[] = ['deep_dive', 'strategic_framework', 'provocative', 'tactical', 'visionary'];

        return parsed.slice(0, 4).map((item: { title?: string; type?: string; description?: string }) => ({
            title: String(item.title || 'Untitled Angle').slice(0, 80),
            type: (validTypes.includes(item.type as AngleType) ? item.type : 'deep_dive') as AngleType,
            description: String(item.description || 'Strategic insight for leaders').slice(0, 150),
        }));
    } catch (error) {
        console.error('[OpenAI] Failed to parse response:', error);
        throw new Error('Failed to parse AI response');
    }
}

/**
 * Transcribe audio using OpenAI Whisper
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
 * Generate strategic angles using OpenAI GPT-5
 */
export async function generateStrategicAngles(rawInput: string): Promise<GeneratedAngle[]> {
    const apiKey = getOpenAIKey();

    // Fall back to mock if no API key configured
    if (!apiKey) {
        console.log('[OpenAI] No API key configured, using mock service');
        return mockGenerateAngles(rawInput);
    }

    try {
        const messages: OpenAIMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: USER_PROMPT_TEMPLATE.replace('{INPUT}', rawInput) },
        ];

        const requestBody = {
            model: AI_CONFIG.openai.chatModel,
            messages,
            max_completion_tokens: 4000, // GPT-5 needs more tokens for reasoning + output
        };

        console.log('[OpenAI] Sending request with model:', AI_CONFIG.openai.chatModel);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            // Try to get error as text first, then parse as JSON
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { raw: errorText };
            }
            console.error('[OpenAI] API error:', response.status, JSON.stringify(errorData, null, 2));
            console.error('[OpenAI] Request model was:', AI_CONFIG.openai.chatModel);

            // Fall back to mock on API error if configured
            if (AI_CONFIG.useMockFallback) {
                console.log('[OpenAI] Falling back to mock service');
                return mockGenerateAngles(rawInput);
            }

            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data: OpenAIResponse = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from OpenAI');
        }

        return parseResponse(content);
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
 * Generate video brief using GPT-5
 */
export async function generateVideoBrief(angle: string): Promise<string> {
    const apiKey = getOpenAIKey();

    if (!apiKey) {
        // Return default brief if no API key
        return getDefaultVideoBrief(angle);
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: AI_CONFIG.openai.chatModel,
                messages: [
                    {
                        role: 'system',
                        content: `You are a video production strategist. Create detailed video production briefs for thought leadership content. Include: title, duration, key messages, visual style, B-roll suggestions, audio notes, and deliverables.`
                    },
                    {
                        role: 'user',
                        content: `Create a professional video production brief for this content angle: "${angle}"

The video should be 2-3 minutes, suitable for LinkedIn and YouTube, with a professional thought leadership tone.

Format as markdown with clear sections.`
                    }
                ],
                max_completion_tokens: 1500,
            }),
        });

        if (!response.ok) {
            return getDefaultVideoBrief(angle);
        }

        const data: OpenAIResponse = await response.json();
        return data.choices[0]?.message?.content || getDefaultVideoBrief(angle);
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
 */
export async function testOpenAIConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = getOpenAIKey();

    if (!apiKey) {
        return { success: false, message: 'No API key configured' };
    }

    try {
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
 * Generate social media content (caption, description, hashtags) using GPT-5
 */
export interface SocialContent {
    caption: string;
    description: string;
    hashtags: string[];
}

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
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: AI_CONFIG.openai.chatModel,
                messages: [
                    { role: 'system', content: SOCIAL_CONTENT_PROMPT },
                    { role: 'user', content: `Topic: "${angle}"\nMedia type: ${mediaType}` }
                ],
                max_completion_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('[OpenAI] API error:', response.status, error);
            return defaultContent;
        }

        const data: OpenAIResponse = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('[OpenAI] No JSON found in response');
            return defaultContent;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            caption: parsed.caption || defaultContent.caption,
            description: parsed.description || defaultContent.description,
            hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : defaultContent.hashtags,
        };
    } catch (error) {
        console.error('[OpenAI] Error generating social content:', error);
        return defaultContent;
    }
}
