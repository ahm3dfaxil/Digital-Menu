import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  FolderHeart, 
  UtensilsCrossed, 
  CheckCircle2, 
  QrCode, 
  PlusCircle, 
  Palette, 
  ArrowRight,
  TrendingUp,
  Clock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscribeCategories, subscribeMenuItems } from "../services/db";
import type { Category, MenuItem } from "../types";
import { DashboardCardSkeleton } from "../components/ui/Skeleton";

export const DashboardOverview: React.FC = () => {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurant) return;

    setLoading(true);
    // Subscribe to both categories and menu items
    const unsubCategories = subscribeCategories(restaurant.id, (cats) => {
      setCategories(cats);
    });

    const unsubMenuItems = subscribeMenuItems(restaurant.id, (items) => {
      setMenuItems(items);
      setLoading(false);
    });

    return () => {
      unsubCategories();
      unsubMenuItems();
    };
  }, [restaurant]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <DashboardCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 h-64 rounded-premium animate-pulse" />
          <div className="bg-white dark:bg-slate-900 h-64 rounded-premium animate-pulse" />
        </div>
      </div>
    );
  }

  const totalCategories = categories.length;
  const totalItems = menuItems.length;
  const availableItems = menuItems.filter(item => item.available).length;
  const availabilityRate = totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 100;
  const recentItems = [...menuItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

  // Dynamic branding color fallback
  const brandColor = restaurant?.themeColor || "#8b5cf6";

  const metrics = [
    {
      name: "Total Categories",
      value: totalCategories,
      icon: FolderHeart,
      bg: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400",
      link: "/dashboard/categories"
    },
    {
      name: "Total Menu Items",
      value: totalItems,
      icon: UtensilsCrossed,
      bg: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
      link: "/dashboard/menu"
    },
    {
      name: "Available Items",
      value: `${availableItems} / ${totalItems}`,
      subtext: `${availabilityRate}% Active`,
      icon: CheckCircle2,
      bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
      link: "/dashboard/menu"
    },
    {
      name: "QR Scans (Total)",
      value: "Coming Soon",
      subtext: "Scan tracking & analytics",
      icon: QrCode,
      bg: "bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400",
      link: "/dashboard/qr-code"
    },
  ];

  // Quick Action cards
  const quickActions = [
    {
      title: "Add Food Item",
      description: "Put dishes, prices, and photo URLs on your active menu.",
      icon: PlusCircle,
      link: "/dashboard/menu",
      color: "hover:border-blue-500/50"
    },
    {
      title: "Sort Categories",
      description: "Use drag-and-drop handles to reorder customer sections.",
      icon: FolderHeart,
      link: "/dashboard/categories",
      color: "hover:border-purple-500/50"
    },
    {
      title: "Branding Themes",
      description: "Apply your logos, cover banner, and main UI colors.",
      icon: Palette,
      link: "/dashboard/restaurant",
      color: "hover:border-emerald-500/50"
    },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl font-black font-heading text-slate-900 dark:text-white">
          Overview
        </h1>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
          {restaurant?.name || "Loading store Profile..."} • Management Dashboard
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <Link 
            key={i} 
            to={metric.link}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-premium shadow-soft hover:shadow-soft-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center gap-4.5"
          >
            <div className={`w-12 h-12 rounded-premium flex items-center justify-center flex-shrink-0 ${metric.bg}`}>
              <metric.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {metric.name}
              </p>
              <h3 className="text-xl font-extrabold font-heading text-slate-800 dark:text-slate-100 mt-0.5">
                {metric.value}
              </h3>
              {"subtext" in metric && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                  {metric.subtext}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Mock Analytics Chart Block (Coming Soon) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-premium-lg shadow-soft flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading">
                  QR Code Analytics
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Daily scans breakdown over the last 7 days
                </p>
              </div>
              <span className="bg-brand-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            </div>

            {/* Simulated Chart Visual */}
            <div className="flex items-end justify-between h-40 pt-8 gap-3">
              {[45, 68, 55, 90, 80, 110, 130].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-28 flex items-end">
                    <div 
                      className="w-full bg-brand-500/20 dark:bg-brand-500/10 rounded-t-lg transition-all relative group cursor-pointer"
                      style={{ height: `${(val / 140) * 100}%` }}
                    >
                      <div 
                        className="absolute inset-x-0 bottom-0 rounded-t-lg transition-all"
                        style={{ height: "40%", backgroundColor: brandColor }}
                      />
                      {/* Tooltip */}
                      <span className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {val} scans
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 border-t border-slate-50 dark:border-slate-800/40 pt-4 mt-4">
            <TrendingUp className="w-4 h-4" />
            <span>Integrate scan tracking, location analysis, and reviews in Pro Tier.</span>
          </div>
        </div>

        {/* Quick Actions & Recent Items */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-premium-lg shadow-soft">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-3">
              {quickActions.map((action, i) => (
                <Link
                  key={i}
                  to={action.link}
                  className={`flex gap-3.5 p-3 rounded-premium border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${action.color}`}
                >
                  <action.icon className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" style={{ color: brandColor }} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {action.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Items Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-premium-lg shadow-soft flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading">
                Recent Additions
              </h3>
              <Link 
                to="/dashboard/menu"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 flex items-center gap-1 transition-colors"
                style={{ color: brandColor }}
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-slate-400 gap-1.5">
                <Clock className="w-6 h-6 text-slate-300" />
                <span className="text-xs">No items added yet</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentItems.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-10 h-10 object-cover rounded-premium flex-shrink-0 border border-slate-100 dark:border-slate-800"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-premium flex-shrink-0 flex items-center justify-center text-lg">
                        🍲
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.veg ? "🟢 Veg" : "🔴 Non-Veg"} • {restaurant?.currency || "$"}{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardOverview;
