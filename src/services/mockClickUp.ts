/**
 * Mock ClickUp service for creating tasks.
 * Simulates real API behavior with realistic delay.
 */

export interface CreateTaskResponse {
    taskId: string;
    taskUrl: string;
    status: 'created';
}

export async function createTask(
    selectedAngle: string,
    rawInput: string
): Promise<CreateTaskResponse> {
    // Simulate API delay (0.5-1 second)
    const delay = 500 + Math.random() * 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Generate a mock task ID
    const taskId = `TASK-${Date.now().toString(36).toUpperCase()}`;

    console.log('[Mock ClickUp] Task created:', {
        taskId,
        title: selectedAngle,
        description: rawInput,
    });

    return {
        taskId,
        taskUrl: `https://app.clickup.com/t/${taskId}`,
        status: 'created',
    };
}

/**
 * Simulates the human team completing their work.
 * In production, this would be triggered by a ClickUp webhook.
 */
export interface FinalDraft {
    text: string;
    imageUrl: string;
}

const SAMPLE_DRAFTS: Record<string, FinalDraft> = {
    default: {
        text: `# Strategic Insight

In today's rapidly evolving business landscape, leaders must balance innovation with stability. The most successful organizations recognize that transformation isn't just about technology—it's about people.

## Key Takeaways

1. **Embrace Adaptive Leadership**: The ability to pivot quickly while maintaining team cohesion is essential.

2. **Build Trust Through Transparency**: Open communication creates psychological safety and drives engagement.

3. **Focus on Long-term Value**: Short-term metrics matter, but sustainable growth requires a broader perspective.

The path forward demands both courage and humility. Leaders who master this balance will define the next era of business excellence.`,
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    },
};

export async function simulateHumanCompletion(): Promise<FinalDraft> {
    // Simulate human processing time (would be days in real life, but 3-5s for demo)
    const delay = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    return SAMPLE_DRAFTS.default;
}
