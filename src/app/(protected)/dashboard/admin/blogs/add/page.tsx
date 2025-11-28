// src/app/(protected)/dashboard/admin/blogs/add/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import React, { useState } from "react";
import { useCurrentUser } from "@/hooks/auth";
import RichTextEditor from "@/components/courses/RichTextEditor";

export default function AddBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const user = useCurrentUser();
  console.log(user);

  // Core fields
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [isPublished, setIsPublished] = useState(false);
  const [tags, setTags] = useState<string[]>([""]);
  const authorId = user?.id;

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
  
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const payload = {
      slug,
      title,
      excerpt: excerpt || null,
      content,
      thumbnailUrl: thumbnailUrl || null,
      authorId: authorId || "default-author-id",
      tags: tags.filter((t) => t.trim()),
      isPublished,
    };

    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Blog Created!",
          text: "Blog post has been created successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/blogs");
      } else {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.error || "Failed to create blog",
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6 w-full">
      <div className=" mx-auto">
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
                Add New Blog
              </h1>
              <p className="text-gray-600">
                Create a new blog post and publish it to your audience.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
                    value={title}
                    onChange={(e) => {
                      const value = e.target.value;
                      const capitalized =
                        value.charAt(0).toUpperCase() + value.slice(1);
                      setTitle(capitalized);
                      if (value.trim()) {
                        setSlug(generateSlug(value));
                      }
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
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="understanding-vedic-astrology"
                    required
                    className="border-gray-300 focus:border-blue-500"
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
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A brief introduction to Vedic astrology and its principles..."
                  className="border-gray-300 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  A short summary that appears in blog listings
                </p>
              </div>

              {/* NEW: Image Upload Component */}
              <ImageUpload
                label="Blog Thumbnail"
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
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
                value={content}
                onChange={setContent}
                placeholder="Write your blog content here..."
                minHeight="400px"
              />
              <p className="text-xs text-gray-500 mt-2">
                Use the toolbar above to format your content with rich text.
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

          {/* Publishing Options */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Publishing
              </CardTitle>
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
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {loading ? "Creating…" : "Create Blog"}
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Link href="/dashboard/admin/blogs">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}