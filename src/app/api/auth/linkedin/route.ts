import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`;

    if (!clientId) {
        return NextResponse.json({ error: 'LinkedIn Client ID missing' }, { status: 500 });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const scope = encodeURIComponent('w_member_social profile openid email');

    // Store state in cookies
    const cookieStore = await cookies();
    cookieStore.set('linkedin_oauth_state', state, { maxAge: 600, httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${callbackUrl}&state=${state}&scope=${scope}`;

    return NextResponse.redirect(url);
}
