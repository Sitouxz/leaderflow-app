import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/twitter/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Twitter Client ID or Secret missing' }, { status: 500 });
    }

    const client = new TwitterApi({ clientId, clientSecret });

    // Generate auth link
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
        callbackUrl,
        { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
    );

    // Store verifier and state in cookies for the callback
    const cookieStore = await cookies();
    cookieStore.set('twitter_oauth_state', state, { maxAge: 600, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    cookieStore.set('twitter_oauth_verifier', codeVerifier, { maxAge: 600, httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return NextResponse.redirect(url);
}
