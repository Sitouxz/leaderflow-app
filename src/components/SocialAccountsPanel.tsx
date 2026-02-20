'use client';

import { useState, useEffect } from 'react';
import { getSocialAccountsAction, saveSocialAccountAction, deleteSocialAccountAction } from '@/actions/socialActions';

interface SocialAccount {
    id: string;
    platform: string;
    accessToken: string;
    tokenSecret?: string | null;
    refreshToken?: string | null;
}

export default function SocialAccountsPanel({ onBack }: { onBack: () => void }) {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setIsLoading(true);
        const result = await getSocialAccountsAction();
        if (result.success && result.data) {
            setAccounts(result.data as SocialAccount[]);
        }
        setIsLoading(false);
    };

    const handleConnect = (platform: string) => {
        setIsConnecting(platform);
        // Redirect to our OAuth initiation route
        window.location.href = `/api/auth/${platform}`;
    };

    const handleDelete = async (platform: string) => {
        if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
        const result = await deleteSocialAccountAction(platform);
        if (result.success) {
            await loadAccounts();
        }
    };

    const platforms = [
        { id: 'twitter', name: 'X (Twitter)', icon: 'brand_family', description: 'Post updates and threads to your X profile.' },
        { id: 'linkedin', name: 'LinkedIn', icon: 'share', description: 'Share professional insights and articles.' },
        { id: 'instagram', name: 'Instagram', icon: 'photo_camera', description: 'Post photos and reels to your Feed.' }
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
                </button>
                <h2 className="text-white text-xl font-bold">Connected Accounts</h2>
            </div>

            <div className="flex-1 overflow-auto pr-2 space-y-6">
                <p className="text-white/50 text-sm leading-relaxed">
                    Link your social media profiles to enable one-click automated scheduling.
                </p>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {platforms.map(p => {
                            const isConnected = accounts.some(a => a.platform === p.id);
                            const connecting = isConnecting === p.id;

                            return (
                                <div key={p.id} className={`bg-surface-dark border ${isConnected ? 'border-primary/30' : 'border-white/5'} rounded-2xl overflow-hidden transition-all shadow-xl`}>
                                    <div className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-12 rounded-xl flex items-center justify-center ${isConnected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/30'}`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{p.icon}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold">{p.name}</h3>
                                                <p className="text-[10px] text-white/30 mt-0.5 max-w-[180px] leading-tight">{p.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isConnected ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-emerald-400 font-medium bg-emerald-400/10 px-2 py-1 rounded-md uppercase tracking-wider">Active</span>
                                                    <button onClick={() => handleDelete(p.id)} className="size-9 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>link_off</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleConnect(p.id)}
                                                    disabled={connecting}
                                                    className="px-5 py-2.5 bg-primary text-black text-sm font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2"
                                                >
                                                    {connecting ? (
                                                        <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                                                            <span>Connect</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 mt-8">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>security</span>
                        <div>
                            <h4 className="text-white text-sm font-medium mb-1">Privacy & Security</h4>
                            <p className="text-white/40 text-xs leading-relaxed">
                                We only request the minimum permissions needed to publish posts on your behalf. Your credentials are encrypted and never shared.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
