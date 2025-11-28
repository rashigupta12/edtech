// src/app/(protected)/dashboard/admin/blogs/edit/[slug]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import RichTextEditor from "@/components/courses/RichTextEditor";
import Swal from "sweetalert2";
import Link from "next/link";

type Blog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  thumbnailUrl?: string | null;
  isPublished: boolean;
  tags: string[];
};

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([""]);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/blogs/${slug}`);

      if (!res.ok) {
        throw new Error("Blog not found");
      }

      const data = await res.json();
      const fetchedBlog = data.blog;

      setBlog(fetchedBlog);
      setTags(fetchedBlog.tags && fetchedBlog.tags.length > 0 ? fetchedBlog.tags : [""]);
    } catch (error) {
      console.error("Failed to fetch blog:", error);
      Swal.fire({
        icon: "error",
        title: "Not Found",
        text: "Blog post not found",
      });
      router.push("/dashboard/admin/blogs");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleAddTag = () => {
    setTags([...tags, ""]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...tags];
    const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
    newTags[index] = capitalized;
    setTags(newTags);
  };

  const handleSave = async () => {
    if (!blog) return;

    if (!blog.title.trim() || !blog.slug.trim() || !blog.content.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Title, Slug, and Content are required",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blog.title.trim(),
          slug: blog.slug.trim(),
          excerpt: blog.excerpt?.trim() || null,
          content: blog.content,
          thumbnailUrl: blog.thumbnailUrl || null,
          tags: tags.filter((t) => t.trim()),
          isPublished: blog.isPublished,
        }),
      });

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Blog post updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/blogs");
      } else {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: err.error || "Failed to update blog",
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 w-full">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/admin/blogs"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blogs
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Edit Blog Post
              </h1>
              <p className="text-gray-600">
                Update your blog content and settings
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm text-gray-700">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={blog.title}
                    onChange={(e) => {
                      const value = e.target.value;
                      const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
                      setBlog({
                        ...blog,
                        title: capitalized,
                        slug: value.trim() ? generateSlug(value) : blog.slug,
                      });
                    }}
                    placeholder="Understanding Vedic Astrology"
                    required
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm text-gray-700">
                    Slug *
                  </Label>
                  <Input
                    id="slug"
                    value={blog.slug}
                    onChange={(e) =>
                      setBlog({ ...blog, slug: e.target.value.toLowerCase() })
                    }
                    placeholder="understanding-vedic-astrology"
                    required
                    className="border-gray-300 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-sm text-gray-700">
                  Excerpt
                </Label>
                <Textarea
                  id="excerpt"
                  rows={3}
                  value={blog.excerpt || ""}
                  onChange={(e) =>
                    setBlog({ ...blog, excerpt: e.target.value })
                  }
                  placeholder="A brief introduction to Vedic astrology and its principles..."
                  className="border-gray-300 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  A short summary that appears in blog listings
                </p>
              </div>

              <ImageUpload
                label="Blog Thumbnail"
                value={blog.thumbnailUrl || ""}
                onChange={(url) => setBlog({ ...blog, thumbnailUrl: url })}
                isThumbnail={true}
              />
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">Content *</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RichTextEditor
                value={blog.content}
                onChange={(value) => setBlog({ ...blog, content: value })}
                placeholder="Write your blog content here..."
                minHeight="500px"
              />
              <p className="text-xs text-gray-500 mt-2">
                Use the toolbar to format text, add images, links, and more.
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50 border-b">
              <CardTitle className="text-xl text-gray-900">Tags</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {tags.map((tag, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={tag}
                    onChange={(e) => handleTagChange(index, e.target.value)}
                    placeholder="Astrology"
                    className="flex-1 border-gray-300 focus:border-amber-500"
                  />
                  {tags.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveTag(index)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </CardContent>
          </Card>

          {/* Publishing */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublished" className="text-gray-700">
                    Publish immediately
                  </Label>
                  <p className="text-sm text-gray-500">
                    Make this blog post visible to the public
                  </p>
                </div>
                <Switch
                  id="isPublished"
                  checked={blog.isPublished}
                  onCheckedChange={(checked) =>
                    setBlog({ ...blog, isPublished: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              asChild
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Link href="/dashboard/admin/blogs">Cancel</Link>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {saving ? (
                <>Saving…</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}