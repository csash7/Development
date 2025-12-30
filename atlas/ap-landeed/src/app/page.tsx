import SearchBar from '@/components/SearchBar';
import Link from 'next/link';
import {
  FileText,
  Shield,
  MapPin,
  Clock,
  Users,
  Building2,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: FileText,
      title: '1B / Adangal',
      description: 'Access Record of Rights and village-level land accounts',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Encumbrance Certificate',
      description: 'Verify property is free from legal liabilities',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: MapPin,
      title: 'FMB / Survey Maps',
      description: 'Field Measurement Book and land boundaries',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      icon: Clock,
      title: 'Instant Results',
      description: 'Get land records in seconds, not days',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const stats = [
    { value: '13', label: 'Districts' },
    { value: '670+', label: 'Mandals' },
    { value: '17K+', label: 'Villages' },
    { value: '24/7', label: 'Available' },
  ];

  const recordTypes = [
    { name: '1-బి (1B)', description: 'Record of Rights' },
    { name: 'అడంగల్', description: 'Adangal - Village Account' },
    { name: 'పహాణీ', description: 'Pahani - Annual Statement' },
    { name: 'FMB', description: 'Field Measurement Book' },
    { name: 'పాస్‌బుక్', description: 'E-Passbook' },
    { name: 'EC', description: 'Encumbrance Certificate' },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 animated-gradient"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Fast & Reliable Land Record Search</span>
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Andhra Pradesh</span>
              <br />
              <span className="gradient-text">Land Records</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              ఆంధ్రప్రదేశ్ భూమి రికార్డులు - Access 1B, Adangal, Encumbrance Certificates,
              and Survey Maps instantly.
            </p>
          </div>

          {/* Search Bar */}
          <SearchBar variant="hero" />

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
                <p className="text-3xl font-bold text-amber-400">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Access all types of land records and property documents from a single platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Record Types Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                All AP Land Record Types
              </h2>
              <p className="text-slate-400 mb-8">
                Access comprehensive land records including ROR, village accounts,
                annual statements, survey maps, and more - all from one unified platform.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {recordTypes.map((type) => (
                  <div
                    key={type.name}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5"
                  >
                    <CheckCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">{type.name}</p>
                      <p className="text-slate-400 text-sm">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 overflow-hidden">
                {/* Decorative Map Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-64 h-64 rounded-full border-2 border-amber-500/20 flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full border-2 border-amber-500/30 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-2 border-amber-500/40 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                            <span className="text-4xl font-bold text-white">ఆ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Floating Districts */}
                    <div className="absolute top-0 right-0 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm border border-blue-500/20">
                      Visakhapatnam
                    </div>
                    <div className="absolute bottom-0 left-0 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm border border-emerald-500/20">
                      Guntur
                    </div>
                    <div className="absolute top-1/2 -right-4 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm border border-purple-500/20">
                      Vijayawada
                    </div>
                    <div className="absolute -bottom-8 right-1/4 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm border border-amber-500/20">
                      Tirupati
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Start Searching Now
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Find land records by survey number, owner name, or document number.
            Get instant access to 1B, Adangal, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Search Land Records
              <ArrowRight className="w-5 h-5" />
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
