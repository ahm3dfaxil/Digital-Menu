import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Settings as SettingsIcon, 
  Trash2, 
  Globe, 
  DollarSign, 
  Check, 
  AlertTriangle,
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { updateRestaurant } from "../services/db";
import Button from "../components/ui/Button";
import Toggle from "../components/ui/Toggle";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen (¥)" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "it", label: "Italiano (Italian)" },
  { code: "ar", label: "العربية (Arabic)" },
];

export const Settings: React.FC = () => {
  const { restaurant, deleteRestaurantAccount, updateRestaurantState, userProfile, updateUserProfileState } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // Settings states
  const [currency, setCurrency] = useState(restaurant?.currency || "USD");
  const [language, setLanguage] = useState(restaurant?.language || "en");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSaveSettings = async () => {
    if (!restaurant) return;
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const updates = { currency, language };
      await updateRestaurant(restaurant.id, updates);
      updateRestaurantState(updates);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteRestaurantAccount();
      setIsDeleteOpen(false);
      navigate("/register");
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || "Failed to delete account. You may need to re-authenticate.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentThemeColor = restaurant?.themeColor || "#8b5cf6";

  return (
    <div className="space-y-8 text-left max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black font-heading text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
          Set up preferences, currency tables, languages, and account status.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-premium text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-2 max-w-2xl">
          <Check className="w-4 h-4" />
          <span>General settings saved successfully!</span>
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        {/* Core preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-premium-lg shadow-soft space-y-5">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-heading flex items-center gap-2 mb-2">
            <SettingsIcon className="w-4.5 h-4.5 text-brand-500" style={{ color: currentThemeColor }} />
            <span>Preferences</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Currency Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span>Currency Display</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-premium text-sm focus:outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code}>{cur.label}</option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>Default Menu Language</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-premium text-sm focus:outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>

            {/* Account Role Selector (Developer Quick Test) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Account Role</span>
              </label>
              <select
                value={userProfile?.role || "User"}
                onChange={async (e) => {
                  const role = e.target.value as "Admin" | "User";
                  try {
                    await updateUserProfileState({ role });
                  } catch (err) {
                    console.error("Failed to switch role:", err);
                  }
                }}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-premium text-sm focus:outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="User">User (Owner)</option>
                <option value="Admin">Admin (System)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            {/* Dark mode Toggle */}
            <Toggle
              checked={darkMode}
              onChange={toggleDarkMode}
              label="Interface Dark Mode"
              description="Switch between light and dark visual themes for this dashboard."
            />
          </div>

          <div className="flex justify-end pt-3">
            <Button
              onClick={handleSaveSettings}
              isLoading={saveLoading}
              className="px-5"
            >
              Save Preferences
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50/10 dark:bg-red-950/5 border border-red-200/50 dark:border-red-900/30 p-6 rounded-premium-lg shadow-soft space-y-4.5">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-extrabold text-red-600 dark:text-red-400 font-heading">
              Danger Zone
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Deleting your account will permanently wipe out your restaurant profile, layout branding, category indices, and all published menu items. This cannot be undone.
          </p>
          <div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="shadow-sm shadow-red-500/10"
            >
              Delete Account
            </Button>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteConfirmText("");
          setDeleteError(null);
        }}
        title="Permanently Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto mb-2 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading">
              Are you absolutely sure?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              This action is destructive and will remove all your data from Firebase.
            </p>
          </div>

          {deleteError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-premium text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">
              Type <strong className="text-slate-700 dark:text-slate-200">DELETE</strong> to confirm:
            </p>
            <Input
              type="text"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="text-center uppercase font-bold"
            />
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setDeleteConfirmText("");
                setDeleteError(null);
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteConfirmText !== "DELETE"}
              onClick={handleDeleteAccount}
              isLoading={deleteLoading}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default Settings;
