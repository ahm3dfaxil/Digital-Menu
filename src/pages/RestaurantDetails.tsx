import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Loader2, Save, Palette, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateRestaurant } from "../services/db";
import { uploadImage } from "../services/storage";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const restaurantSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().min(5, "Please enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  website: z.string().url("Enter a valid website URL starting with https://").or(z.literal("")),
  openingHours: z.string().min(3, "Opening hours are required"),
  themeColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Enter a valid hex color code"),
});

type RestaurantFields = z.infer<typeof restaurantSchema>;

const PRESET_COLORS = [
  { name: "MenuFlow Purple", hex: "#8b5cf6" },
  { name: "Ocean Blue", hex: "#3b82f6" },
  { name: "Forest Green", hex: "#10b981" },
  { name: "Amber Orange", hex: "#f59e0b" },
  { name: "Crimson Red", hex: "#ef4444" },
  { name: "Rose Pink", hex: "#f43f5e" },
  { name: "Slate Charcoal", hex: "#475569" },
];

export const RestaurantDetails: React.FC = () => {
  const { restaurant, updateRestaurantState } = useAuth();
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RestaurantFields>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: restaurant?.name || "",
      address: restaurant?.address || "",
      phone: restaurant?.phone || "",
      email: restaurant?.email || "",
      website: restaurant?.website || "",
      openingHours: restaurant?.openingHours || "Mon-Sun: 9:00 AM - 10:00 PM",
      themeColor: restaurant?.themeColor || "#8b5cf6",
    },
  });

  const selectedThemeColor = watch("themeColor");

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    setLogoUploading(true);
    setSaveError(null);
    try {
      const path = `restaurants/${restaurant.id}/logo_${Date.now()}`;
      const url = await uploadImage(path, file);
      // Save directly to Firestore and local state
      await updateRestaurant(restaurant.id, { logo: url });
      updateRestaurantState({ logo: url });
    } catch (err: any) {
      console.error(err);
      setSaveError("Failed to upload logo image.");
    } finally {
      setLogoUploading(false);
    }
  };

  const onBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;

    setBannerUploading(true);
    setSaveError(null);
    try {
      const path = `restaurants/${restaurant.id}/banner_${Date.now()}`;
      const url = await uploadImage(path, file);
      // Save directly to Firestore and local state
      await updateRestaurant(restaurant.id, { banner: url });
      updateRestaurantState({ banner: url });
    } catch (err: any) {
      console.error(err);
      setSaveError("Failed to upload banner image.");
    } finally {
      setBannerUploading(false);
    }
  };

  const onSubmit = async (data: RestaurantFields) => {
    if (!restaurant) return;
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await updateRestaurant(restaurant.id, data);
      updateRestaurantState(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Failed to update restaurant details.");
    }
  };

  return (
    <div className="space-y-8 text-left max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black font-heading text-slate-900 dark:text-white">
          Restaurant Settings
        </h1>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
          Customize branding, hours of operation, and contact cards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Visual uploads */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Logo Upload Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-premium-lg shadow-soft text-center flex flex-col items-center">
            <h3 className="text-sm font-bold font-heading text-slate-800 dark:text-slate-200 mb-4">
              Restaurant Logo
            </h3>
            <div className="relative group w-28 h-28 mb-4">
              {restaurant?.logo ? (
                <img 
                  src={restaurant.logo} 
                  alt="Restaurant Logo" 
                  className="w-full h-full object-cover rounded-full border-2 border-slate-100 dark:border-slate-850 shadow-soft"
                />
              ) : (
                <div className="w-full h-full bg-slate-50 dark:bg-slate-800 rounded-full border-2 border-dashed border-slate-350 dark:border-slate-700 flex items-center justify-center text-slate-400 text-2xl font-bold">
                  {restaurant?.name?.substring(0, 1) || "R"}
                </div>
              )}

              {/* Upload Hover Overlay */}
              <label className="absolute inset-0 bg-slate-900/60 rounded-full flex flex-col items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {logoUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 mb-1" />
                    <span>Upload Logo</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onLogoChange} 
                  disabled={logoUploading} 
                  className="hidden" 
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 max-w-[160px]">
              PNG or JPG recommended. Square image with transparent background.
            </p>
          </div>

          {/* Banner Upload Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-premium-lg shadow-soft text-center flex flex-col items-center">
            <h3 className="text-sm font-bold font-heading text-slate-800 dark:text-slate-200 mb-4">
              Cover Banner
            </h3>
            <div className="relative group w-full h-28 bg-slate-50 dark:bg-slate-800 rounded-premium border border-slate-250 dark:border-slate-750 overflow-hidden mb-4 shadow-sm">
              {restaurant?.banner ? (
                <img 
                  src={restaurant.banner} 
                  alt="Restaurant Banner" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                  <Upload className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Upload Cover Image</span>
                </div>
              )}

              <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {bannerUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 mb-1" />
                    <span>Upload Banner</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onBannerChange} 
                  disabled={bannerUploading} 
                  className="hidden" 
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-400">
              High resolution banner displayed at the top of the menu page.
            </p>
          </div>

        </div>

        {/* Right Column: Form inputs */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 lg:p-8 rounded-premium-lg shadow-soft space-y-6">
            
            {saveSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-premium text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Restaurant details updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-premium text-xs font-semibold text-red-600 dark:text-red-400">
                {saveError}
              </div>
            )}

            <Input
              label="Restaurant Name"
              type="text"
              placeholder="e.g. La Bella Bistro"
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Phone"
                type="text"
                placeholder="+1 (555) 019-2834"
                error={errors.phone?.message}
                {...register("phone")}
              />
              <Input
                label="Contact Email"
                type="email"
                placeholder="info@labellabistro.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Restaurant Website"
                type="text"
                placeholder="https://labellabistro.com (or empty)"
                error={errors.website?.message}
                {...register("website")}
              />
              <Input
                label="Opening Hours"
                type="text"
                placeholder="e.g. Mon-Fri: 9AM-10PM, Sat-Sun: 10AM-11PM"
                error={errors.openingHours?.message}
                {...register("openingHours")}
              />
            </div>

            <Input
              label="Street Address"
              type="text"
              placeholder="123 Delicious Lane, Foodtown, CA 90210"
              error={errors.address?.message}
              {...register("address")}
            />

            {/* Color preset theme selector */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-slate-400" />
                <span>Restaurant Brand Theme Color</span>
              </label>
              
              <div className="flex flex-wrap gap-2.5">
                {PRESET_COLORS.map((color) => {
                  const isChecked = selectedThemeColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setValue("themeColor", color.hex, { shouldDirty: true })}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-750 flex items-center justify-center shadow-sm relative focus:outline-none transition-transform hover:scale-105 cursor-pointer"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {isChecked && (
                        <Check className="w-4.5 h-4.5 text-white stroke-[3px]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-3 max-w-[200px] pt-1">
                <div 
                  className="w-9 h-9 rounded-premium border border-slate-350 dark:border-slate-750 flex-shrink-0"
                  style={{ backgroundColor: selectedThemeColor }}
                />
                <Input
                  type="text"
                  placeholder="#8b5cf6"
                  error={errors.themeColor?.message}
                  {...register("themeColor")}
                  className="text-xs"
                />
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3.5">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
export default RestaurantDetails;
