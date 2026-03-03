
# Database Connection Troubleshooting

## Update: 2026-02-24 (Resolution)

### Critical Finding: Project ID Mismatch

The root cause of the connection failures is a mismatch between the **old project ID** configured in your environment variables (`acdiuvwjbpsndqxfxrxy`) and the **new Supabase project** you have connected (`tmcqfcypmboelhodqgqx`).

The application was trying to connect to the old project (which likely no longer exists or is paused), resulting in "Tenant not found".

### Solution: Update Vercel Environment Variables

You need to manually update the `DATABASE_URL` in your Vercel (or deployment) Environment Variables settings to point to the new project.

**Use this EXACT value:**

```
postgresql://postgres:rxUVyhMgBMA7e9HE@db.tmcqfcypmboelhodqgqx.supabase.co:5432/postgres?sslmode=require
```

**Why this value?**
1.  **Project ID**: Updated to `tmcqfcypmboelhodqgqx`.
2.  **Password**: Updated to `rxUVyhMgBMA7e9HE` (from your provided screenshot).
3.  **Port**: `5432` (Direct connection) - This is the safest option to bypass any potential firewall issues with port 6543 on the deployment platform.
4.  **No PgBouncer**: Removed `pgbouncer=true` as it's not supported on port 5432.

### Steps
1.  Go to Vercel Dashboard -> Settings -> Environment Variables.
2.  Find `DATABASE_URL`.
3.  Click "Edit" and paste the value above.
4.  Save.
5.  **Redeploy** your application for the changes to take effect.
