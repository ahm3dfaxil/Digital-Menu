import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Grid, 
  List, 
  Filter, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  Upload, 
  Loader2, 
  UtensilsCrossed, 
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  subscribeCategories, 
  subscribeMenuItems, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem 
} from "../services/db";
import { uploadImage } from "../services/storage";
import type { Category, MenuItem } from "../types";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Toggle from "../components/ui/Toggle";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import { CardSkeleton } from "../components/ui/Skeleton";

const menuItemSchema = z.object({
  name: z.string().min(2, "Dish name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  categoryId: z.string().min(1, "Please select a category"),
  image: z.string(),
  veg: z.boolean(),
  bestseller: z.boolean(),
  available: z.boolean(),
});

type MenuItemFields = z.infer<typeof menuItemSchema>;

type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export const MenuManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Layouts
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modals / forms state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  // Removed unused imageFile state
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [deleteItemObj, setDeleteItemObj] = useState<MenuItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemFields>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      image: "",
      veg: false,
      bestseller: false,
      available: true,
    }
  });

  const formVeg = watch("veg");
  const formBestseller = watch("bestseller");
  const formAvailable = watch("available");

  useEffect(() => {
    if (!restaurant) return;

    setLoading(true);
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

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setImagePreview("");
    // Removed unused state reset
    setSubmitError(null);
    reset({
      name: "",
      description: "",
      price: 0,
      categoryId: categories[0]?.id || "",
      image: "",
      veg: false,
      bestseller: false,
      available: true,
    });
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setImagePreview(item.image);
    // Removed unused state reset
    setSubmitError(null);
    reset({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId,
      image: item.image,
      veg: item.veg,
      bestseller: item.bestseller,
      available: item.available,
    });
    setIsFormOpen(true);
  };

  // Immediate Image Upload selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    setImagePreview(URL.createObjectURL(file));

    setUploadingImage(true);
    setSubmitError(null);
    try {
      const path = `restaurants/${restaurant.id}/menuItems/${Date.now()}_${file.name}`;
      const downloadUrl = await uploadImage(path, file);
      setValue("image", downloadUrl);
      setImagePreview(downloadUrl);
    } catch (err: any) {
      console.error(err);
      setSubmitError("Failed to upload dish photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Save / Submit Item
  const onSubmit = async (data: MenuItemFields) => {
    if (!restaurant) return;
    setSubmitError(null);

    try {
      if (editingItem) {
        await updateMenuItem(restaurant.id, editingItem.id, data);
      } else {
        await createMenuItem(restaurant.id, data);
      }
      setIsFormOpen(false);
      reset();
    } catch (error: any) {
      console.error(error);
      setSubmitError("Failed to save menu item. Check your connections.");
    }
  };

  // Delete Item
  const handleDeleteItem = async () => {
    if (!restaurant || !deleteItemObj) return;

    setDeleteLoading(true);
    try {
      await deleteMenuItem(restaurant.id, deleteItemObj.id);
      setDeleteItemObj(null);
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle Availability state straight from the list
  const handleToggleAvailable = async (item: MenuItem) => {
    if (!restaurant) return;
    try {
      await updateMenuItem(restaurant.id, item.id, { available: !item.available });
    } catch (error) {
      console.error("Failed to update item availability:", error);
    }
  };

  // Filter & Sort math logic
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      case "newest":
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : "Uncategorized";
  };

  const currencySymbol = restaurant?.currency || "$";

  return (
    <div className="space-y-8 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-900 dark:text-white">
            Menu Items
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            Manage your dishes, descriptions, pricing tiers, and availability switches.
          </p>
        </div>
        
        {categories.length > 0 && (
          <Button variant="primary" onClick={handleOpenCreate} className="self-start sm:self-auto shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Menu Item
          </Button>
        )}
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon="FolderOpen"
          title="Create a Category First"
          description="You need at least one category to assign menu items to. Please head over to Category Management."
          actionLabel="Go to Categories"
          onAction={() => window.location.href = "/dashboard/categories"}
        />
      ) : (
        <>
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-premium shadow-soft flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dish name, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-premium text-xs focus:outline-none w-full text-slate-850 dark:text-slate-150 focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Category Filter */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-premium px-3 py-1.5 focus:outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-premium px-3 py-1.5 focus:outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                >
                  <option value="newest">Newest Added</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>

              {/* Grid / List Toggles */}
              <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-premium p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-premium ${
                    viewMode === "grid" 
                      ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm" 
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                  } transition-all`}
                  title="Grid View"
                >
                  <Grid className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-premium ${
                    viewMode === "list" 
                      ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm" 
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                  } transition-all`}
                  title="List View"
                >
                  <List className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* List Items */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon="UtensilsCrossed"
              title="No Dishes Found"
              description={
                search || categoryFilter !== "all"
                  ? "We couldn't find any dishes matching your query/filters."
                  : "Start populating your menu with tasty dishes."
              }
              actionLabel={search || categoryFilter !== "all" ? undefined : "Add Dish"}
              onAction={handleOpenCreate}
            />
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`border ${
                    item.available 
                      ? "border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900" 
                      : "border-slate-200 dark:border-slate-850/50 bg-slate-50/50 dark:bg-slate-900/30 opacity-75"
                  } rounded-premium overflow-hidden shadow-soft hover:shadow-soft-lg transition-all flex flex-col justify-between`}
                >
                  <div>
                    {/* Header Image Frame */}
                    <div className="h-44 bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-850">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UtensilsCrossed className="w-12 h-12 text-slate-300 dark:text-slate-750" />
                      )}

                      {/* Veg Badge Overlay */}
                      <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 shadow-sm rounded-md p-1 border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1">
                        <span className={`w-2.5 h-2.5 border ${
                          item.veg ? "border-green-500 bg-green-500/20" : "border-red-500 bg-red-500/20"
                        } rounded-xs flex items-center justify-center text-[7px]`}>
                          {item.veg ? "🟢" : "🔴"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 pr-0.5">
                          {item.veg ? "Veg" : "Non-Veg"}
                        </span>
                      </div>

                      {/* Bestseller Badge Overlay */}
                      {item.bestseller && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                          ★ Bestseller
                        </div>
                      )}
                    </div>

                    {/* Content text */}
                    <div className="p-5 text-left space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                          {currencySymbol}{item.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                        {item.description}
                      </p>

                      <div className="pt-1">
                        <span className="inline-flex bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-450 border border-slate-100 dark:border-slate-750 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {getCategoryName(item.categoryId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer bar */}
                  <div className="px-5 py-3 border-t border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-850/10 flex items-center justify-between gap-4">
                    {/* Available Toggle */}
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none"
                    >
                      {item.available ? (
                        <>
                          <Eye className="w-4 h-4 text-emerald-500" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 text-slate-400" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteItemObj(item)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-premium shadow-soft overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dish</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-6 py-3.5 scope-col text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Labels</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative px-6 py-3.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={item.available ? "" : "opacity-75 bg-slate-50/20 dark:bg-slate-950/10"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-premium bg-slate-50 dark:bg-slate-950 flex-shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-850">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-premium" />
                            ) : (
                              <UtensilsCrossed className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md text-slate-500 dark:text-slate-400">
                          {getCategoryName(item.categoryId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900 dark:text-slate-100">
                        {currencySymbol}{item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            item.veg 
                              ? "bg-green-50 dark:bg-green-950/20 text-green-600 border-green-200 dark:border-green-900/50" 
                              : "bg-red-50 dark:bg-red-950/20 text-red-500 border-red-255/50 dark:border-red-950/50"
                          }`}>
                            {item.veg ? "Veg" : "Non-Veg"}
                          </span>
                          {item.bestseller && (
                            <span className="bg-amber-150/40 text-amber-600 border border-amber-250 dark:border-amber-900/40 dark:bg-amber-950/10 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Bestseller
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAvailable(item)}
                          className="focus:outline-none"
                        >
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            item.available 
                              ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400" 
                              : "bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {item.available ? "Visible" : "Hidden"}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-650"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteItemObj(item)}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? "Edit Menu Item" : "Add Menu Item"}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {submitError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-premium text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Image Upload Zone */}
            <div className="md:col-span-1 flex flex-col items-center gap-2 text-center">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider self-start">
                Dish Image
              </span>
              <div className="relative group w-full aspect-square bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-premium overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Dish preview" className="w-full h-full object-cover" />
                ) : (
                  <UtensilsCrossed className="w-8 h-8 text-slate-350 dark:text-slate-750" />
                )}

                {/* Upload Hover Overlay */}
                <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingImage ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mb-1" />
                      <span>Upload Photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[9px] text-slate-400 leading-normal">
                Leave empty to display default illustration.
              </p>
            </div>

            {/* Main Form Fields */}
            <div className="md:col-span-2 space-y-4">
              <Input
                label="Dish Name"
                type="text"
                placeholder="e.g. Garlic Mushroom Pasta"
                error={errors.name?.message}
                {...register("name")}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Dropdown */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    {...register("categoryId")}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-brand-500 focus:border-brand-500 rounded-premium text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all shadow-sm cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId?.message && (
                    <span className="text-xs text-red-500 font-medium">{errors.categoryId.message}</span>
                  )}
                </div>

                <Input
                  label={`Price (${currencySymbol})`}
                  type="number"
                  step="0.01"
                  placeholder="14.99"
                  error={errors.price?.message}
                  {...register("price", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Input
            label="Description / Ingredients"
            isTextArea
            rows={3}
            placeholder="e.g. Fettuccine tossed in a rich, creamy wild mushroom sauce with roasted garlic and fresh shaved parmesan."
            error={errors.description?.message}
            {...register("description")}
          />

          {/* Toggle Switches */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-premium-lg space-y-3.5">
            <Toggle
              checked={formVeg}
              onChange={(checked) => setValue("veg", checked)}
              label="Vegetarian Dish"
              description="Displays green badge for diners."
            />
            <div className="border-t border-slate-200/50 dark:border-slate-800/40 my-1" />
            <Toggle
              checked={formBestseller}
              onChange={(checked) => setValue("bestseller", checked)}
              label="Bestseller highlight"
              description="Places golden star and bestseller banner next to dish name."
            />
            <div className="border-t border-slate-200/50 dark:border-slate-800/40 my-1" />
            <Toggle
              checked={formAvailable}
              onChange={(checked) => setValue("available", checked)}
              label="In Stock / Available"
              description="If switched off, diners will see 'Sold Out' and cannot order."
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting || uploadingImage}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={uploadingImage}
            >
              {editingItem ? "Save Changes" : "Create Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteItemObj !== null}
        onClose={() => setDeleteItemObj(null)}
        title="Delete Menu Item"
        size="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto mb-2">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading">
            Delete "{deleteItemObj?.name}"?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Are you sure you want to delete this menu item? This action is permanent and cannot be undone.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteItemObj(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteItem}
              isLoading={deleteLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
export default MenuManagement;
