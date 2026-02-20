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
};

export type GeminiModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';

export interface GeminiConfig {
    model: GeminiModel;
    imageSize?: string;
}

/**
 * Get API keys from environment or localStorage
 * Priority: Server-side secret > Client-side public env var > LocalStorage
 */
export function getOpenAIKey(): string | null {
    // Check for server-side secret first (not prefixed with NEXT_PUBLIC)
    if (typeof process !== 'undefined' && process.env.OPENAI_API_KEY) {
        return process.env.OPENAI_API_KEY;
    }

    // Check for public env var
    if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        return process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    }

    // Fallback to localStorage (client-only)
    if (typeof window !== 'undefined') {
        return localStorage.getItem('openai_api_key');
    }
    return null;
}

export function getGoogleAIKey(): string | null {
    if (typeof process !== 'undefined' && process.env.GOOGLE_AI_API_KEY) {
        return process.env.GOOGLE_AI_API_KEY;
    }

    if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY) {
        return process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
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
