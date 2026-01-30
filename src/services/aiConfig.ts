/**
 * Centralized AI configuration for LeaderFlow
 */

export const AI_CONFIG = {
    openai: {
        chatModel: 'gpt-4o' as const,
        whisperModel: 'whisper-1' as const,
        maxAngles: 4,
    },
    // base gemini config not really used directly now, replaced by helpers
    gemini: {
        defaultModel: 'gemini-2.5-flash-image' as const,
    },
    useMockFallback: false,
};

export type GeminiModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';

export interface GeminiConfig {
    model: GeminiModel;
    imageSize?: string;
}

/**
 * Get API keys from environment or localStorage
 */
export function getOpenAIKey(): string | null {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OPENAI_API_KEY) {
        return process.env.NEXT_PUBLIC_OPENAI_API_KEY || null;
    }
    if (typeof window !== 'undefined') {
        return localStorage.getItem('openai_api_key');
    }
    return null;
}

export function getGoogleAIKey(): string | null {
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GOOGLE_AI_API_KEY) {
        return process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || null;
    }
    if (typeof window !== 'undefined') {
        return localStorage.getItem('google_ai_api_key');
    }
    return null;
}

/**
 * Get configured Gemini Mode
 */
export function getGeminiModel(): GeminiModel {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('gemini_model');
        if (stored === 'gemini-3-pro-image-preview' || stored === 'gemini-2.5-flash-image') {
            return stored;
        }
    }
    // Default to Flash (Free)
    return 'gemini-2.5-flash-image';
}

/**
 * Get full Gemini Configuration based on active model
 */
export function getGeminiConfig(): GeminiConfig {
    const model = getGeminiModel();

    if (model === 'gemini-3-pro-image-preview') {
        return {
            model,
            imageSize: '2K',
        };
    }

    // Default / Flash
    return {
        model: 'gemini-2.5-flash-image',
        // No imageSize for Flash/Free tier
    };
}

/**
 * Save API keys and configuration
 */
export function saveOpenAIKey(key: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('openai_api_key', key);
    }
}

export function saveGoogleAIKey(key: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('google_ai_api_key', key);
    }
}

export function saveGeminiModel(model: GeminiModel): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('gemini_model', model);
    }
}

export function isAIConfigured(): { openai: boolean; gemini: boolean } {
    return {
        openai: !!getOpenAIKey(),
        gemini: !!getGoogleAIKey(),
    };
}
