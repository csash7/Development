import Link from 'next/link';
import {
    MapPin,
    Users,
    FileText,
    Shield,
    Clock,
    ExternalLink,
    Github,
    Linkedin,
    Twitter
} from 'lucide-react';

export default function AboutPage() {
    const features = [
        {
            icon: FileText,
            title: '1B / Adangal Records',
            description: 'Access Record of Rights (ROR) and village-level land accounts instantly.',
        },
        {
            icon: Shield,
            title: 'Encumbrance Certificates',
            description: 'Verify if property is free from mortgages, loans, or legal disputes.',
        },
        {
            icon: MapPin,
            title: 'All AP Districts',
            description: 'Coverage across all 13 districts and 670+ mandals of Andhra Pradesh.',
        },
        {
            icon: Clock,
            title: 'Instant Results',
            description: 'Get land records in seconds, reducing verification time by 10x.',
        },
    ];

    const governmentLinks = [
        {
            name: 'Meebhoomi',
            url: 'https://meebhoomi.ap.gov.in',
            description: 'Official AP land records portal',
        },
        {
            name: 'IGRS AP',
            url: 'https://registration.ap.gov.in',
            description: 'Registration and stamp duty services',
        },
        {
            name: 'AP Government',
            url: 'https://ap.gov.in',
            description: 'Official government website',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Hero */}
            <section className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                                <span className="text-white font-bold text-4xl">ఆ</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4">About AP Bhumi</h1>
                        <p className="text-xl text-slate-300">
                            ఆంధ్రప్రదేశ్ భూమి రికార్డులు
                        </p>
                        <p className="text-slate-400 mt-6 text-lg">
                            A modern platform for quick and easy access to Andhra Pradesh land records.
                            Search 1B, Adangal, Encumbrance Certificates, and more - all in one place.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                            <p className="text-slate-400 text-lg mb-6">
                                Land records in India are traditionally difficult to access, involving
                                complex paperwork, multiple government departments, and long waiting times.
                                This creates challenges for property owners, buyers, legal advisors, and
                                financial institutions.
                            </p>
                            <p className="text-slate-400 text-lg mb-6">
                                AP Bhumi aims to simplify this process by providing instant digital access
                                to land records for Andhra Pradesh. Our platform consolidates data and
                                presents it in an easy-to-understand format.
                            </p>
                            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <p className="text-amber-400 text-sm">
                                    <strong>Note:</strong> This is a demo/prototype application. For official
                                    land records, please visit the official government portals listed below.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {features.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="p-6 bg-slate-800/50 rounded-2xl border border-white/5"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4">
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                    <p className="text-slate-400 text-sm">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Government Links */}
            <section className="py-20 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Official Government Portals</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            For official land records and documents, please visit the following
                            Andhra Pradesh government websites.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {governmentLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group p-6 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-white group-hover:text-amber-400 transition-colors">
                                        {link.name}
                                    </h3>
                                    <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                                </div>
                                <p className="text-slate-400">{link.description}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Built With</h2>
                        <p className="text-slate-400">
                            Modern technologies for a fast and reliable experience
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        {['Next.js 14', 'React', 'TypeScript', 'Tailwind CSS', 'Lucide Icons'].map(
                            (tech) => (
                                <div
                                    key={tech}
                                    className="px-6 py-3 bg-slate-800/50 rounded-full border border-white/5 text-slate-300"
                                >
                                    {tech}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Start Searching Now</h2>
                    <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                        Find land records by survey number, owner name, or document number.
                        Get instant access to 1B, Adangal, and more.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/search"
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            <FileText className="w-5 h-5" />
                            Search Land Records
                        </Link>
                        <Link
                            href="/encumbrance"
                            className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/10 transition-all"
                        >
                            <Shield className="w-5 h-5" />
                            Check EC Status
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
