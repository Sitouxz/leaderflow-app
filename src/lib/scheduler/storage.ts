import { prisma } from '@/lib/prisma';
import { MediaContent } from '@/types/pipeline';

// Re-export interface for compatibility but id/status might be slightly different in Prisma (String vs enum)
export interface ScheduledPost {
    id: string;
    content: MediaContent;
    platforms: string[];
    scheduledTime: string; // ISO string to keep interface compatible with rest of app
    status: 'pending' | 'success' | 'failed';
    error?: string;
    externalJobId?: string;
    brandId?: string;
    createdAt: string;
}

// Read all posts
export async function getScheduledPosts(): Promise<ScheduledPost[]> {
    try {
        const posts = await prisma.scheduledPost.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return posts.map(post => ({
            id: post.id,
            content: JSON.parse(post.content),
            platforms: JSON.parse(post.platforms),
            scheduledTime: post.scheduledTime.toISOString(),
            status: post.status as ScheduledPost['status'],
            error: post.error || undefined,
            externalJobId: post.externalJobId || undefined,
            brandId: post.brandId || undefined,
            createdAt: post.createdAt.toISOString()
        }));
    } catch (error) {
        console.error('Failed to fetch posts from DB:', error);
        return [];
    }
}

// Save a new post
export async function saveScheduledPost(post: Omit<ScheduledPost, 'id' | 'createdAt' | 'status'> & { externalJobId?: string }): Promise<ScheduledPost> {
    try {
        const newPost = await prisma.scheduledPost.create({
            data: {
                content: JSON.stringify(post.content),
                platforms: JSON.stringify(post.platforms),
                scheduledTime: new Date(post.scheduledTime),
                status: 'pending',
                brandId: post.brandId || null,
                externalJobId: post.externalJobId || null,
            }
        });

        return {
            id: newPost.id,
            content: JSON.parse(newPost.content),
            platforms: JSON.parse(newPost.platforms),
            scheduledTime: newPost.scheduledTime.toISOString(),
            status: newPost.status as ScheduledPost['status'],
            error: newPost.error || undefined,
            externalJobId: newPost.externalJobId || undefined,
            brandId: newPost.brandId || undefined,
            createdAt: newPost.createdAt.toISOString()
        };
    } catch (error) {
        console.error('Failed to create post in DB:', error);
        throw error;
    }
}

// Update a post status
export async function updatePostStatus(id: string, status: ScheduledPost['status'], error?: string): Promise<void> {
    try {
        await prisma.scheduledPost.update({
            where: { id },
            data: {
                status: status,
                error: error || null
            }
        });
    } catch (err) {
        console.error(`Failed to update post ${id}:`, err);
    }
}
