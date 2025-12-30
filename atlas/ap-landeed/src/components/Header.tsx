'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, FileText, Search, Home, Info, MapPin, ChevronDown } from 'lucide-react';

// Supported states configuration
const STATES = [
    { code: 'TS', name: 'Telangana', enabled: true },
    { code: 'AP', name: 'Andhra Pradesh', enabled: false },
    { code: 'KA', name: 'Karnataka', enabled: false },
];

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedState, setSelectedState] = useState(STATES[0]);
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

    const navLinks = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/search', label: 'Search Records', icon: Search },
        { href: '/encumbrance', label: 'EC Search', icon: FileText },
        { href: '/about', label: 'About', icon: Info },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 backdrop-blur-lg border-b border-white/10">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                                <span className="text-white font-bold text-lg">भू</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900"></div>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-white">BhumiSetu</h1>
                            <p className="text-xs text-emerald-400/80">भूमिसेतु • Land Bridge</p>
                        </div>
                    </Link>

                    {/* State Selector */}
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                        >
                            <MapPin className="w-4 h-4 text-emerald-400" />
                            <span className="text-white">{selectedState.name}</span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>

                        {isStateDropdownOpen && (
                            <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-white/10 rounded-lg shadow-xl py-1 min-w-[180px]">
                                {STATES.map((state) => (
                                    <button
                                        key={state.code}
                                        disabled={!state.enabled}
                                        onClick={() => {
                                            if (state.enabled) {
                                                setSelectedState(state);
                                                setIsStateDropdownOpen(false);
                                            }
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${state.enabled
                                                ? 'text-white hover:bg-white/10'
                                                : 'text-slate-500 cursor-not-allowed'
                                            } ${selectedState.code === state.code ? 'bg-emerald-500/20' : ''}`}
                                    >
                                        {state.name}
                                        {!state.enabled && (
                                            <span className="text-xs text-slate-600">Coming Soon</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-white/10">
                        {/* Mobile State Selector */}
                        <div className="px-4 py-2 mb-2">
                            <p className="text-xs text-slate-500 mb-2">Select State</p>
                            <div className="flex flex-wrap gap-2">
                                {STATES.filter(s => s.enabled).map((state) => (
                                    <button
                                        key={state.code}
                                        onClick={() => setSelectedState(state)}
                                        className={`px-3 py-1.5 rounded-lg text-sm ${selectedState.code === state.code
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-white/10 text-slate-300'
                                            }`}
                                    >
                                        {state.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <link.icon className="w-5 h-5" />
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
