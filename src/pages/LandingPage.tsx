import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  QrCode, 
  Sparkles, 
  Smartphone, 
  Settings, 
  TrendingUp, 
  ArrowRight, 
  ChevronDown, 
  ShieldCheck, 
  UtensilsCrossed, 
  Coffee,
  Heart,
  HelpCircle,
  Maximize2
} from "lucide-react";
import Button from "../components/ui/Button";

interface FAQItem {
  question: string;
  answer: string;
}

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      title: "Realtime Menu Updates",
      description: "Instantly update items, descriptions, prices, and availabilities. Changes reflect on customer screens immediately.",
      icon: Sparkles,
      color: "from-purple-500 to-indigo-500",
    },
    {
      title: "Custom Brand Styling",
      description: "Customize your menu with your logo, banner image, custom currency, language preferences, and custom brand theme color.",
      icon: Settings,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Category Ordering",
      description: "Easily arrange your categories using our drag-and-drop builder, and highlight best-selling or vegetarian dishes.",
      icon: UtensilsCrossed,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Unlimited High-Res QR Codes",
      description: "Generate customized high-quality QR codes in PNG and SVG formats. Style and download them to print for your tables.",
      icon: QrCode,
      color: "from-pink-500 to-rose-500",
    },
    {
      title: "Mobile Optimization",
      description: "Gorgeous, lightning-fast app-like interface for iOS and Android. No app installation or signups required for diners.",
      icon: Smartphone,
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "SaaS Dashboards & Stats",
      description: "Review total categories, items, active products, and quickly toggle item availabilities directly from your master dashboard.",
      icon: TrendingUp,
      color: "from-violet-500 to-purple-500",
    },
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "$0",
      period: "forever",
      description: "Perfect for testing and small coffee carts.",
      features: [
        "1 Restaurant Profile",
        "Up to 2 Categories",
        "Up to 10 Menu Items",
        "Standard Web-QR Code",
        "Standard theme color",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Growth (Pro)",
      price: "$19",
      period: "per month",
      description: "Unlocks full restaurant features and styling customization.",
      features: [
        "Unlimited Categories",
        "Unlimited Menu Items",
        "Custom Logo & Banner upload",
        "Custom Restaurant Theme Color",
        "High-res PNG & SVG downloads",
        "Language & Currency selection",
      ],
      cta: "Coming Soon",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For multi-branch chains and restaurant groups.",
      features: [
        "Multiple branches (Coming Soon)",
        "Table-wise custom QR Codes",
        "Scan tracking & analytics dashboard",
        "Staff account sub-management",
        "Dedicated account manager",
      ],
      cta: "Coming Soon",
      popular: false,
    },
  ];

  const faqs: FAQItem[] = [
    {
      question: "Do my customers need to install an app to view the menu?",
      answer: "No, absolutely not. Diners simply scan the QR code using their default phone camera, and your restaurant menu opens instantly in their browser as a beautifully optimized web application.",
    },
    {
      question: "How long does it take for menu changes to reflect?",
      answer: "Updates are real-time. The moment you change a price, upload a new dish image, or mark an item as out-of-stock, the changes reflect instantly on your customer's screen without them having to refresh the page.",
    },
    {
      question: "Can I download my QR code for commercial printing?",
      answer: "Yes. You can generate and download your QR codes in both PNG format (for digital sharing and simple layouts) and SVG format (vector graphics, perfect for professional printing on table stands, menus, or windows).",
    },
    {
      question: "Can I set custom currencies and languages?",
      answer: "Yes, you can configure your default currency (e.g., USD, EUR, INR) and default menu language directly in your restaurant Settings panel.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-premium bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold shadow-soft">
              M
            </div>
            <span className="text-lg font-bold font-heading bg-gradient-to-r from-slate-900 via-brand-600 to-brand-500 bg-clip-text text-transparent dark:from-slate-100">
              MenuFlow
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors">
              Login
            </Link>
            <Link to="/register">
              <Button size="sm" className="hidden sm:inline-flex">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[0%] right-[-10%] w-[45%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Tagline & Callout */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60 text-brand-600 dark:text-brand-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen QR Menus for Modern Cafes</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-slate-950 dark:text-white leading-[1.1] tracking-tight">
              Bring your menu to life with{" "}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
                MenuFlow
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl font-medium">
              Create a premium digital menu in minutes. Enable diners to scan a table QR code and browse your items with zero app downloads, slow loads, or page refreshes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4.5 pt-2">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-brand-500/20">
                  Create Your Menu Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore Features
                </Button>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-900 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-brand-500" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <Coffee className="w-4.5 h-4.5 text-brand-500" />
                <span>Free Tier Available</span>
              </div>
            </div>
          </div>

          {/* Premium CSS Interactive Mock Phone */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: 1 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ type: "spring", duration: 0.8 }}
              whileHover={{ rotate: 0, scale: 1.02 }}
              className="relative w-[300px] h-[600px] bg-slate-900 rounded-[48px] p-3 shadow-soft-lg ring-12 ring-slate-800 dark:ring-slate-900/60 overflow-hidden border border-slate-700/50"
            >
              {/* Speaker & Sensor */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-900 rounded-b-2xl z-20 flex justify-center items-center">
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Dynamic Phone Content (Digital Menu Mock) */}
              <div className="w-full h-full bg-slate-50 dark:bg-slate-950 rounded-[38px] overflow-y-auto pt-6 px-4 pb-4 space-y-4 text-left select-none relative scrollbar-none">
                {/* Banner & Logo */}
                <div className="relative h-24 bg-gradient-to-r from-brand-600 to-indigo-500 rounded-2xl overflow-hidden shadow-sm flex items-end p-3.5">
                  <div className="absolute top-2 right-2 bg-black/40 text-[9px] font-bold text-white px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <Coffee className="w-2.5 h-2.5" />
                    <span>Open</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-600 font-bold border border-white text-xs shadow">
                    B
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-heading">
                    La Bella Bistro
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Italian Cuisine • 123 Food Street
                  </p>
                </div>

                {/* Search Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <Maximize2 className="w-3 h-3 text-slate-300" />
                  <span>Search food items...</span>
                </div>

                {/* Category Tags */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  <span className="px-3 py-1 bg-brand-500 text-white rounded-full text-[9px] font-bold">Pizza</span>
                  <span className="px-3 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-full text-[9px] font-semibold border border-slate-100 dark:border-slate-900">Appetizers</span>
                  <span className="px-3 py-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-full text-[9px] font-semibold border border-slate-100 dark:border-slate-900">Desserts</span>
                </div>

                {/* Food Item Cards */}
                <div className="space-y-2">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 rounded-xl p-2.5 flex gap-2.5 items-center">
                    <div className="w-14 h-14 bg-gradient-to-tr from-brand-100 to-indigo-100 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-lg text-brand-500">
                      🍕
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">Margherita Pizza</span>
                        <span className="w-2.5 h-2.5 border border-green-500 rounded-xs flex items-center justify-center bg-green-50/20 text-[6px] text-green-500 font-extrabold">🟢</span>
                      </div>
                      <p className="text-[8px] text-slate-400 line-clamp-2">Mozzarella, fresh basil, and virgin olive oil on sourdough crust.</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] font-bold text-brand-600">$14.99</span>
                        <span className="text-[7px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md">Bestseller</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 rounded-xl p-2.5 flex gap-2.5 items-center opacity-85">
                    <div className="w-14 h-14 bg-gradient-to-tr from-brand-100 to-indigo-100 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-lg text-brand-500">
                      🍰
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">Tiramisu Cake</span>
                        <span className="w-2.5 h-2.5 border border-green-500 rounded-xs flex items-center justify-center bg-green-50/20 text-[6px] text-green-500 font-extrabold">🟢</span>
                      </div>
                      <p className="text-[8px] text-slate-400 line-clamp-2">Espresso soaked ladyfingers layered with whipped mascarpone cream.</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] font-bold text-brand-600">$8.50</span>
                        <span className="text-[7px] font-bold text-slate-400">Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Feature Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-4.5 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-950 dark:text-white">
              Everything you need to serve digitally
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
              Take complete control over your customer dining experience. No commissions, no hardware installation, and instant updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-7 rounded-premium-lg shadow-soft hover:shadow-soft-lg transition-all space-y-4"
              >
                <div className={`w-12 h-12 rounded-premium bg-gradient-to-tr ${feature.color} flex items-center justify-center text-white shadow-md`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Coming Soon marker) */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4.5 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-950 dark:text-white">
              Simple, transparent pricing
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
              Start with our lifetime Free tier, and upgrade as your restaurant grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col justify-between bg-white dark:bg-slate-900 border ${
                  tier.popular 
                    ? "border-brand-500 dark:border-brand-400 ring-2 ring-brand-500/20" 
                    : "border-slate-100 dark:border-slate-800"
                } p-8 rounded-premium-lg shadow-soft`}
              >
                {/* Coming Soon Badge */}
                {tier.cta === "Coming Soon" && (
                  <span className="absolute top-4 right-4 bg-brand-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {tier.name}
                  </h4>
                  <div className="flex items-baseline mt-4 mb-2">
                    <span className="text-4xl font-extrabold font-heading text-slate-950 dark:text-white">
                      {tier.price}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                      /{tier.period}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">
                    {tier.description}
                  </p>

                  <div className="border-t border-slate-100 dark:border-slate-850 my-6" />

                  <ul className="space-y-4.5 text-xs text-slate-600 dark:text-slate-300 text-left font-medium">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  {tier.cta === "Coming Soon" ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Coming Soon
                    </Button>
                  ) : (
                    <Link to="/register">
                      <Button variant={tier.popular ? "primary" : "outline"} className="w-full">
                        {tier.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4.5 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-950 dark:text-white flex items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8 text-brand-500" />
              <span>Frequently Asked Questions</span>
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
              Everything you need to know about MenuFlow's digital QR ordering system.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-premium overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4.5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 focus:outline-none transition-colors"
                  >
                    <span className="text-sm font-bold font-heading">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-slate-400"
                    >
                      <ChevronDown className="w-4.5 h-4.5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800/40">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-tr from-brand-900 via-brand-950 to-slate-950 text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[150px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading tracking-tight leading-[1.15]">
            Ready to upgrade your restaurant menu?
          </h2>
          <p className="text-sm sm:text-base text-brand-200 max-w-xl mx-auto">
            Join modern food businesses creating fast, real-time menus. Set up takes less than 5 minutes.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <Button size="lg" className="bg-white text-brand-950 hover:bg-brand-50 shadow-xl">
                Get Started For Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-100 dark:border-slate-900 text-xs text-slate-400 dark:text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span className="font-heading font-bold text-slate-800 dark:text-slate-200">MenuFlow</span>
          </div>
          
          <div className="flex gap-4">
            <span>&copy; {new Date().getFullYear()} MenuFlow. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 mx-0.5" />
            <span>for restaurant owners.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
