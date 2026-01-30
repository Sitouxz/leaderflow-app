
// scripts/test-gemini-sdk.ts
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Explicitly load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    console.log("Loading environment from:", envLocalPath);
    dotenv.config({ path: envLocalPath });
} else {
    // Fallback to standard .env
    console.log("Loading default environment");
    dotenv.config();
}

import { generateMediaContent, testGeminiConnection } from '../src/services/geminiService';

async function main() {
    console.log("Testing Gemini Connection...");

    // Debug: Check which key is loaded (safely)
    const key = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (key) {
        console.log("API Key detected:", key.substring(0, 8) + "...");
    } else {
        console.error("ERROR: No NEXT_PUBLIC_GOOGLE_AI_API_KEY found in environment variables.");
        console.log("Please ensure .env.local exists and contains the key.");
    }

    const connection = await testGeminiConnection();
    console.log("Connection result:", connection);

    if (!connection.success) {
        console.error("Skipping generation due to connection failure.");
        process.exit(1);
    }

    console.log("Testing generateMediaContent...");
    try {
        // Test with a simple prompt and 'image' type
        const result = await generateMediaContent("Leadership in the Age of AI", "image");
        console.log("Generation Success!");
        console.log("Image URL starts with:", result.imageUrl.substring(0, 30));
        console.log("Caption:", result.caption?.substring(0, 50) + "...");
    } catch (error) {
        console.error("Generation Failed:", error);
        process.exit(1);
    }
}

main();
