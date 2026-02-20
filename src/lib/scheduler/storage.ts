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
    brand?: {
        socialAccounts: {
            platform: string;
            accessToken: string;
            refreshToken: string | null;
            tokenSecret: string | null;
        }[];
    };
    createdAt: string;
}

// Read all posts
export async function getScheduledPosts(): Promise<ScheduledPost[]> {
    try {
        const posts = await prisma.scheduledPost.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                brand: {
                    include: {
                        socialAccounts: true
                    }
                }
            }
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
            brand: post.brand ? {
                socialAccounts: post.brand.socialAccounts.map(sa => ({
                    platform: sa.platform,
                    accessToken: sa.accessToken,
                    refreshToken: sa.refreshToken,
                    tokenSecret: sa.tokenSecret
                }))
            } : undefined,
            createdAt: post.createdAt.toISOString()
        }));
    } catch (error) {
        console.error('Failed to fetch posts from DB:', error);
        return [];
    }
}

/**
 * Gets a social account and refreshes it if needed.
 * Only supports Twitter OAuth 2.0 refresh for now.
 */
export async function getAndRefreshSocialAccount(brandId: string, platform: string) {
    const account = await prisma.socialAccount.findUnique({
        where: { platform_brandId: { platform, brandId } }
    });

    if (!account) return null;

    // Check if expired (with 5 min buffer)
    if (account.expiresAt && new Date(account.expiresAt).getTime() < Date.now() + 300000) {
        if (platform === 'twitter' && account.refreshToken) {
            console.log(`[Scheduler] Refreshing Twitter token for brand ${brandId}...`);
            try {
                const { TwitterApi } = await import('twitter-api-v2');
                const client = new TwitterApi({
                    clientId: process.env.TWITTER_CLIENT_ID!,
                    clientSecret: process.env.TWITTER_CLIENT_SECRET!
                });

                const { accessToken, refreshToken, expiresIn } = await client.refreshOAuth2Token(account.refreshToken);

                return await prisma.socialAccount.update({
                    where: { id: account.id },
                    data: {
                        accessToken,
                        refreshToken: refreshToken || account.refreshToken,
                        expiresAt: new Date(Date.now() + expiresIn * 1000)
                    }
                });
            } catch (error) {
                console.error('[Scheduler] Failed to refresh Twitter token:', error);
                throw error;
            }
        }
    }

    return account;
}

// Save a new post
export async function saveScheduledPost(post: Omit<ScheduledPost, 'id' | 'createdAt' | 'status' | 'brand'> & { externalJobId?: string }): Promise<ScheduledPost> {
    try {
        const newPost = await prisma.scheduledPost.create({
            data: {
                content: JSON.stringify(post.content),
                platforms: JSON.stringify(post.platforms),
                scheduledTime: new Date(post.scheduledTime),
                status: 'pending',
                brandId: post.brandId || null,
                externalJobId: post.externalJobId || null,
            },
            include: {
                brand: {
                    include: {
                        socialAccounts: true
                    }
                }
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
