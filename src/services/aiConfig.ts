/**
 * Centralized AI configuration for LeaderFlow
 */

export const AI_CONFIG = {
    openai: {
        // GPT-5 for strategic thinking and content generation
        chatModel: 'gpt-5' as const,
        // Whisper for voice-to-text transcription
        whisperModel: 'whisper-1' as const,
        // Note: GPT-5 only supports temperature=1 (default)
        maxAngles: 4,
    },
    gemini: {
        // Free tier: Gemini 2.5 Flash Image (Nano Banana)
        model: 'gemini-2.5-flash-image' as const,
        // Paid tier: Uncomment for Gemini 3 Pro Image (Nano Banana Pro)
        // model: 'gemini-3-pro-image-preview' as const,
        imageSize: '1024x1024' as const,
    },
    // Feature flags
    useMockFallback: false, // Disabled - requires real API keys
};

/**
 * Get API keys from environment or localStorage
 */
export function getOpenAIKey(): string | null {
    // First check environment variable
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OPENAI_API_KEY) {
        return process.env.NEXT_PUBLIC_OPENAI_API_KEY || null;
    }
    // Fallback to localStorage (for user-configured keys)
    if (typeof window !== 'undefined') {
        return localStorage.getItem('openai_api_key');
    }
    return null;
}

export function getGoogleAIKey(): string | null {
    // First check environment variable
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GOOGLE_AI_API_KEY) {
        return process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || null;
    }
    // Fallback to localStorage (for user-configured keys)
    if (typeof window !== 'undefined') {
        return localStorage.getItem('google_ai_api_key');
    }
    return null;
}

/**
 * Save API keys to localStorage
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

/**
 * Check if AI services are configured
 */
export function isAIConfigured(): { openai: boolean; gemini: boolean } {
    return {
        openai: !!getOpenAIKey(),
        gemini: !!getGoogleAIKey(),
    };
}
