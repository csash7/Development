'use client';

import { Ghost, Network, LayoutDashboard, Sun, Moon, Database, History, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/config';
import { useState, useEffect } from 'react';

export function Header({ children }: { children?: React.ReactNode }) {
    const pathname = usePathname();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Check for saved preference on mount
        const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
        if (saved) {
            setTheme(saved);
            if (saved === 'light') {
                document.body.classList.add('light');
            }
        }
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'light') {
            document.body.classList.add('light');
        } else {
            document.body.classList.remove('light');
        }
    };

    // Rate limit state
    const [rateLimit, setRateLimit] = useState<{ remaining: number; limit: number } | null>(null);

    useEffect(() => {
        // Fetch rate limit status
        fetch(`${API_URL}/api/rate-limit`)
            .then(res => res.json())
            .then(data => setRateLimit({ remaining: data.remaining, limit: data.limit }))
            .catch(() => { });
    }, []);

    const navLinks = [
        { href: '/', label: 'Audit Ops', icon: LayoutDashboard, match: (p: string) => p === '/' },
        { href: '/history', label: 'History', icon: History, match: (p: string) => p === '/history' || p?.startsWith('/history/') },
        { href: '/database', label: 'Database', icon: Database, match: (p: string) => p === '/database' },
        { href: '/agents', label: 'Agent Logic', icon: Network, match: (p: string) => p === '/agents' },
    ];

    return (
        <>
            <header className="h-14 md:h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-8 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4 md:gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <Ghost className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-base md:text-lg font-bold tracking-tight">Ghost Shift</h1>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1 bg-surface-highlight/50 p-1 rounded-lg border border-white/5">
                        {navLinks.map(({ href, label, icon: Icon, match }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                                    match(pathname || '') ? "bg-primary/20 text-primary" : "text-text-muted hover:text-white"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Children (hidden on mobile for space) */}
                    <div className="hidden lg:block">
                        {children}
                    </div>

                    {/* Rate Limit Badge - Compact on mobile */}
                    {rateLimit && (
                        <div className={cn(
                            "px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-mono border",
                            rateLimit.remaining <= 2
                                ? "bg-red-500/10 border-red-500/30 text-red-400"
                                : "bg-white/5 border-white/10 text-text-muted"
                        )}>
                            <span className="hidden sm:inline">{rateLimit.remaining}/{rateLimit.limit} uploads</span>
                            <span className="sm:hidden">{rateLimit.remaining}/{rateLimit.limit}</span>
                        </div>
                    )}

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 md:p-2 rounded-lg border border-white/10 transition-colors hover:bg-white/5"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-4 h-4 md:w-5 md:h-5 text-text-muted" />
                        ) : (
                            <Moon className="w-4 h-4 md:w-5 md:h-5 text-text-muted" />
                        )}
                    </button>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-1.5 rounded-lg border border-white/10 transition-colors hover:bg-white/5"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-5 h-5 text-text-muted" />
                        ) : (
                            <Menu className="w-5 h-5 text-text-muted" />
                        )}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-14 z-40 bg-background/95 backdrop-blur-md">
                    <nav className="flex flex-col p-4 gap-2">
                        {navLinks.map(({ href, label, icon: Icon, match }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "px-4 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-3 border",
                                    match(pathname || '')
                                        ? "bg-primary/20 text-primary border-primary/30"
                                        : "text-text-muted hover:text-white border-white/10 hover:bg-white/5"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </>
    );
}
