// src/app/(protected)/dashboard/admin/blogs/[slug]/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import Swal from "sweetalert2";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import RichTextEditor from "@/components/courses/RichTextEditor";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Edit,
  Eye,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Blog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  viewCount: number;
  authorName?: string;
  authorEmail?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    thumbnailUrl: "",
    isPublished: false,
    tags: [""] as string[],
  });

  useEffect(() => {
    if (params.id) fetchBlog();
  }, [params.id]);

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/admin/blogs/${params.id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();

      const blogData = {
        ...data.blog,
        tags: data.blog.tags || [],
      };

      setBlog(blogData);

      // Initialize form data
      setFormData({
        title: blogData.title,
        slug: blogData.slug,
        excerpt: blogData.excerpt || "",
        content: blogData.content,
        thumbnailUrl: blogData.thumbnailUrl || "",
        isPublished: blogData.isPublished,
        tags: blogData.tags.length > 0 ? blogData.tags : [""],
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Blog Not Found",
        text: "The requested blog post could not be found.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Check if there are unsaved changes
      const hasChanges =
        formData.title !== blog?.title ||
        formData.slug !== blog?.slug ||
        formData.excerpt !== (blog?.excerpt || "") ||
        formData.content !== blog?.content ||
        formData.thumbnailUrl !== (blog?.thumbnailUrl || "") ||
        formData.isPublished !== blog?.isPublished ||
        JSON.stringify(formData.tags) !== JSON.stringify(blog?.tags || [""]);

      if (hasChanges) {
        Swal.fire({
          title: "Discard Changes?",
          text: "You have unsaved changes. Are you sure you want to cancel?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, discard changes",
          cancelButtonText: "Continue editing",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            // Reset form data when canceling edit
            if (blog) {
              setFormData({
                title: blog.title,
                slug: blog.slug,
                excerpt: blog.excerpt || "",
                content: blog.content,
                thumbnailUrl: blog.thumbnailUrl || "",
                isPublished: blog.isPublished,
                tags: blog.tags.length > 0 ? blog.tags : [""],
              });
            }
            setIsEditing(false);
          }
        });
        return;
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!blog) return;

    // Validation
    if (!formData.title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Title",
        text: "Please enter a blog title",
      });
      return;
    }

    if (!formData.slug.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Slug",
        text: "Please enter a blog slug",
      });
      return;
    }

    if (!formData.content.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Content",
        text: "Please enter blog content",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.filter((tag) => tag.trim() !== ""),
      };

      const res = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedBlog = await res.json();
        setBlog(updatedBlog.blog);
        setIsEditing(false);
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Blog updated successfully!",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: err.error || "Failed to update blog",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete <strong>"${blog?.title}"</strong>.<br>This action cannot be undone.`,
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
      const res = await fetch(`/api/admin/blogs/${blog?.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Blog deleted successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/blogs");
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: "Failed to delete blog",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error deleting blog",
      });
    }
  };

  const handleAddTag = () => {
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, ""],
    }));
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...formData.tags];
    newTags[index] = value;
    setFormData((prev) => ({ ...prev, tags: newTags }));
  };

  const formatDate = (d: string | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not set";

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );

  if (!blog)
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Blog Not Found</h2>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/admin/blogs">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blogs
          </Link>
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="relative py-8 mb-8 bg-gradient-to-r from-blue-50 to-amber-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/admin/blogs"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Blogs
                </Link>
                <Badge variant="outline" className="text-xs bg-white">
                  ADMIN VIEW
                </Badge>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Blog Title"
                  className="text-3xl font-bold border-blue-300 focus:border-blue-500 h-16 "
                />
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      excerpt: e.target.value,
                    }))
                  }
                  placeholder="Brief excerpt for the blog..."
                  rows={2}
                  className="text-lg border-blue-300 focus:border-blue-500"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {blog.title}
                </h1>
                {blog.excerpt && (
                  <p className="text-lg text-gray-600 mb-6">{blog.excerpt}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <div className="space-y-2 w-full">
                  <Label>Tags</Label>
                  <div className="space-y-2">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={tag}
                          onChange={(e) =>
                            handleTagChange(index, e.target.value)
                          }
                          placeholder="astrology"
                          className="flex-1"
                        />
                        {formData.tags.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveTag(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tag
                    </Button>
                  </div>
                </div>
              ) : (
                blog.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                  >
                    {tag}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Thumbnail */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50">
                <CardTitle>Thumbnail</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <ImageUpload
                    label="Blog Thumbnail"
                    value={formData.thumbnailUrl}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, thumbnailUrl: url }))
                    }
                    isThumbnail={true}
                  />
                ) : blog.thumbnailUrl ? (
                  <div className="relative w-full rounded-lg overflow-hidden border border-gray-200">
                    <div
                      className="relative w-full"
                      style={{ paddingBottom: "56.25%" }}
                    >
                      <Image
                        src={blog.thumbnailUrl}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p>No thumbnail set</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blog Content */}

            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50">
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="content">Blog Content</Label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(content) =>
                        setFormData((prev) => ({ ...prev, content }))
                      }
                      placeholder="Write your blog content here..."
                      minHeight="400px"
                    />
                  </div>
                ) : (
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50 rounded-t-lg">
                <CardTitle className="text-xl">Status & Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-3">
                        <Label htmlFor="isPublished">Publish</Label>
                        <Switch
                          id="isPublished"
                          checked={formData.isPublished}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              isPublished: checked,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <Badge
                        className={
                          blog.isPublished
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }
                      >
                        {blog.isPublished ? "Published" : "Draft"}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="text-gray-600">Published</div>
                        <div className="font-medium text-gray-900">
                          {formatDate(blog.publishedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="text-gray-600">Created</div>
                        <div className="font-medium text-gray-900">
                          {formatDate(blog.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="text-gray-600">Updated</div>
                        <div className="font-medium text-gray-900">
                          {formatDate(blog.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Stats */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <div className="text-gray-600">Views</div>
                        <div className="font-medium text-gray-900">
                          {blog.viewCount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {blog.authorName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <div className="flex-1">
                          <div className="text-gray-600">Author</div>
                          <div className="font-medium text-gray-900">
                            {blog.authorName}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="mt-4 flex flex-wrap gap-3">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white w-full justify-start"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          onClick={handleEditToggle}
                          variant="outline"
                          disabled={saving}
                          className="w-full justify-start"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Link href={`/blogs/${blog.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View Live
                          </Link>
                        </Button>
                        <Button
                          onClick={handleEditToggle}
                          className="bg-blue-600 hover:bg-blue-700 text-white w-full justify-start"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Blog
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          className="w-full justify-start"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Blog
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Info */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50">
                <CardTitle className="text-lg">Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Slug</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {blog.slug}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs truncate max-w-[150px]">
                    {blog.id}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
