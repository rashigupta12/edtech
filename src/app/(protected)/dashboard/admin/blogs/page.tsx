/*eslint-disable @typescript-eslint/no-explicit-any*/
// src/app/(protected)/dashboard/admin/blogs/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Edit,
  Eye,
  Eye as EyeIcon,
  FileText,
  Filter,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

type Blog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  isPublished: boolean;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
};

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchBlogs();
  }, [statusFilter]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "ALL"
          ? "/api/admin/blogs"
          : `/api/admin/blogs?status=${statusFilter}`;

      const res = await fetch(url);
      const data = await res.json();

      const mapped: Blog[] = (data.blogs || []).map((b: any) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        excerpt: b.excerpt || "",
        isPublished: b.isPublished,
        viewCount: b.viewCount ?? 0,
        publishedAt: b.publishedAt,
        createdAt: b.createdAt,
      }));

      setBlogs(mapped);
    } catch (err) {
      console.error("Failed to fetch blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const blogToDelete = blogs.find((b) => b.id === id);

    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete <strong>"${blogToDelete?.title}"</strong>.<br>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Blog post has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: "Failed to delete blog post. Please try again.",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the blog post.",
      });
    }
  };

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = ["ALL", "PUBLISHED", "DRAFT"];

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-blue-700 bg-clip-text text-transparent">
            Blog Management
          </h2>
          <p className="text-gray-600 mt-2">
            Manage your blog posts, create new ones, and track engagement.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-blue-50">
                  {s === "ALL" ? "All Status" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add Blog Button */}
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg whitespace-nowrap"
          >
            <Link
              href="/dashboard/admin/blogs/add"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Blog
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Blogs</p>
              <p className="text-2xl font-bold text-gray-900">{blogs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <EyeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {blogs.reduce((sum, blog) => sum + blog.viewCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">
                {blogs.filter((blog) => blog.isPublished).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No blogs found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your search or filter criteria"
                : "Create your first blog post to get started!"}
            </p>
            {searchTerm || statusFilter !== "ALL" ? (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                <Link
                  href="/dashboard/admin/blogs/add"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Blog
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-500  border-b border-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold  uppercase tracking-wider">
                    Blog Post
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold  uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold  uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Published Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBlogs.map((blog) => (
                  <tr
                    key={blog.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {blog.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2 max-w-lg">
                        {blog.excerpt || "No excerpt provided"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {blog.slug}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                          blog.isPublished
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {blog.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <EyeIcon className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {blog.viewCount}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {blog.publishedAt ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          {new Date(blog.publishedAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not published</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-end ">
                        {/* View */}
                        <Link href={`/dashboard/admin/blogs/${blog.slug}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Edit */}
                        <Link href={`/dashboard/admin/blogs/edit/${blog.slug}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(blog.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
