import Link from 'next/link';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">ఆ</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">AP Bhumi</h3>
                                <p className="text-xs text-amber-400">ఆంధ్రప్రదేశ్ భూమి రికార్డులు</p>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-4 max-w-md">
                            Quick and easy access to Andhra Pradesh land records. Search 1B, Adangal,
                            Encumbrance Certificates, and more - all in one place.
                        </p>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>Andhra Pradesh, India</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/search" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">
                                    Search Land Records
                                </Link>
                            </li>
                            <li>
                                <Link href="/encumbrance" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">
                                    EC Search
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-slate-400 hover:text-amber-400 text-sm transition-colors">
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Government Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Official Portals</h4>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="https://meebhoomi.ap.gov.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-slate-400 hover:text-amber-400 text-sm transition-colors"
                                >
                                    Meebhoomi
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://registration.ap.gov.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-slate-400 hover:text-amber-400 text-sm transition-colors"
                                >
                                    IGRS AP
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://ap.gov.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-slate-400 hover:text-amber-400 text-sm transition-colors"
                                >
                                    AP Government
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-white/5">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-slate-500 text-sm">
                            © {currentYear} AP Bhumi. All rights reserved.
                        </p>
                        <p className="text-slate-600 text-xs">
                            This is a demo platform. Not affiliated with AP Government.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
