/**
 * Mock OpenAI service for generating strategic angles from raw input.
 * Simulates real API behavior with realistic delay.
 */

export type AngleType = 'deep_dive' | 'strategic_framework' | 'provocative' | 'tactical' | 'visionary';

export interface GeneratedAngle {
    title: string;
    type: AngleType;
    description: string;
}

const ANGLE_TYPE_CONFIG: Record<AngleType, { label: string; icon: string; color: string }> = {
    deep_dive: { label: 'Deep Dive', icon: 'search', color: 'text-blue-400' },
    strategic_framework: { label: 'Strategic Framework', icon: 'account_tree', color: 'text-emerald-400' },
    provocative: { label: 'Provocative Statement', icon: 'bolt', color: 'text-orange-400' },
    tactical: { label: 'Tactical Insight', icon: 'target', color: 'text-purple-400' },
    visionary: { label: 'Visionary Outlook', icon: 'visibility', color: 'text-cyan-400' },
};

export { ANGLE_TYPE_CONFIG };

const ANGLE_TEMPLATES: { template: string; type: AngleType; descTemplate: string }[] = [
    {
        template: "The Hidden ROI of {topic}: What Most Leaders Miss",
        type: 'deep_dive',
        descTemplate: "Uncover the overlooked benefits and measurable impact of {topic} that competitors often ignore."
    },
    {
        template: "From Vision to Reality: A Strategic Framework for {topic}",
        type: 'strategic_framework',
        descTemplate: "A structured approach to implementing {topic} with clear milestones and success metrics."
    },
    {
        template: "Disrupting the Status Quo: A Fresh Take on {topic}",
        type: 'provocative',
        descTemplate: "Challenge conventional thinking and present a bold, contrarian perspective on {topic}."
    },
    {
        template: "The Leadership Lens: How {topic} Shapes Executive Decision-Making",
        type: 'deep_dive',
        descTemplate: "Explore how top executives leverage {topic} to drive organizational success."
    },
    {
        template: "Building Teams That Thrive: {topic} as a Competitive Advantage",
        type: 'tactical',
        descTemplate: "Practical strategies for using {topic} to build high-performing teams."
    },
    {
        template: "The Future of {topic}: Trends Every C-Suite Should Watch",
        type: 'visionary',
        descTemplate: "Forward-looking insights on emerging trends and predictions for {topic}."
    },
    {
        template: "5 Mistakes Leaders Make with {topic} (And How to Avoid Them)",
        type: 'tactical',
        descTemplate: "Learn from common pitfalls and get actionable fixes for your {topic} strategy."
    },
    {
        template: "Why Traditional Approaches to {topic} Are Failing",
        type: 'provocative',
        descTemplate: "A bold critique of outdated methods with a call to embrace new paradigms."
    },
];

function extractTopic(rawInput: string): string {
    const cleaned = rawInput.trim();
    const firstSentence = cleaned.split('.')[0];
    return firstSentence.length > 50
        ? firstSentence.substring(0, 50) + '...'
        : firstSentence;
}

function generateAnglesFromInput(rawInput: string): GeneratedAngle[] {
    const topic = extractTopic(rawInput);

    // Shuffle and pick 4 random templates
    const shuffled = [...ANGLE_TEMPLATES].sort(() => Math.random() - 0.5);
    const count = 4;

    return shuffled.slice(0, count).map(item => ({
        title: item.template.replace('{topic}', topic),
        type: item.type,
        description: item.descTemplate.replace('{topic}', topic),
    }));
}

export async function generateStrategicAngles(rawInput: string): Promise<GeneratedAngle[]> {
    // Simulate API delay (1-2 seconds)
    const delay = 1000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    return generateAnglesFromInput(rawInput);
}
