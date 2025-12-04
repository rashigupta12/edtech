// src/app/(protected)/dashboard/admin/categories/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Eye,
  EyeOff,
  FolderOpen,
  GripVertical,
  Layers,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CategoryFormData = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    icon: "",
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const response = await res.json();

      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch categories",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !editingCategory) {
      const slug = formData.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, editingCategory]);

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        icon: category.icon || "",
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        icon: "",
        isActive: true,
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "",
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Required Field",
        text: "Category name is required",
      });
      return;
    }

    setSaving(true);

    try {
      const url = editingCategory
        ? `/api/categories?id=${editingCategory.id}`
        : "/api/categories";

      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: editingCategory ? "Category Updated!" : "Category Created!",
          text: response.message,
          timer: 2000,
          showConfirmButton: false,
        });
        handleCloseDialog();
        fetchCategories();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Operation failed",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete <strong>"${category.name}"</strong>.<br>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/categories?id=${category.id}`, {
        method: "DELETE",
      });

      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Category has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchCategories();
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: response.error?.message || "Failed to delete category",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the category.",
      });
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const res = await fetch(`/api/categories?id=${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });

      const response = await res.json();

      if (response.success) {
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update category status",
      });
    }
  };

  // Drag and Drop for reordering
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newCategories = [...categories];
    const draggedCategory = newCategories[draggedItem];
    newCategories.splice(draggedItem, 1);
    newCategories.splice(index, 0, draggedCategory);

    // Update sort orders
    const updatedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      sortOrder: idx,
    }));

    setCategories(updatedCategories);
    setDraggedItem(index);
  };

  const handleDragEnd = async () => {
    if (draggedItem === null) return;

    try {
      const res = await fetch("/api/categories?reorder=true", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: categories.map((cat) => ({
            id: cat.id,
            sortOrder: cat.sortOrder,
          })),
        }),
      });

      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Reordered!",
          text: "Categories have been reordered.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save new order",
      });
      fetchCategories(); // Revert on error
    } finally {
      setDraggedItem(null);
    }
  };

  const getCategoryIcon = (icon: string | null) => {
    if (!icon) return <FolderOpen className="h-5 w-5 text-gray-400" />;
    return <span className="text-2xl">{icon}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Categories Management
            </h2>
          </div>
          <p className="text-gray-600 ml-16">
            Create and manage course categories
          </p>
        </div>

        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.filter((c) => c.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <EyeOff className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.filter((c) => !c.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-6">Create your first category to get started!</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((category, index) => (
              <div
                key={category.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-6 hover:bg-green-50/50 transition-colors cursor-move ${
                  draggedItem === index ? "opacity-50" : ""
                }`}
              >
                {/* Drag Handle */}
                <div className="flex-shrink-0">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>

                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(category.icon)}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {category.name}
                    </h3>
                    {!category.isActive && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{category.slug}</p>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Toggle Active */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(category)}
                    className={`h-8 w-8 rounded-md ${
                      category.isActive
                        ? "hover:bg-gray-100 text-gray-600"
                        : "hover:bg-green-50 text-green-600"
                    }`}
                    title={category.isActive ? "Deactivate" : "Activate"}
                  >
                    {category.isActive ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(category)}
                    className="h-8 w-8 rounded-md hover:bg-green-50 hover:text-green-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category)}
                    className="h-8 w-8 rounded-md hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below."
                : "Fill in the details to create a new category."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Category Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Programming"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="programming"
                />
                <p className="text-xs text-gray-500">
                  URL-friendly version (auto-generated if left empty)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji or Text)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="💻"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500">Use an emoji or short text</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (visible to users)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}