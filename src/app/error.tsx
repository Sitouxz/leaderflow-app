'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('LeaderFlow Error Layer:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-center">
            <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-red-500" style={{ fontSize: '40px' }}>warning</span>
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Something went wrong!</h2>
            <p className="text-white/50 text-sm max-w-md mb-8">
                {error.message || "An unexpected error occurred in the pipeline. We've been notified and are working on it."}
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                >
                    Go Home
                </button>
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 rounded-xl bg-primary text-black font-bold hover:opacity-90 transition-opacity"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
