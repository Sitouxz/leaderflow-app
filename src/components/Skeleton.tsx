'use client';

import React from 'react';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-surface-dark border border-white/5 rounded-2xl p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        </div>
    );
}

export function AngleSkeleton() {
    return (
        <div className="bg-surface-dark border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    );
}
