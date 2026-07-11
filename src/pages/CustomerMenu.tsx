import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { 
  Search, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  UtensilsCrossed, 
  AlertCircle,
  Smile,
  Mail
} from "lucide-react";
import { getRestaurantPublic, subscribeCategories, subscribeMenuItems } from "../services/db";
import { applyThemeColor } from "../utils/theme";
import type { Restaurant, Category, MenuItem } from "../types";

export const CustomerMenu: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [vegOnly, setVegOnly] = useState(false);

  // References to section headers for IntersectionObserver
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    if (!restaurantId) {
      setErrorMsg("Invalid URL. Restaurant ID is missing.");
      setLoading(false);
      return;
    }

    const loadMenu = async () => {
      try {
        setLoading(true);
        // Load restaurant profile
        const rest = await getRestaurantPublic(restaurantId);
        if (!rest) {
          setErrorMsg("Restaurant not found. Please verify the QR code.");
          setLoading(false);
          return;
        }

        setRestaurant(rest);
        // Apply custom theme colors dynamically to Root html
        applyThemeColor(rest.themeColor);

        // Subscribe to Categories
        const unsubCats = subscribeCategories(restaurantId, (cats) => {
          setCategories(cats);
          if (cats.length > 0 && !activeCategory) {
            setActiveCategory(cats[0].id);
          }
        });

        // Subscribe to Menu Items
        const unsubItems = subscribeMenuItems(restaurantId, (items) => {
          setMenuItems(items);
          setLoading(false);
        });

        return () => {
          unsubCats();
          unsubItems();
        };

      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to connect to the restaurant database.");
        setLoading(false);
      }
    };

    loadMenu();
  }, [restaurantId]);

  // Set up IntersectionObserver to sync active category tab during scrolling
  useEffect(() => {
    if (categories.length === 0 || loading) return;

    const observerOptions = {
      root: null, // viewport
      rootMargin: "-110px 0px -75% 0px", // triggers when heading is in the top section
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveCategory(entry.target.id.replace("category-section-", ""));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    categories.forEach((cat) => {
      const el = sectionsRef.current[`category-section-${cat.id}`];
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [categories, loading]);

  const handleTabClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    const target = sectionsRef.current[`category-section-${categoryId}`];
    if (target) {
      // Offset scroll margin is defined in Tailwind styling, but we scroll smoothly here
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-6">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Loading Digital Menu...
        </p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-6 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
          Menu Unavailable
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {errorMsg}
        </p>
      </div>
    );
  }

  // Filter Items
  const getFilteredItemsByCategory = (catId: string) => {
    return menuItems.filter((item) => {
      const matchesCategory = item.categoryId === catId;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.description.toLowerCase().includes(search.toLowerCase());
      const matchesVeg = !vegOnly || item.veg;
      return matchesCategory && matchesSearch && matchesVeg;
    });
  };

  const currencySymbol = restaurant?.currency || "$";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 pb-20 select-none">
      
      {/* Banner Picture */}
      <div className="h-44 md:h-60 bg-slate-200 dark:bg-slate-900 relative overflow-hidden">
        {restaurant?.banner ? (
          <img 
            src={restaurant.banner} 
            alt={restaurant.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-brand-600/80 to-indigo-600/80" />
        )}
      </div>

      {/* Restaurant Meta Header */}
      <div className="max-w-2xl mx-auto px-4 relative mt-[-40px] mb-6 space-y-4">
        {/* Floating Brand Logo */}
        <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 p-1 border-2 border-white dark:border-slate-900 shadow-md overflow-hidden mx-auto md:mx-0">
          {restaurant?.logo ? (
            <img 
              src={restaurant.logo} 
              alt="Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-2xl uppercase rounded-full">
              {restaurant?.name?.substring(0, 1)}
            </div>
          )}
        </div>

        {/* Info detail */}
        <div className="text-center md:text-left space-y-2">
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-950 dark:text-white">
              {restaurant?.name}
            </h1>
            {restaurant?.openingHours && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center justify-center md:justify-start gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                <span>{restaurant.openingHours}</span>
              </p>
            )}
          </div>

          {restaurant?.address && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-1.5">
              <MapPin className="w-4 h-4 text-slate-405 flex-shrink-0" />
              <span>{restaurant.address}</span>
            </p>
          )}

          {/* Social Contact Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs pt-1.5 text-slate-400">
            {restaurant?.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:text-brand-500 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
            {restaurant?.phone && restaurant?.email && <span className="text-slate-300 dark:text-slate-800">•</span>}
            {restaurant?.email && (
              <a href={`mailto:${restaurant.email}`} className="flex items-center gap-1 hover:text-brand-500 transition-colors">
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            )}
            {restaurant?.email && restaurant?.website && <span className="text-slate-300 dark:text-slate-800">•</span>}
            {restaurant?.website && (
              <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-brand-500 transition-colors">
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Filters & Nav Area */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 py-3 space-y-3.5 px-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-900 border border-transparent rounded-full text-xs focus:outline-none w-full text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-850 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Veg Only filter */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3.5 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 transition-all ${
              vegOnly 
                ? "bg-green-600 border-green-600 text-white shadow-sm" 
                : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50"
            }`}
          >
            <span className={vegOnly ? "text-white" : "text-green-500"}>🟢</span>
            <span>Veg Only</span>
          </button>
        </div>

        {/* Categories horizontal tabs */}
        {categories.length > 0 && (
          <div className="max-w-2xl mx-auto overflow-x-auto scrollbar-none flex gap-1.5 pb-0.5">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleTabClick(cat.id)}
                  className={`px-4.5 py-2 text-xs font-bold font-heading whitespace-nowrap rounded-full transition-all flex-shrink-0 ${
                    isActive 
                      ? "bg-brand-600 text-white shadow-sm" 
                      : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
                  }`}
                  style={isActive ? { backgroundColor: restaurant?.themeColor } : undefined}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Menu Dish List */}
      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-10 text-left">
        {categories.length === 0 ? (
          <div className="py-12 text-center text-slate-450 gap-2 flex flex-col items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-slate-300" />
            <span className="text-xs">The menu is empty. Check back later!</span>
          </div>
        ) : (
          categories.map((cat) => {
            const items = getFilteredItemsByCategory(cat.id);
            if (items.length === 0) return null;

            return (
              <section 
                key={cat.id} 
                id={`category-section-${cat.id}`}
                ref={(el) => { sectionsRef.current[`category-section-${cat.id}`] = el; }}
                // Dynamic margins for custom smooth scrolling offsets
                className="space-y-4.5 scroll-mt-28"
              >
                {/* Category Header */}
                <h3 className="text-base font-extrabold font-heading text-slate-900 dark:text-white border-l-4 pl-3.5 py-0.5" style={{ borderColor: restaurant?.themeColor }}>
                  {cat.name}
                </h3>

                {/* Items Grid */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`relative bg-white dark:bg-slate-900 border ${
                        item.available 
                          ? "border-slate-100 dark:border-slate-850/80 shadow-soft" 
                          : "border-slate-200 dark:border-slate-900 opacity-60"
                      } rounded-premium p-4 flex gap-4 items-center`}
                    >
                      {/* Image / Icon */}
                      <div className="w-20 h-20 rounded-premium bg-slate-50 dark:bg-slate-950 flex-shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-850 relative overflow-hidden">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UtensilsCrossed className="w-7 h-7 text-slate-300" />
                        )}

                        {/* Sold out visual overlay */}
                        {!item.available && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                            <span className="text-[8px] font-black text-white bg-black/60 py-0.5 px-1.5 rounded-full uppercase tracking-wider">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-150 truncate">
                              {item.name}
                            </h4>
                            <span className={`w-2.5 h-2.5 border ${
                              item.veg ? "border-green-500 bg-green-500/20" : "border-red-500 bg-red-500/20"
                            } rounded-xs flex items-center justify-center text-[5px] flex-shrink-0`}>
                              {item.veg ? "🟢" : "🔴"}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-950 dark:text-slate-50 flex-shrink-0" style={{ color: restaurant?.themeColor }}>
                            {currencySymbol}{item.price.toFixed(2)}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-450 dark:text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Badges footer */}
                        <div className="flex items-center gap-2 text-[8px] font-extrabold uppercase">
                          {item.bestseller && (
                            <span className="bg-amber-500 text-white px-2 py-0.5 rounded-md shadow-xs flex-shrink-0">
                              ★ Bestseller
                            </span>
                          )}
                          {!item.available && (
                            <span className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-md flex-shrink-0">
                              Sold Out
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* Dynamic active categories empty placeholder */}
        {categories.length > 0 && getFilteredItemsByCategory(activeCategory).length === 0 && search && (
          <div className="py-12 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
            <Smile className="w-8 h-8 text-slate-350" />
            <span className="text-xs">No items match your filter criteria</span>
          </div>
        )}
      </div>
      
    </div>
  );
};
export default CustomerMenu;
