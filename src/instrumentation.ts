export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('[Instrumentation] Registering services...');
        
        try {
            // Check database connection
            const { checkDatabaseConnection } = await import('./lib/prisma');
            // We await this to ensure we have a connection before starting other services,
            // but we wrap in try/catch to not crash the entire app if DB is down temporarily.
            // Actually, for serverless/edge, this might run on every request or cold start.
            // Let's run it without blocking, but log the result.
            checkDatabaseConnection().then(connected => {
                if (connected) {
                    console.log('[Instrumentation] Database connected successfully.');
                } else {
                    console.error('[Instrumentation] Database connection failed after retries.');
                }
            }).catch(err => {
                console.error('[Instrumentation] Database connection check error:', err);
            });

            const { initScheduler } = await import('./lib/scheduler/cron');
            initScheduler();
        } catch (error) {
            console.error('[Instrumentation] Error during registration:', error);
        }
    }
}
