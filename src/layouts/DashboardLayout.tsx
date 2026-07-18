import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Store, 
  FolderHeart, 
  UtensilsCrossed, 
  QrCode, 
  Settings as SettingsIcon,
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell, 
  Sun,
  Moon,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const DashboardLayout: React.FC = () => {
  const { userProfile, restaurant, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Restaurant", path: "/dashboard/restaurant", icon: Store },
    { name: "Categories", path: "/dashboard/categories", icon: FolderHeart },
    { name: "Menu Items", path: "/dashboard/menu", icon: UtensilsCrossed },
    { name: "QR Code", path: "/dashboard/qr-code", icon: QrCode },
    ...(userProfile?.role === "Admin" ? [{ name: "Admin Panel", path: "/dashboard/admin", icon: ShieldCheck }] : []),
    { name: "Settings", path: "/dashboard/settings", icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const getPageTitle = () => {
    const currentPath = location.pathname;
    const matched = navItems.find(item => item.path === currentPath);
    return matched ? matched.name : "Overview";
  };

  const currentThemeColor = restaurant?.themeColor || "#8b5cf6";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 gap-2.5">
        <div className="w-8 h-8 rounded-premium bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold shadow-soft">
          M
        </div>
        <span className="text-lg font-bold font-heading bg-gradient-to-r from-slate-900 via-brand-600 to-brand-500 bg-clip-text text-transparent dark:from-slate-100">
          MenuFlow
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3.5 px-4 py-3 rounded-premium text-sm font-semibold transition-all group ${
                isActive
                  ? "text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {/* Active Background Slide */}
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-brand-50/50 dark:bg-brand-950/20 border-l-4 rounded-premium"
                  style={{ borderColor: currentThemeColor }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon 
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                }`}
                style={isActive ? { color: currentThemeColor } : undefined}
              />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Restaurant Owner Profile Summary */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-premium mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm uppercase">
            {userProfile?.name?.substring(0, 2) || "OW"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {restaurant?.name || "My Restaurant"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {userProfile?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-premium text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="w-5 h-5 text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (AnimatePresence) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm dark:bg-slate-950/80"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-64 h-full z-10 flex flex-col"
            >
              {sidebarContent}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-[-48px] p-2 bg-white dark:bg-slate-900 rounded-r-md text-slate-500 border-y border-r border-slate-100 dark:border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-premium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base lg:text-lg font-bold font-heading text-slate-800 dark:text-slate-100">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3 lg:gap-4.5">
            {/* Search (Mock) */}
            <div className="relative hidden md:block max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-slate-200 dark:focus:border-slate-700 rounded-premium text-xs focus:outline-none w-48 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-premium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Notification Drawer (Mock) */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-premium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 relative transition-colors"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-premium-lg border border-slate-100 dark:border-slate-800 shadow-soft-lg z-50 p-4"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex gap-2.5 p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Welcome to MenuFlow!</p>
                            <p className="text-[10px] text-slate-400">Complete setup to activate your online QR code menu.</p>
                          </div>
                        </div>
                        <div className="flex gap-2.5 p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Analytics tracking</p>
                            <p className="text-[10px] text-slate-400">QR code scan tracking feature is coming soon.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-8.5 h-8.5 rounded-full bg-brand-100 dark:bg-brand-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold uppercase text-xs cursor-pointer"
              >
                {userProfile?.name?.substring(0, 2) || "OW"}
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-52 bg-white dark:bg-slate-900 rounded-premium border border-slate-100 dark:border-slate-800 shadow-soft-lg z-50 py-1.5"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{userProfile?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{userProfile?.email}</p>
                      </div>
                      
                      <Link
                        to="/dashboard/restaurant"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Store className="w-4 h-4 text-slate-400" />
                        <span>Restaurant Profile</span>
                      </Link>

                      <Link
                        to="/dashboard/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-slate-400" />
                        <span>Settings</span>
                      </Link>

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
