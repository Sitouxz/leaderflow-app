import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

// Mask the password in the connection string for logging
const maskedDbUrl = dbUrl.replace(/:[^:@]*@/, ':****@');

console.log(`[Prisma] Initializing client with URL: ${maskedDbUrl}`);

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.warn('[Prisma] WARNING: DATABASE_URL is not set in production environment. Falling back to default (likely SQLite), which may cause issues.');
}

export const prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Checks the database connection by running a simple query.
 * Retries with exponential backoff if it fails.
 */
export async function checkDatabaseConnection(retries = 5, initialDelay = 1000) {
    let currentDelay = initialDelay;

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[Prisma] Checking database connection (Attempt ${i + 1}/${retries})...`);
            await prisma.$queryRaw`SELECT 1`;
            console.log('[Prisma] Database connection successful.');
            return true;
        } catch (error: any) {
            console.error(`[Prisma] Connection attempt ${i + 1} failed:`, error.message);
            
            if (error.message.includes('Tenant or user not found')) {
                console.error('[Prisma] FATAL: Supabase tenant or user not found. Please check your DATABASE_URL credentials and ensure the project is not paused.');
                // Fatal error, might not want to retry, but let's stick to the loop or break?
                // If it's auth error, retrying exactly the same way won't fix it unless it's a propagation issue.
                // But for now, we continue to retry just in case.
            }

            if (i === retries - 1) {
                console.error('[Prisma] All connection attempts failed.');
                throw error;
            }

            console.log(`[Prisma] Retrying in ${currentDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay *= 2;
        }
    }
    return false;
}

/**
 * Helper to retry database operations with exponential backoff
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0) {
            // Check if it's a connection error worth retrying
            const isConnectionError = 
                error.message.includes('Can\'t reach database server') ||
                error.message.includes('Connection lost') ||
                error.code === 'P1001' || // Can't reach database server
                error.code === 'P1008';   // Operations timed out

            if (isConnectionError) {
                console.warn(`[Prisma] Database operation failed. Retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return withRetry(operation, retries - 1, delay * 2);
            }
        }
        throw error;
    }
}
