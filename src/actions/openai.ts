'use server'

import { AI_CONFIG } from '@/services/aiConfig';
import { AngleType, GeneratedAngle } from '@/services/mockOpenAI';

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

const IMAGE_PROMPT_SYSTEM_PROMPT = `You are a world-class AI art director and prompt engineer. 
Your goal is to write "cutting edge", highly detailed, and realistic prompts for an image generation model (like Gemini/Imagen 3).

Follow these principles for the prompt:
1. **Premium Aesthetic**: Use keywords like "editorial photography", "cinematic lighting", "8k resolution", "sharp focus", "hyper-realistic", "depth of field".
2. **Lighting**: Specify lighting (e.g., "volumetric lighting", "rembrandt lighting", "soft studio lighting", "golden hour").
3. **Color**: Define a sophisticated palette (e.g., "deep midnight navy", "champagne gold accents", "cool cyan highlights"). Avoid muddy or oversaturated colors.
4. **Composition**: "Rule of thirds", "centered composition", or "dynamic angle".
6. **No Text**: Explicitly state "no text", "no typography", "clean visual" unless the user prompt specifically asks for an infographic or data visualization.
7. **Subject**: Abstract representations of business concepts, professionals in modern settings, or high-tech visualizations.

Format the output as a single, potent paragraph of text that can be pasted directly into the image generator. Do not include labels like "Prompt:" or quotation marks.`;

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

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
                    { role: 'system', content: STRATEGIC_ANGLES_SYSTEM_PROMPT },
                    { role: 'user', content: STRATEGIC_ANGLES_USER_PROMPT_TEMPLATE.replace('{INPUT}', rawInput) },
                ],
                max_completion_tokens: 4000,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[OpenAI Action] API error:', response.status, errorText);
            return { success: false, error: `OpenAI API error: ${response.status}` };
        }

        const data: OpenAIResponse = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) return { success: false, error: 'Empty response' };

        const angles = parseAnglesResponse(content);
        return { success: true, data: angles };

    } catch (error: any) {
        console.error('[OpenAI Action] Service error:', error);
        return { success: false, error: error.message };
    }
}

export async function generateVideoBriefAction(
    apiKey: string,
    angle: string
): Promise<{ success: boolean; data?: string; error?: string }> {
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
                        content: `Create a professional video production brief for this content angle: "${angle}"\n\nThe video should be 2-3 minutes, suitable for LinkedIn and YouTube, with a professional thought leadership tone.\n\nFormat as markdown with clear sections.`
                    }
                ],
                max_completion_tokens: 1500,
            }),
        });

        if (!response.ok) {
            return { success: false, error: `API error: ${response.status}` };
        }

        const data: OpenAIResponse = await response.json();
        const content = data.choices[0]?.message?.content;
        return { success: true, data: content || '' };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateSocialContentAction(
    apiKey: string,
    angle: string,
    mediaType: string
): Promise<{ success: boolean; data?: SocialContent; error?: string }> {
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
            return { success: false, error: `API error: ${response.status}` };
        }

        const data: OpenAIResponse = await response.json();
        console.log('[OpenAI Action] Social Content Raw Response:', JSON.stringify(data, null, 2));
        const content = data.choices?.[0]?.message?.content;
        if (!content) return { success: false, error: 'OpenAI returned empty content' };

        // Remove markdown code blocks if present
        const cleanContent = content.replace(/```json\n?|\n?```/g, '');

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
                    { role: 'system', content: IMAGE_PROMPT_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: mediaType === 'infographic'
                            ? `Create a prompt for a professional infographic about: "${angle}".
                               Context: LinkedIn/Instagram thought leadership.
                               Style: A clean, structured infographic.
                               Important: For this specific request, clear, readable headers or large numbers ARE allowed if they are central to the design, but prefer abstract representations of data (charts, nodes, flows). 
                               Focus on "layout", "flow", "connection", and "visual hierarchy".
                               Output ONLY the prompt text.`
                            : `Create a high-end, realistic image generation prompt for a ${mediaType} about: "${angle}". 
                        
                               Context: The image is for a professional LinkedIn/Instagram thought leadership post. 
                               Style: Dark, premium, tech-forward but human.
                               
                               Output ONLY the prompt text.`
                    }
                ],
                max_completion_tokens: 500,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[OpenAI Action] Image Prompt API error:', response.status, errorText);
            return { success: false, error: `API error: ${response.status}` };
        }

        const data: OpenAIResponse = await response.json();
        console.log('[OpenAI Action] Image Prompt Raw Response:', JSON.stringify(data, null, 2));

        const content = data.choices?.[0]?.message?.content;
        if (!content) return { success: false, error: 'OpenAI returned empty content' };

        return { success: true, data: content };

    } catch (error: any) {
        console.error('[OpenAI Action] Image Prompt error:', error);
        return { success: false, error: error?.message || String(error) || 'Unknown server error' };
    }
}

export async function generateCarouselPromptsAction(
    apiKey: string,
    angle: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
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
                    { role: 'system', content: IMAGE_PROMPT_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: `Create 3 distinct, sequential image generation prompts for a LinkedIn carousel about: "${angle}".

                        Structure the 3 slides as a visual story:
                        1. Slide 1 (Hook): A striking, high-impact metaphorical image introducing the concept.
                        2. Slide 2 (Insight): A detailed, complex visual representing the core analysis or friction.
                        3. Slide 3 (Solution): A forward-looking, inspiring visual representing the resolution or future state.

                        Style Requirements:
                        - Maintain a cohesive "cinematic, premium, photorealistic" style across all 3.
                        - strictly NO TEXT in the images.
                        
                        Output strictly as a JSON array of strings:
                        ["prompt 1", "prompt 2", "prompt 3"]`
                    }
                ],
                max_completion_tokens: 1000,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[OpenAI Action] Carousel Prompt API error:', response.status, errorText);
            return { success: false, error: `API error: ${response.status}` };
        }

        const data: OpenAIResponse = await response.json();
        console.log('[OpenAI Action] Carousel Prompt Raw Response:', JSON.stringify(data, null, 2));

        let content = data.choices?.[0]?.message?.content;
        if (!content) return { success: false, error: 'OpenAI returned empty content' };

        // Clean markdown
        content = content.replace(/```json\n?|\n?```/g, '');

        const prompts = JSON.parse(content);
        if (!Array.isArray(prompts) || prompts.length === 0) {
            return { success: false, error: 'Failed to parse prompts array' };
        }

        return { success: true, data: prompts.slice(0, 3) };

    } catch (error: any) {
        console.error('[OpenAI Action] Carousel Prompt error:', error);
        return { success: false, error: error?.message || String(error) };
    }
}
