import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  GripVertical, 
  FolderHeart
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { 
  subscribeCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  reorderCategories 
} from "../services/db";
import type { Category } from "../types";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import { ListSkeleton } from "../components/ui/Skeleton";

export const CategoryManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / forms state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Drag and drop index state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!restaurant) return;

    setLoading(true);
    const unsubscribe = subscribeCategories(restaurant.id, (cats) => {
      setCategories(cats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurant]);

  // Create Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newCatName.trim()) return;

    setAddLoading(true);
    try {
      const nextDisplayOrder = categories.length;
      await createCategory(restaurant.id, newCatName.trim(), nextDisplayOrder);
      setNewCatName("");
      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to add category:", error);
    } finally {
      setAddLoading(false);
    }
  };

  // Edit Category
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !editCat || !editName.trim()) return;

    setEditLoading(true);
    try {
      await updateCategory(restaurant.id, editCat.id, editName.trim());
      setEditCat(null);
      setEditName("");
    } catch (error) {
      console.error("Failed to update category:", error);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!restaurant || !deleteCat) return;

    setDeleteLoading(true);
    try {
      await deleteCategory(restaurant.id, deleteCat.id);
      setDeleteCat(null);
    } catch (error) {
      console.error("Failed to delete category:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Needed for Firefox support
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (index !== draggedIndex && index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!restaurant || draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...categories];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    // Update local state immediately for fast feedback
    setCategories(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      await reorderCategories(restaurant.id, updated);
    } catch (error) {
      console.error("Failed to save category order:", error);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const themeColor = restaurant?.themeColor || "#8b5cf6";

  return (
    <div className="space-y-8 text-left max-w-3xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-900 dark:text-white">
            Categories
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            Create menus sub-headings and adjust display layouts.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsAddOpen(true)}
          className="self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : categories.length === 0 ? (
        <EmptyState
          icon="FolderOpen"
          title="No Categories Yet"
          description="Create your first category (e.g. Appetizers, Main Course) to start organizing your digital restaurant menu."
          actionLabel="Add Category"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5" />
            <span>Drag the handles left of each row to reorder dining sections.</span>
          </p>
          
          <div className="space-y-2.5">
            <AnimatePresence>
              {categories.map((cat, index) => {
                const isDragging = draggedIndex === index;
                const isOver = dragOverIndex === index;
                return (
                  <motion.div
                    key={cat.id}
                    layoutId={cat.id}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, index)}
                    onDragOver={(e: any) => handleDragOver(e, index)}
                    onDrop={(e: any) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 border ${
                      isDragging 
                        ? "border-brand-500/50 shadow-soft-lg scale-[1.01] opacity-60" 
                        : isOver 
                          ? "border-brand-400/40 bg-brand-50/10 dark:bg-brand-950/5 shadow-sm" 
                          : "border-slate-100 dark:border-slate-800"
                    } rounded-premium shadow-soft transition-all duration-150`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Drag Handle */}
                      <div 
                        className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-850"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-premium bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-brand-600 dark:text-brand-400 flex-shrink-0" style={{ color: themeColor }}>
                          <FolderHeart className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                          {cat.name}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditCat(cat);
                          setEditName(cat.name);
                        }}
                        className="p-2 rounded-full text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Edit name"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCat(cat)}
                        className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setNewCatName("");
        }}
        title="Add Category"
        size="sm"
      >
        <form onSubmit={handleAddCategory} className="space-y-4">
          <Input
            label="Category Name"
            type="text"
            placeholder="e.g. Mains, Hot Coffees, Pastas"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setNewCatName("");
              }}
              disabled={addLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={addLoading}
              disabled={!newCatName.trim()}
            >
              Add Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editCat !== null}
        onClose={() => {
          setEditCat(null);
          setEditName("");
        }}
        title="Edit Category Name"
        size="sm"
      >
        <form onSubmit={handleEditCategory} className="space-y-4">
          <Input
            label="Category Name"
            type="text"
            placeholder="e.g. Sides"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditCat(null);
                setEditName("");
              }}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={editLoading}
              disabled={!editName.trim() || editName === editCat?.name}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteCat !== null}
        onClose={() => setDeleteCat(null)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto mb-2">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-heading">
            Are you sure you want to delete "{deleteCat?.name}"?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            WARNING: Deleting this category will also delete all associated menu items. This action is irreversible.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteCat(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteCategory}
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
export default CategoryManagement;
