import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
    const clientId = process.env.FACEBOOK_APP_ID; // Use Facebook App ID for Instagram Graph API
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/instagram/callback`;

    if (!clientId) {
        return NextResponse.json({ error: 'Facebook App ID missing' }, { status: 500 });
    }

    const state = crypto.randomBytes(16).toString('hex');
    // Scopes needed for Instagram Graph API via Facebook Login
    // Updated to match available permissions for Business Apps
    // Some scopes might be deprecated or renamed. Using the most standard set.
    const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management';

    // Store state in cookies
    const cookieStore = await cookies();
    cookieStore.set('instagram_oauth_state', state, { maxAge: 600, httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${callbackUrl}&state=${state}&scope=${scope}&response_type=code`;

    return NextResponse.redirect(url);
}
