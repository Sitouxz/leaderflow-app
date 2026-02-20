import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveSocialAccountAction } from '@/actions/socialActions';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/dashboard?error=' + error, request.url));
    }

    const cookieStore = await cookies();
    const savedState = cookieStore.get('instagram_oauth_state')?.value;

    if (!state || state !== savedState) {
        return NextResponse.redirect(new URL('/dashboard?error=invalid_state', request.url));
    }

    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/instagram/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Facebook App credentials missing' }, { status: 500 });
    }

    try {
        // 1. Exchange code for short-lived access token
        const tokenResponse = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${callbackUrl}&client_secret=${clientSecret}&code=${code}`
        );
        const tokenData = await tokenResponse.json();

        if (tokenData.error) throw new Error(tokenData.error.message);

        const shortLivedToken = tokenData.access_token;

        // 2. Exchange short-lived token for long-lived token
        const longLivedResponse = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`
        );
        const longLivedData = await longLivedResponse.json();
        
        if (longLivedData.error) throw new Error(longLivedData.error.message);

        const accessToken = longLivedData.access_token;
        const expiresIn = longLivedData.expires_in; // Seconds
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

        // 3. Get User's Pages
        console.log('[Instagram Auth] Fetching user pages...');
        const pagesResponse = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
        );
        const pagesData = await pagesResponse.json();

        if (pagesData.error) throw new Error(pagesData.error.message);

        console.log(`[Instagram Auth] Found ${pagesData.data?.length || 0} pages.`);

        // 4. Find the first Page with a connected Instagram Business Account
        let instagramAccountId = null;
        
        for (const page of pagesData.data) {
            // Get IG Business Account for this page
            // We use the page access token to query the page's connected IG account
            const igResponse = await fetch(
                `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
            );
            const igData = await igResponse.json();
            
            if (igData.instagram_business_account) {
                console.log(`[Instagram Auth] Found IG Business Account ${igData.instagram_business_account.id} on page ${page.name} (${page.id})`);
                instagramAccountId = igData.instagram_business_account.id;
                break;
            } else {
                console.log(`[Instagram Auth] No IG Business Account on page ${page.name} (${page.id})`);
            }
        }

        if (!instagramAccountId) {
            console.error('[Instagram Auth] No Instagram Business Account found on any linked Facebook Page.');
            return NextResponse.redirect(new URL('/dashboard?error=no_instagram_business_account', request.url));
        }

        // Save to database
        // We use the Long-Lived User Access Token, which allows us to publish to pages we manage
        await saveSocialAccountAction({
            platform: 'instagram',
            accessToken: accessToken,
            refreshToken: instagramAccountId, // Storing IG Business ID here
            expiresAt: expiresAt
        });

        return NextResponse.redirect(new URL('/dashboard?success=instagram_connected', request.url));

    } catch (error) {
        console.error('Instagram Auth Error:', error);
        return NextResponse.redirect(new URL('/dashboard?error=auth_failed', request.url));
    }
}
