'use client';

import { useState } from 'react';

type NavItem = 'capture' | 'library' | 'cognition';

interface BottomNavProps {
    activeTab?: NavItem;
    onTabChange?: (tab: NavItem) => void;
}

export default function BottomNav({ activeTab = 'capture', onTabChange }: BottomNavProps) {
    const handleClick = (tab: NavItem) => {
        onTabChange?.(tab);
    };

    const navItems: { id: NavItem; icon: string; label: string }[] = [
        { id: 'capture', icon: 'mic', label: 'Capture' },
        { id: 'library', icon: 'folder_open', label: 'Library' },
        { id: 'cognition', icon: 'psychology', label: 'Cognition' },
    ];

    return (
        <nav className="w-full border-t border-white/5 bg-background-dark/95 backdrop-blur-md pt-2 pb-4 px-6" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div className="flex justify-around items-center max-w-md mx-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleClick(item.id)}
                        className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === item.id
                            ? 'text-primary'
                            : 'text-white/40 hover:text-white'
                            }`}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={activeTab === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                            {item.icon}
                        </span>
                        <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
