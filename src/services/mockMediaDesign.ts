/**
 * Mock service for generating media content based on selected type.
 * Now includes full social SEO optimization (caption, hashtags, description).
 */

import { MediaType, MediaContent } from '@/types/pipeline';

const SAMPLE_IMAGES: Record<MediaType, string[]> = {
    infographic: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    ],
    carousel: [
        'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
        'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?w=800&q=80',
    ],
    image: [
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    ],
    video: [
        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80',
    ],
};

function generateCaption(angle: string, type: MediaType): string {
    const hooks: Record<MediaType, string[]> = {
        infographic: [
            `📊 The data tells a powerful story...`,
            `📈 Key insights every leader should know:`,
        ],
        carousel: [
            `🔄 Swipe through for the complete framework →`,
            `📱 5 actionable insights you can implement today:`,
        ],
        image: [
            `💡 One powerful insight that changed my perspective:`,
            `🎯 The truth about great leadership:`,
        ],
        video: [
            `🎬 Watch to discover the framework behind this:`,
            `▶️ 3 minutes that could transform your approach:`,
        ],
    };

    const hook = hooks[type][Math.floor(Math.random() * hooks[type].length)];

    return `${hook}

${angle}

The most successful leaders understand that growth comes from continuous learning and adaptation.

Here's what I've learned after years of experience in this field - and why I believe this approach makes all the difference.

💬 What's your experience with this? Share your thoughts below!

⤵️ Save this for later | 🔄 Share with your network`;
}

function generateHashtags(angle: string): string[] {
    const baseHashtags = ['#Leadership', '#ThoughtLeadership', '#BusinessStrategy', '#ExecutiveInsights'];
    const topicHashtags = ['#Innovation', '#FutureOfWork', '#GrowthMindset', '#ProfessionalDevelopment'];
    const engagementHashtags = ['#LeadershipTips', '#CareerGrowth', '#SuccessMindset'];

    return [
        ...baseHashtags.slice(0, 2),
        ...topicHashtags.slice(0, 2),
        ...engagementHashtags.slice(0, 1),
    ];
}

function generateDescription(angle: string, type: MediaType): string {
    return `In this ${type}, I break down the key principles behind "${angle}". This framework has helped countless leaders transform their approach to strategic thinking and decision-making.`;
}

function generateVideoBrief(selectedAngle: string): string {
    return `# Video Production Brief

## Content Title
${selectedAngle}

## Target Duration
2-3 minutes

## Key Messages
1. Opening hook - capture attention in first 5 seconds
2. Main insight - core message from the angle
3. Supporting points - 2-3 examples or data points
4. Call to action - engagement prompt

## Visual Style
- Professional, clean aesthetic
- Brand colors: Cyan (#00eaff) accents
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

export async function generateMediaContent(
    selectedAngle: string,
    mediaType: MediaType
): Promise<MediaContent> {
    const isHuman = mediaType === 'video';
    const delay = isHuman ? 3000 + Math.random() * 2000 : 1000 + Math.random() * 1000;

    await new Promise(resolve => setTimeout(resolve, delay));

    const images = SAMPLE_IMAGES[mediaType];
    const mainImage = images[Math.floor(Math.random() * images.length)];

    const content: MediaContent = {
        type: mediaType,
        imageUrl: mainImage,
        caption: generateCaption(selectedAngle, mediaType),
        description: generateDescription(selectedAngle, mediaType),
        hashtags: generateHashtags(selectedAngle),
    };

    if (mediaType === 'carousel') {
        content.previewUrls = SAMPLE_IMAGES.carousel;
    }

    if (mediaType === 'video') {
        content.videoBrief = generateVideoBrief(selectedAngle);
    }

    return content;
}

export async function regenerateWithFeedback(
    selectedAngle: string,
    mediaType: MediaType,
    feedback: string
): Promise<MediaContent> {
    console.log('[MockMediaDesign] Regenerating with feedback:', feedback);
    return generateMediaContent(selectedAngle, mediaType);
}
