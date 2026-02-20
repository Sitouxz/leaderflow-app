// 3-Stage Workflow with full social SEO

export type PipelineStatus =
    | 'ideation'
    | 'media_selection'
    | 'media_generating'
    | 'media_review'
    | 'scheduling'
    | 'scheduling'
    | 'scheduled';

export type MediaType = 'infographic' | 'carousel' | 'image' | 'video';

export type AngleType = 'deep_dive' | 'strategic_framework' | 'provocative' | 'tactical' | 'visionary';

export interface GeneratedAngle {
    title: string;
    type: AngleType;
    description: string;
}

export const ANGLE_TYPE_CONFIG: Record<AngleType, { label: string; icon: string; color: string }> = {
    deep_dive: { label: 'Deep Dive', icon: 'search', color: 'text-blue-400' },
    strategic_framework: { label: 'Strategic Framework', icon: 'account_tree', color: 'text-emerald-400' },
    provocative: { label: 'Provocative Statement', icon: 'bolt', color: 'text-orange-400' },
    tactical: { label: 'Tactical Insight', icon: 'target', color: 'text-purple-400' },
    visionary: { label: 'Visionary Outlook', icon: 'visibility', color: 'text-cyan-400' },
};

export type GenerationType = 'ai' | 'human';

export const MEDIA_TYPE_CONFIG: Record<MediaType, {
    label: string;
    icon: string;
    generationType: GenerationType;
    description: string;
}> = {
    infographic: {
        label: 'Infographic',
        icon: 'analytics',
        generationType: 'ai',
        description: 'AI-generated data visualization'
    },
    carousel: {
        label: 'Carousel',
        icon: 'view_carousel',
        generationType: 'ai',
        description: 'Multi-slide swipeable content'
    },
    image: {
        label: 'Image',
        icon: 'image',
        generationType: 'ai',
        description: 'Single visual with caption'
    },
    video: {
        label: 'Video',
        icon: 'videocam',
        generationType: 'human',
        description: 'Brief sent to human editor'
    },
};

export type MediaContent = {
    type: MediaType;
    imageUrl: string;
    previewUrls?: string[];
    videoBrief?: string;
    // Social SEO fields
    caption: string;
    description: string;
    hashtags: string[];
};

export type SocialPost = {
    platforms: string[];
    scheduledTime: Date;
};

export type PipelineItem = {
    id: string;
    rawInput: string;
    status: PipelineStatus;
    createdAt: Date;

    // Stage 1
    angles?: GeneratedAngle[];
    selectedAngle?: string;

    // Stage 2
    selectedMediaType?: MediaType;
    mediaContent?: MediaContent;
    rejectionFeedback?: string;

    // Stage 3
    socialPost?: SocialPost;
};

export type StatusConfig = {
    label: string;
    color: string;
    bgColor: string;
    shadowColor: string;
    icon: string;
};

export const STATUS_CONFIG: Record<PipelineStatus, StatusConfig> = {
    ideation: {
        label: 'Generating Angles',
        color: 'text-primary',
        bgColor: 'bg-primary',
        shadowColor: 'shadow-[0_0_8px_rgba(0,234,255,0.5)]',
        icon: 'auto_awesome',
    },
    media_selection: {
        label: 'Choose Media Type',
        color: 'text-purple-400/90',
        bgColor: 'bg-purple-400',
        shadowColor: 'shadow-[0_0_8px_rgba(192,132,252,0.5)]',
        icon: 'palette',
    },
    media_generating: {
        label: 'Creating Content',
        color: 'text-yellow-400/90',
        bgColor: 'bg-yellow-400',
        shadowColor: 'shadow-[0_0_8px_rgba(250,204,21,0.5)]',
        icon: 'brush',
    },
    media_review: {
        label: 'Review Content',
        color: 'text-blue-400/90',
        bgColor: 'bg-blue-400',
        shadowColor: 'shadow-[0_0_8px_rgba(96,165,250,0.5)]',
        icon: 'rate_review',
    },
    scheduling: {
        label: 'Ready to Post',
        color: 'text-orange-400/90',
        bgColor: 'bg-orange-400',
        shadowColor: 'shadow-[0_0_8px_rgba(251,146,60,0.5)]',
        icon: 'schedule_send',
    },
    scheduled: {
        label: 'Scheduled',
        color: 'text-emerald-500/90',
        bgColor: 'bg-emerald-500',
        shadowColor: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]',
        icon: 'calendar_today',
    },
};
