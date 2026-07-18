import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { 
  Users, 
  UtensilsCrossed, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Store, 
  Calendar, 
  Loader2, 
  ShieldCheck, 
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  adminGetUsers, 
  adminGetRestaurants, 
  adminGetCategories,
  adminGetAllMenuItems, 
  adminUpdateUserProfile, 
  adminDeleteUserAccount, 
  adminDeleteMenuItem, 
  adminUpdateMenuItem, 
  adminCreateMenuItem,
  resetMockDatabase
} from "../services/db";
import type { UserProfile, Restaurant, Category, MenuItem } from "../types";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

export const AdminDashboard: React.FC = () => {
  const { userProfile, isMock } = useAuth();

  // Core data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | "Admin" | "User">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Suspended">("All");
  const [sortBy, setSortBy] = useState<"name" | "dishes" | "date">("name");

  // Selected Owner Details Modal state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Edit / Add Dish form states inside owner details modal
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [dishName, setDishName] = useState("");
  const [dishPrice, setDishPrice] = useState("");
  const [dishCategory, setDishCategory] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [dishImage, setDishImage] = useState("");
  const [dishVeg, setDishVeg] = useState(true);
  const [dishBestseller, setDishBestseller] = useState(false);
  const [dishAvailable, setDishAvailable] = useState(true);

  // Delete user confirmation state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingUserRestId, setDeletingUserRestId] = useState<string | null>(null);
  const [isConfirmDeleteUserOpen, setIsConfirmDeleteUserOpen] = useState(false);

  // System statistics
  const [stats, setStats] = useState({
    totalOwners: 0,
    totalRestaurants: 0,
    totalDishes: 0,
    activeOwners: 0,
    suspendedOwners: 0,
    avgDishesPerRest: 0
  });

  // Redirect unauthorized users
  if (userProfile?.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Load all system data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allUsers, allRests, allCats, allItems] = await Promise.all([
          adminGetUsers(),
          adminGetRestaurants(),
          adminGetCategories(),
          adminGetAllMenuItems()
        ]);

        setUsers(allUsers);
        setRestaurants(allRests);
        setCategories(allCats);
        setMenuItems(allItems);

        // Compute stats
        const activeCount = allUsers.filter(u => u.status === "Active").length;
        const suspendedCount = allUsers.filter(u => u.status === "Suspended").length;
        const totalItemsCount = allItems.length;
        const totalRestsCount = allRests.length;
        const avg = totalRestsCount > 0 ? Math.round((totalItemsCount / totalRestsCount) * 10) / 10 : 0;

        setStats({
          totalOwners: allUsers.length,
          totalRestaurants: totalRestsCount,
          totalDishes: totalItemsCount,
          activeOwners: activeCount,
          suspendedOwners: suspendedCount,
          avgDishesPerRest: avg
        });
      } catch (error) {
        console.error("Failed to load admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  // Handle mock database reset
  const handleResetMockDb = () => {
    if (window.confirm("Are you sure you want to reset the mock sandbox? This will restore the default 5 mock owners and their menus.")) {
      resetMockDatabase();
      setRefreshKey(prev => prev + 1);
      setIsDetailsOpen(false);
      setSelectedUser(null);
    }
  };

  // Open details for a specific owner
  const handleOpenDetails = (user: UserProfile) => {
    const rest = restaurants.find(r => r.id === user.restaurantId) || null;
    setSelectedUser(user);
    setSelectedRestaurant(rest);
    setIsDetailsOpen(true);
    // Reset forms
    setIsAddingDish(false);
    setEditingDishId(null);
  };

  // Save changes to owner profile/status
  const handleToggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === "Suspended" ? "Active" : "Suspended";
    try {
      await adminUpdateUserProfile(user.uid, { status: newStatus });
      setRefreshKey(prev => prev + 1);
      // Update selected details modal if open
      if (selectedUser?.uid === user.uid) {
        setSelectedUser(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleUserRole = async (user: UserProfile) => {
    const newRole = user.role === "Admin" ? "User" : "Admin";
    try {
      await adminUpdateUserProfile(user.uid, { role: newRole });
      setRefreshKey(prev => prev + 1);
      if (selectedUser?.uid === user.uid) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmDeleteUser = (uid: string, restId: string) => {
    setDeletingUserId(uid);
    setDeletingUserRestId(restId);
    setIsConfirmDeleteUserOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId || !deletingUserRestId) return;
    try {
      await adminDeleteUserAccount(deletingUserId, deletingUserRestId);
      setRefreshKey(prev => prev + 1);
      setIsConfirmDeleteUserOpen(false);
      setIsDetailsOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  // Dish Operations (Admin editing user menus)
  const handleToggleDishAvailability = async (item: MenuItem) => {
    try {
      await adminUpdateMenuItem(item.restaurantId, item.id, { available: !item.available });
      setRefreshKey(prev => prev + 1);
      // Sync items in UI
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleDishBestseller = async (item: MenuItem) => {
    try {
      await adminUpdateMenuItem(item.restaurantId, item.id, { bestseller: !item.bestseller });
      setRefreshKey(prev => prev + 1);
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, bestseller: !i.bestseller } : i));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteDish = async (item: MenuItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await adminDeleteMenuItem(item.restaurantId, item.id);
        setRefreshKey(prev => prev + 1);
        setMenuItems(prev => prev.filter(i => i.id !== item.id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleEditDishClick = (item: MenuItem) => {
    setEditingDishId(item.id);
    setDishName(item.name);
    setDishPrice(item.price.toString());
    setDishCategory(item.categoryId);
    setDishDescription(item.description);
    setDishImage(item.image);
    setDishVeg(item.veg);
    setDishBestseller(item.bestseller);
    setDishAvailable(item.available);
    setIsAddingDish(true);
  };

  const handleAddDishClick = () => {
    setEditingDishId(null);
    setDishName("");
    setDishPrice("");
    // Default to first category of this restaurant if any
    const restCats = categories.filter(c => c.restaurantId === selectedRestaurant?.id);
    setDishCategory(restCats[0]?.id || "");
    setDishDescription("");
    setDishImage("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60");
    setDishVeg(true);
    setDishBestseller(false);
    setDishAvailable(true);
    setIsAddingDish(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;

    const priceNum = parseFloat(dishPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    const itemData = {
      categoryId: dishCategory,
      name: dishName,
      description: dishDescription,
      price: priceNum,
      image: dishImage,
      veg: dishVeg,
      bestseller: dishBestseller,
      available: dishAvailable
    };

    try {
      if (editingDishId) {
        // Edit existing
        await adminUpdateMenuItem(selectedRestaurant.id, editingDishId, itemData);
      } else {
        // Create new
        await adminCreateMenuItem(selectedRestaurant.id, itemData);
      }
      setRefreshKey(prev => prev + 1);
      setIsAddingDish(false);
      setEditingDishId(null);
    } catch (error) {
      console.error(error);
    }
  };

  // Filter and Search Owners logic
  const filteredUsers = users.filter(user => {
    // Exclude admins (except demo owner if they are both)
    if (user.role === "Admin" && user.uid !== "demo_user_123") {
      // unless role filter is set to Admin
      if (roleFilter !== "Admin") return false;
    }

    const rest = restaurants.find(r => r.id === user.restaurantId);
    
    // Search filter
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rest && rest.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Role filter
    const matchesRole = 
      roleFilter === "All" || 
      (user.role || "User") === roleFilter;

    // Status filter
    const matchesStatus = 
      statusFilter === "All" || 
      (user.status || "Active") === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    const dishesCountA = menuItems.filter(i => i.restaurantId === a.restaurantId).length;
    const dishesCountB = menuItems.filter(i => i.restaurantId === b.restaurantId).length;

    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "dishes") {
      return dishesCountB - dishesCountA;
    } else {
      return b.createdAt.localeCompare(a.createdAt);
    }
  });

  return (
    <div className="space-y-8 text-left">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            System Administration • Digital Menu Creator Platform
          </p>
        </div>

        <div className="flex gap-3">
          {isMock && (
            <button
              onClick={handleResetMockDb}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-premium hover:bg-slate-50 dark:hover:bg-slate-850 shadow-soft transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Sandbox</span>
            </button>
          )}
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 dark:bg-brand-600 rounded-premium shadow-md shadow-brand-500/10 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Dashboard */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-premium shadow-soft animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-premium shadow-soft flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-premium bg-brand-50 dark:bg-purple-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Owners</p>
              <h3 className="text-2xl font-black font-heading text-slate-800 dark:text-slate-100 mt-0.5">{stats.totalOwners}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{stats.activeOwners} Active Accounts</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-premium shadow-soft flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-premium bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Restaurants</p>
              <h3 className="text-2xl font-black font-heading text-slate-800 dark:text-slate-100 mt-0.5">{stats.totalRestaurants}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Live Storefront Profiles</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-premium shadow-soft flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-premium bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Dishes</p>
              <h3 className="text-2xl font-black font-heading text-slate-800 dark:text-slate-100 mt-0.5">{stats.totalDishes}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{stats.avgDishesPerRest} Avg Per Menu</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-premium shadow-soft flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-premium bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suspended</p>
              <h3 className="text-2xl font-black font-heading text-slate-800 dark:text-slate-100 mt-0.5">{stats.suspendedOwners}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Accounts Blocked</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-premium-lg shadow-soft overflow-hidden">
        {/* Search, Filter & Sort Controls */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search owners, email, restaurant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-brand-500 dark:focus:border-brand-500 rounded-premium text-xs focus:outline-none text-slate-800 dark:text-slate-200 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Filter Role */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-premium text-xs focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-premium text-xs focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-premium text-xs focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm"
              >
                <option value="name">Name (A-Z)</option>
                <option value="dishes">Dishes Count</option>
                <option value="date">Reg Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owner Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2.5">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <span className="text-xs">Loading accounts database...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center gap-2">
            <Store className="w-10 h-10 text-slate-300 dark:text-slate-700" />
            <span className="text-xs font-bold text-slate-500">No accounts match the criteria</span>
            <span className="text-[10px] text-slate-400">Try adjusting your filters or search criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4">Restaurant / Owner</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Reg Date</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Dishes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.map((user) => {
                  const rest = restaurants.find(r => r.id === user.restaurantId);
                  const dishesCount = menuItems.filter(i => i.restaurantId === user.restaurantId).length;
                  const regDate = new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });

                  return (
                    <tr 
                      key={user.uid}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors text-xs text-slate-600 dark:text-slate-300"
                    >
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8.5 h-8.5 rounded-premium flex items-center justify-center font-bold text-white shadow-soft"
                            style={{ backgroundColor: rest?.themeColor || "#8b5cf6" }}
                          >
                            {rest?.name?.substring(0, 1) || "R"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {rest?.name || "No Restaurant"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              By: {user.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 font-medium">{user.email}</td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{regDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          user.role === "Admin"
                            ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                          {user.role || "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dishesCount} dishes</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          (user.status || "Active") === "Active"
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-305"
                            : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-305 animate-pulse"
                        }`}>
                          {user.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetails(user)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-premium hover:shadow-soft transition-all cursor-pointer"
                            title="Manage dishes & settings"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`p-1.5 rounded-premium hover:shadow-soft transition-all cursor-pointer ${
                              user.status === "Suspended"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 hover:bg-emerald-100"
                                : "bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100"
                            }`}
                            title={user.status === "Suspended" ? "Activate Account" : "Suspend Account"}
                          >
                            {user.status === "Suspended" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleConfirmDeleteUser(user.uid, user.restaurantId)}
                            className="p-1.5 bg-red-50/50 dark:bg-red-950/10 text-red-500 hover:bg-red-600 hover:text-white rounded-premium hover:shadow-soft transition-all cursor-pointer"
                            title="Delete Owner Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Owner & Dishes Management Modal (XL size) */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setIsAddingDish(false);
          setEditingDishId(null);
        }}
        title={`Store Management: ${selectedRestaurant?.name || "Loading..."}`}
        size="xl"
      >
        {selectedUser && selectedRestaurant && (
          <div className="space-y-6 text-slate-800 dark:text-slate-200">
            {/* Header info card */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-premium flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-4 items-center">
                <div 
                  className="w-12 h-12 rounded-premium flex items-center justify-center font-bold text-white shadow-soft text-lg"
                  style={{ backgroundColor: selectedRestaurant.themeColor || "#8b5cf6" }}
                >
                  {selectedRestaurant.name.substring(0, 1)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-heading">
                    {selectedRestaurant.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Owner: {selectedUser.name} ({selectedUser.email})
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Currency: {selectedRestaurant.currency} • Language: {selectedRestaurant.language}
                  </p>
                </div>
              </div>

              {/* Status toggles inside details */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wide font-bold text-slate-400">Status</span>
                  <button
                    onClick={() => handleToggleUserStatus(selectedUser)}
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      selectedUser.status === "Suspended"
                        ? "bg-red-100 dark:bg-red-950/40 text-red-600"
                        : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                    }`}
                  >
                    {selectedUser.status || "Active"} (Click to Toggle)
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wide font-bold text-slate-400">Role</span>
                  <button
                    onClick={() => handleToggleUserRole(selectedUser)}
                    className="px-3 py-1 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {selectedUser.role || "User"}
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wide font-bold text-slate-400">Total Items</span>
                  <span className="px-3 py-1 rounded text-xs font-bold bg-brand-50 dark:bg-purple-950/40 text-brand-600">
                    {menuItems.filter(i => i.restaurantId === selectedRestaurant.id).length} dishes
                  </span>
                </div>
              </div>
            </div>

            {/* Inline Dish Form (Add/Edit) */}
            {isAddingDish ? (
              <form onSubmit={handleSaveDish} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-brand-500/30 rounded-premium space-y-4 shadow-soft">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-heading">
                    {editingDishId ? "✏️ Edit MenuItem" : "✨ Add New MenuItem"}
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => { setIsAddingDish(false); setEditingDishId(null); }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-655"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Dish Name"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="Classic Margherita Pizza"
                    required
                  />
                  <Input
                    label={`Price (${selectedRestaurant.currency || "$"})`}
                    type="number"
                    step="0.01"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="12.99"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={dishCategory}
                      onChange={(e) => setDishCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-premium text-sm focus:outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select Category</option>
                      {categories.filter(c => c.restaurantId === selectedRestaurant.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Image URL"
                    value={dishImage}
                    onChange={(e) => setDishImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <Input
                  label="Description"
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="Rich tomato sauce, fresh buffalo mozzarella, olive oil, and sweet basil leaves."
                />

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={dishVeg}
                      onChange={(e) => setDishVeg(e.target.checked)}
                      className="rounded border-slate-200 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Veg / Vegetarian Dish</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={dishBestseller}
                      onChange={(e) => setDishBestseller(e.target.checked)}
                      className="rounded border-slate-200 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Mark Bestseller 🌟</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={dishAvailable}
                      onChange={(e) => setDishAvailable(e.target.checked)}
                      className="rounded border-slate-200 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Available / In Stock</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setIsAddingDish(false); setEditingDishId(null); }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingDishId ? "Save Changes" : "Create Item"}
                  </Button>
                </div>
              </form>
            ) : (
              // Add Dish Button
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-heading uppercase tracking-wide">
                  Menu Items / Dishes
                </h4>
                <button
                  onClick={handleAddDishClick}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-premium shadow-md shadow-brand-500/10 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Dish Item</span>
                </button>
              </div>
            )}

            {/* Dishes list table */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-premium overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3">Dish / Info</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Diet Type</th>
                    <th className="px-5 py-3">Bestseller</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                  {menuItems.filter(item => item.restaurantId === selectedRestaurant.id).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No dishes found for this restaurant menu.
                      </td>
                    </tr>
                  ) : (
                    menuItems.filter(item => item.restaurantId === selectedRestaurant.id).map(item => {
                      const cat = categories.find(c => c.id === item.categoryId);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-9 h-9 object-cover rounded-premium border border-slate-100 dark:border-slate-800 flex-shrink-0" />
                              ) : (
                                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-premium flex items-center justify-center text-lg flex-shrink-0">🍲</div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">{item.name}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[150px]" title={item.description}>
                                  {item.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                            {cat?.name || "Uncategorized"}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                            {selectedRestaurant.currency || "$"}{item.price.toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              item.veg 
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" 
                                : "bg-red-50 dark:bg-red-950/20 text-red-600"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.veg ? "bg-emerald-500" : "bg-red-500"}`} />
                              {item.veg ? "VEG" : "NON-VEG"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleToggleDishBestseller(item)}
                              className={`p-1.5 rounded-premium text-sm cursor-pointer ${
                                item.bestseller 
                                  ? "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20" 
                                  : "text-slate-300 hover:text-amber-500 dark:text-slate-600"
                              }`}
                            >
                              🌟
                            </button>
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleToggleDishAvailability(item)}
                              className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer ${
                                item.available 
                                  ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {item.available ? "AVAILABLE" : "OUT OF STOCK"}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEditDishClick(item)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded cursor-pointer"
                                title="Edit Dish"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDish(item)}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded cursor-pointer"
                                title="Delete Dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Action controls footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsOpen(false);
                  setIsAddingDish(false);
                  setEditingDishId(null);
                }}
              >
                Close View
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={isConfirmDeleteUserOpen}
        onClose={() => setIsConfirmDeleteUserOpen(false)}
        title="Permanently Delete Owner Account"
        size="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto mb-2 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading">
              Are you absolutely sure?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              This action is destructive and will completely delete the owner profile, restaurant details, categories, and all associated menu items. This cannot be undone.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmDeleteUserOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteUser}
            >
              Confirm Destructive Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
