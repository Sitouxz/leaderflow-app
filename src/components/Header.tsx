interface HeaderProps {
    onSettingsClick?: () => void;
    showBack?: boolean;
}

export default function Header({ onSettingsClick, showBack }: HeaderProps) {
    return (
        <header className="flex items-center justify-between px-6 pt-12 pb-6 w-full z-10">
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
                    memory
                </span>
                <span className="text-white/60 text-xs font-medium tracking-[0.2em] uppercase">
                    System Active
                </span>
            </div>
            <button
                onClick={onSettingsClick}
                className="flex items-center justify-center size-10 rounded-full bg-surface-dark text-white hover:bg-white/10 transition-colors"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showBack ? 'close' : 'settings'}
                </span>
            </button>
        </header>
    );
}
