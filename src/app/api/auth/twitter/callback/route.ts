import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getBrandProfile } from '@/services/brandService';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const cookieStore = await cookies();
    const storedState = cookieStore.get('twitter_oauth_state')?.value;
    const storedVerifier = cookieStore.get('twitter_oauth_verifier')?.value;

    if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
        return NextResponse.json({ error: 'Invalid OAuth state or missing code' }, { status: 400 });
    }

    const clientId = process.env.TWITTER_CLIENT_ID!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/twitter/callback`;

    try {
        const client = new TwitterApi({ clientId, clientSecret });

        const {
            accessToken,
            refreshToken,
            expiresIn,
        } = await client.loginWithOAuth2({
            code,
            codeVerifier: storedVerifier,
            redirectUri: callbackUrl,
        });

        const brand = await getBrandProfile();

        // Save to DB
        await prisma.socialAccount.upsert({
            where: {
                platform_brandId: {
                    platform: 'twitter',
                    brandId: brand.id
                }
            },
            update: {
                accessToken,
                refreshToken: refreshToken || null,
                expiresAt: new Date(Date.now() + expiresIn * 1000),
            },
            create: {
                platform: 'twitter',
                accessToken,
                refreshToken: refreshToken || null,
                expiresAt: new Date(Date.now() + expiresIn * 1000),
                brandId: brand.id
            }
        });

        // Redirect back to settings
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?settings=social`);
    } catch (error: any) {
        console.error('Twitter OAuth Error:', error);
        return NextResponse.json({ error: error.message || 'OAuth exchange failed' }, { status: 500 });
    }
}
