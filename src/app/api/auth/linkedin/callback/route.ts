import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getBrandProfile } from '@/services/brandService';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const cookieStore = await cookies();
    const storedState = cookieStore.get('linkedin_oauth_state')?.value;

    if (!code || !state || !storedState || state !== storedState) {
        return NextResponse.json({ error: 'Invalid OAuth state or missing code' }, { status: 400 });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`;

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: callbackUrl,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Token exchange failed');

        const accessToken = tokenData.access_token;

        // Fetch user profile to get URN (openid connect)
        const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        const userData = await userResponse.json();
        if (!userResponse.ok) throw new Error('Failed to fetch user profile');

        // LinkedIn URN is usually sub in OpenID
        const personUrn = `urn:li:person:${userData.sub}`;

        const brand = await getBrandProfile();

        // Save to DB
        await prisma.socialAccount.upsert({
            where: {
                platform_brandId: {
                    platform: 'linkedin',
                    brandId: brand.id
                }
            },
            update: {
                accessToken,
                refreshToken: personUrn, // Repurposing field for URN as mapped in our scheduler
                expiresAt: new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000),
            },
            create: {
                platform: 'linkedin',
                accessToken,
                refreshToken: personUrn,
                expiresAt: new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000),
                brandId: brand.id
            }
        });

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?settings=social`);
    } catch (error: any) {
        console.error('LinkedIn OAuth Error:', error);
        return NextResponse.json({ error: error.message || 'OAuth exchange failed' }, { status: 500 });
    }
}
