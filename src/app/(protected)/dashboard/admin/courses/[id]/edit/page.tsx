/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(protected)/dashboard/admin/courses/[id]/edit/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Edit,
  Trash2,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

type College = {
  id: string;
  collegeName: string;
};

type Category = {
  id: string;
  name: string;
};

type Outcome = {
  id: string;
  outcome: string;
  sortOrder: number;
};

type Requirement = {
  id: string;
  requirement: string;
  sortOrder: number;
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  videoUrl: string | null;
  videoDuration: number | null;
  articleContent: string | null;
  isFree: boolean;
  sortOrder: number;
  quizUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  collegeId: string | null;
  thumbnailUrl: string | null;
  previewVideoUrl: string | null;
  duration: string | null;
  level: string;
  language: string;
  prerequisites: string | null;
  isFree: boolean;
  price: number | null;
  discountPrice: number | null;
  maxStudents: number | null;
  status: string;
  outcomes: Outcome[];
  requirements: Requirement[];
};

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    collegeId: "",
    thumbnailUrl: "",
    previewVideoUrl: "",
    duration: "",
    level: "Beginner",
    language: "English",
    prerequisites: "",
    isFree: true,
    price: "",
    discountPrice: "",
    maxStudents: "",
    status: "DRAFT",
  });

  // Outcomes and requirements (both existing and new)
  const [outcomes, setOutcomes] = useState<
    (Outcome | { id: string; outcome: string; isNew: true })[]
  >([]);
  const [requirements, setRequirements] = useState<
    (Requirement | { id: string; requirement: string; isNew: true })[]
  >([]);

  const [modules, setModules] = useState<(Module & { isNew?: true })[]>([]);
  const [editingModule, setEditingModule] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);
  const [editingLesson, setEditingLesson] = useState<{
    id: string;
    moduleId: string;
    title: string;
    description: string;
    contentType: string;
    quizUrl: string;
    videoUrl: string;
    articleContent: string;
    isFree: boolean;
    sortOrder: number;
  } | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Editing states
  const [editingOutcome, setEditingOutcome] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [editingRequirement, setEditingRequirement] = useState<{
    id: string;
    value: string;
  } | null>(null);

  // Fetch course data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch course
        const courseRes = await fetch(`/api/courses?id=${params.id}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const courseData = await courseRes.json();

        if (!courseData.success) {
          throw new Error("Course not found");
        }

        const course: Course = courseData.data;

        setFormData({
          title: course.title,
          slug: course.slug,
          shortDescription: course.shortDescription || "",
          description: course.description,
          categoryId: course.categoryId,
          collegeId: course.collegeId || "",
          thumbnailUrl: course.thumbnailUrl || "",
          previewVideoUrl: course.previewVideoUrl || "",
          duration: course.duration || "",
          level: course.level,
          language: course.language,
          prerequisites: course.prerequisites || "",
          isFree: course.isFree,
          price: course.price ? String(course.price) : "",
          discountPrice: course.discountPrice
            ? String(course.discountPrice)
            : "",
          maxStudents: course.maxStudents ? String(course.maxStudents) : "",
          status: course.status,
        });

        // Set outcomes and requirements from API
        setOutcomes(courseData.data.outcomes || []);
        setRequirements(courseData.data.requirements || []);

        // Fetch colleges
        const collegesRes = await fetch("/api/colleges");
        const collegesData = await collegesRes.json();
        if (collegesData.success) {
          setColleges(collegesData.data);
        }

        // Fetch curriculum with lessons
        const curriculumRes = await fetch(
          `/api/courses?id=${params.id}&curriculum=true`
        );
        const curriculumData = await curriculumRes.json();
        if (curriculumData.success) {
          setModules(curriculumData.data.modules || []);
        }

        // Fetch categories
        const categoriesRes = await fetch("/api/categories");
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load course data",
        });
        router.push("/dashboard/admin/courses");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Outcome functions
  const addNewOutcome = () => {
    const newId = `new-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setOutcomes((prev) => [...prev, { id: newId, outcome: "", isNew: true }]);
  };

  const removeOutcome = (id: string) => {
    setOutcomes((prev) => prev.filter((item) => item.id !== id));
  };

  const updateOutcome = (id: string, value: string) => {
    setOutcomes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, outcome: value } : item))
    );
  };

  const startEditOutcome = (id: string, currentValue: string) => {
    setEditingOutcome({ id, value: currentValue });
  };

  const cancelEditOutcome = () => {
    setEditingOutcome(null);
  };

  const saveEditOutcome = () => {
    if (!editingOutcome || !editingOutcome.value.trim()) return;

    updateOutcome(editingOutcome.id, editingOutcome.value);
    setEditingOutcome(null);
  };

  // Requirement functions
  const addNewRequirement = () => {
    const newId = `new-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setRequirements((prev) => [
      ...prev,
      { id: newId, requirement: "", isNew: true },
    ]);
  };

  const removeRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((item) => item.id !== id));
  };

  const updateRequirement = (id: string, value: string) => {
    setRequirements((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, requirement: value } : item
      )
    );
  };

  const startEditRequirement = (id: string, currentValue: string) => {
    setEditingRequirement({ id, value: currentValue });
  };

  const cancelEditRequirement = () => {
    setEditingRequirement(null);
  };

  const saveEditRequirement = () => {
    if (!editingRequirement || !editingRequirement.value.trim()) return;

    updateRequirement(editingRequirement.id, editingRequirement.value);
    setEditingRequirement(null);
  };

  // Module functions
  const addNewModule = () => {
    const newId = `new-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setModules((prev) => [
      ...prev,
      {
        id: newId,
        title: "",
        description: "",
        sortOrder: prev.length,
        lessons: [],
        isNew: true,
      },
    ]);
  };

  const removeModule = (id: string) => {
    setModules((prev) => prev.filter((item) => item.id !== id));
  };

  const updateModule = (
    id: string,
    field: "title" | "description",
    value: string
  ) => {
    setModules((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const startEditModule = (
    id: string,
    currentTitle: string,
    currentDescription: string
  ) => {
    setEditingModule({
      id,
      title: currentTitle,
      description: currentDescription,
    });
  };

  const cancelEditModule = () => {
    setEditingModule(null);
  };

  const saveEditModule = () => {
    if (!editingModule || !editingModule.title.trim()) return;

    updateModule(editingModule.id, "title", editingModule.title);
    updateModule(editingModule.id, "description", editingModule.description);
    setEditingModule(null);
  };

  // Lesson functions
  const addNewLesson = (moduleId: string) => {
    const newId = `new-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: [
                ...module.lessons,
                {
                  id: newId,
                  title: "",
                  description: "",
                  contentType: "VIDEO",
                  videoUrl: "",
                  videoDuration: null,
                  quizUrl: "",
                  articleContent: "",
                  isFree: false,
                  sortOrder: module.lessons.length,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            }
          : module
      )
    );
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.filter(
                (lesson) => lesson.id !== lessonId
              ),
            }
          : module
      )
    );
  };

  const updateLesson = (
    moduleId: string,
    lessonId: string,
    field: keyof Lesson,
    value: any
  ) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
              ),
            }
          : module
      )
    );
  };

  const startEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLesson({
      id: lesson.id,
      moduleId,
      title: lesson.title,
      description: lesson.description || "",
      contentType: lesson.contentType,
      videoUrl: lesson.videoUrl || "",
      quizUrl: lesson.quizUrl || "",
      articleContent: lesson.articleContent || "",
      isFree: lesson.isFree,
      sortOrder: lesson.sortOrder,
    });
  };

  const cancelEditLesson = () => {
    setEditingLesson(null);
  };

  const saveEditLesson = () => {
    if (!editingLesson || !editingLesson.title.trim()) return;

    const { moduleId, id, ...lessonData } = editingLesson;

    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === id ? { ...lesson, ...lessonData } : lesson
              ),
            }
          : module
      )
    );

    setEditingLesson(null);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.categoryId) {
      Swal.fire({
        icon: "warning",
        title: "Missing Required Fields",
        text: "Please fill in title and category",
      });
      return;
    }

    setSaving(true);

    const payload = {
      ...formData,
      collegeId: formData.collegeId || null,
      thumbnailUrl: formData.thumbnailUrl || null,
      previewVideoUrl: formData.previewVideoUrl || null,
      prerequisites: formData.prerequisites || null,
      duration: formData.duration || null,
      price: formData.price ? Number(formData.price) : null,

      discountPrice: formData.discountPrice
        ? Number(formData.discountPrice)
        : null,
      maxStudents: formData.maxStudents ? Number(formData.maxStudents) : null,
    };

    try {
      // Update course basic info
      const res = await fetch(`/api/courses?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (response.success) {
        // Process outcomes - update existing and create new ones
        for (const outcome of outcomes) {
          if ("isNew" in outcome) {
            // Create new outcome
            if (outcome.outcome.trim()) {
              await fetch(`/api/courses?id=${params.id}&outcomes=true`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ outcome: outcome.outcome }),
              });
            }
          } else {
            // Update existing outcome
            await fetch(`/api/courses?id=${outcome.id}&updateOutcome=true`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ outcome: outcome.outcome }),
            });
          }
        }

        // Process requirements - update existing and create new ones
        for (const requirement of requirements) {
          if ("isNew" in requirement) {
            // Create new requirement
            if (requirement.requirement.trim()) {
              await fetch(`/api/courses?id=${params.id}&requirements=true`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requirement: requirement.requirement }),
              });
            }
          } else {
            // Update existing requirement
            await fetch(
              `/api/courses?id=${requirement.id}&updateRequirement=true`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requirement: requirement.requirement }),
              }
            );
          }
        }

        // Process modules and lessons
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];

          if (module.isNew) {
            // Create new module
            if (module.title.trim()) {
              const moduleRes = await fetch(
                `/api/courses?id=${params.id}&modules=true`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: module.title,
                    description: module.description,
                    sortOrder: i,
                  }),
                }
              );

              const moduleData = await moduleRes.json();

              if (moduleData.success) {
                // Create lessons for new module
                for (let j = 0; j < module.lessons.length; j++) {
                  const lesson = module.lessons[j];
                  if (lesson.title.trim()) {
                    await fetch(
                      `/api/courses?id=${params.id}&lessons=true&moduleId=${moduleData.data.id}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: lesson.title,
                          description: lesson.description,
                          contentType: lesson.contentType,
                          videoUrl: lesson.videoUrl,
                          quizUrl: lesson.quizUrl,
                          articleContent: lesson.articleContent,
                          isFree: lesson.isFree,
                          sortOrder: j,
                        }),
                      }
                    );
                  }
                }
              }
            }
          } else {
            // Update existing module
            await fetch(`/api/courses?id=${module.id}&updateModule=true`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: module.title,
                description: module.description,
                sortOrder: i,
              }),
            });

            // Process lessons for existing module
            for (let j = 0; j < module.lessons.length; j++) {
              const lesson = module.lessons[j];

              // Check if lesson is new (has no proper UUID format)
              const isNewLesson = lesson.id.startsWith("new-");

              if (isNewLesson) {
                // Create new lesson
                if (lesson.title.trim()) {
                  await fetch(
                    `/api/courses?id=${params.id}&lessons=true&moduleId=${module.id}`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: lesson.title,
                        description: lesson.description,
                        contentType: lesson.contentType,
                        videoUrl: lesson.videoUrl,
                        quizUrl: lesson.quizUrl,
                        articleContent: lesson.articleContent,
                        isFree: lesson.isFree,
                        sortOrder: j,
                      }),
                    }
                  );
                }
              } else {
                // Update existing lesson
                await fetch(`/api/courses?id=${lesson.id}&updateLesson=true`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: lesson.title,
                    description: lesson.description,
                    contentType: lesson.contentType,
                    videoUrl: lesson.videoUrl,
                    articleContent: lesson.articleContent,
                    isFree: lesson.isFree,
                    sortOrder: j,
                  }),
                });
              }
            }
          }
        }

        Swal.fire({
          icon: "success",
          title: "Course Updated!",
          text: "Course has been updated successfully",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          router.push("/dashboard/admin/courses");
          router.refresh();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Failed to update course",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/admin/courses"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Edit Course
              </h1>
              <p className="text-gray-600">
                Update course details and content.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder="Web Development Bootcamp"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleFieldChange("slug", e.target.value)}
                    placeholder="web-development-bootcamp"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      handleFieldChange("shortDescription", e.target.value)
                    }
                    placeholder="A brief summary of the course..."
                    rows={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    placeholder="Detailed course description..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      handleFieldChange("categoryId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="collegeId">College (Optional)</Label>
                  <Select
                    value={formData.collegeId || "NONE"}
                    onValueChange={(value) =>
                      handleFieldChange(
                        "collegeId",
                        value === "NONE" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No college (Admin)</SelectItem>
                      {colleges.map((college) => (
                        <SelectItem key={college.id} value={college.id}>
                          {college.collegeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => handleFieldChange("level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(e) =>
                      handleFieldChange("language", e.target.value)
                    }
                    placeholder="English"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleFieldChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">
                        Pending Approval
                      </SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      handleFieldChange("duration", e.target.value)
                    }
                    placeholder="40 hours"
                  />
                </div>

                <div>
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      handleFieldChange("maxStudents", e.target.value)
                    }
                    placeholder="50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50 border-b">
              <CardTitle className="text-xl text-gray-900">Media</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) =>
                    handleFieldChange("thumbnailUrl", e.target.value)
                  }
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              <div>
                <Label htmlFor="previewVideoUrl">Preview Video URL</Label>
                <Input
                  id="previewVideoUrl"
                  type="url"
                  value={formData.previewVideoUrl}
                  onChange={(e) =>
                    handleFieldChange("previewVideoUrl", e.target.value)
                  }
                  placeholder="https://youtube.com/..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-50 border-b">
              <CardTitle className="text-xl text-gray-900">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={formData.isFree}
                  onChange={(e) =>
                    handleFieldChange("isFree", e.target.checked)
                  }
                  className="rounded"
                />
                <Label htmlFor="isFree">This course is free</Label>
              </div>

              {!formData.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        handleFieldChange("price", e.target.value)
                      }
                      placeholder="99.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discountPrice">Discount Price ($)</Label>
                    <Input
                      id="discountPrice"
                      type="number"
                      step="0.01"
                      value={formData.discountPrice}
                      onChange={(e) =>
                        handleFieldChange("discountPrice", e.target.value)
                      }
                      placeholder="79.00"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Outcomes */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Learning Outcomes
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    What students will learn in this course
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addNewOutcome}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Outcome
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {outcomes.map((item) => (
                <div key={item.id} className="flex gap-2 items-center">
                  {editingOutcome?.id === item.id ? (
                    <>
                      <Input
                        value={editingOutcome.value}
                        onChange={(e) =>
                          setEditingOutcome({
                            ...editingOutcome,
                            value: e.target.value,
                          })
                        }
                        placeholder="What students will learn..."
                        className="flex-1"
                      />
                      <Button type="button" size="sm" onClick={saveEditOutcome}>
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelEditOutcome}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={item.outcome}
                        onChange={(e) => updateOutcome(item.id, e.target.value)}
                        placeholder="What students will learn..."
                        className="flex-1"
                        readOnly={"isNew" in item ? false : true}
                      />
                      {"isNew" in item ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOutcome(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              startEditOutcome(item.id, item.outcome)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOutcome(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}

              {outcomes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No learning outcomes added yet. Click &quot;Add Outcome&quot;
                  to add one.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Requirements
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Prerequisites for this course
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addNewRequirement}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {requirements.map((item) => (
                <div key={item.id} className="flex gap-2 items-center">
                  {editingRequirement?.id === item.id ? (
                    <>
                      <Input
                        value={editingRequirement.value}
                        onChange={(e) =>
                          setEditingRequirement({
                            ...editingRequirement,
                            value: e.target.value,
                          })
                        }
                        placeholder="Prerequisites for the course..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveEditRequirement}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelEditRequirement}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={item.requirement}
                        onChange={(e) =>
                          updateRequirement(item.id, e.target.value)
                        }
                        placeholder="Prerequisites for the course..."
                        className="flex-1"
                        readOnly={"isNew" in item ? false : true}
                      />
                      {"isNew" in item ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRequirement(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              startEditRequirement(item.id, item.requirement)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRequirement(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}

              {requirements.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No requirements added yet. Click &quot;Add Requirement&quot;
                  to add one.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Course Modules with Lessons */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Course Modules & Lessons
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Structure your course content into modules and lessons
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addNewModule}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {modules.map((module, index) => (
                <div
                  key={module.id}
                  className="border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Module Header */}
                  <div
                    className="flex items-start gap-3 p-4 cursor-pointer"
                    onClick={() => toggleModule(module.id)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingModule?.id === module.id ? (
                            // Editing existing module
                            <div className="space-y-2">
                              <Input
                                value={editingModule.title}
                                onChange={(e) =>
                                  setEditingModule({
                                    ...editingModule,
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Module title..."
                              />
                              <Textarea
                                value={editingModule.description}
                                onChange={(e) =>
                                  setEditingModule({
                                    ...editingModule,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Module description..."
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={saveEditModule}
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditModule}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : module.isNew ? (
                            // NEW MODULE - directly editable
                            <div className="space-y-2">
                              <Input
                                value={module.title}
                                onChange={(e) =>
                                  updateModule(
                                    module.id,
                                    "title",
                                    e.target.value
                                  )
                                }
                                placeholder="Module title..."
                              />
                              <Textarea
                                value={module.description || ""}
                                onChange={(e) =>
                                  updateModule(
                                    module.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Module description..."
                                rows={2}
                              />
                            </div>
                          ) : (
                            // Existing module - show as text
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {module.title}
                              </h4>
                              {module.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {module.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <ChevronDown
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              expandedModules.includes(module.id)
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                          {editingModule?.id === module.id ? null : (
                            <>
                              {module.isNew ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeModule(module.id);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditModule(
                                        module.id,
                                        module.title,
                                        module.description || ""
                                      );
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeModule(module.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{module.lessons?.length || 0} lessons</span>
                      </div>
                    </div>
                  </div>

                  {/* Lessons Section */}
                  {expandedModules.includes(module.id) && (
                    <div className="border-t bg-gray-50">
                      <div className="flex items-center justify-between p-4">
                        <Label className="text-sm font-medium text-gray-700">
                          Lessons ({module.lessons?.length || 0})
                        </Label>
                        <Button
                          type="button"
                          onClick={() => addNewLesson(module.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Lesson
                        </Button>
                      </div>

                      {!module.lessons || module.lessons.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No lessons in this module yet.
                        </div>
                      ) : (
                        <div className="space-y-2 p-4">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow"
                            >
                              <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-semibold mt-1">
                                {lessonIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                {editingLesson?.id === lesson.id &&
                                editingLesson.moduleId === module.id ? (
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 space-y-3">
                                        <Input
                                          value={editingLesson.title}
                                          onChange={(e) =>
                                            setEditingLesson({
                                              ...editingLesson,
                                              title: e.target.value,
                                            })
                                          }
                                          placeholder="Lesson title..."
                                          className="text-sm"
                                        />
                                        <Textarea
                                          value={editingLesson.description}
                                          onChange={(e) =>
                                            setEditingLesson({
                                              ...editingLesson,
                                              description: e.target.value,
                                            })
                                          }
                                          placeholder="Lesson description..."
                                          rows={2}
                                          className="text-sm"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <Label className="text-xs">
                                              Content Type
                                            </Label>
                                            <Select
                                              value={editingLesson.contentType}
                                              onValueChange={(value) =>
                                                setEditingLesson({
                                                  ...editingLesson,
                                                  contentType: value,
                                                })
                                              }
                                            >
                                              <SelectTrigger className="h-8 text-sm">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="VIDEO">
                                                  Video
                                                </SelectItem>
                                                <SelectItem value="ARTICLE">
                                                  Article
                                                </SelectItem>
                                                <SelectItem value="QUIZ">
                                                  Quiz
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="flex items-center gap-2 pt-6">
                                            <input
                                              type="checkbox"
                                              checked={editingLesson.isFree}
                                              onChange={(e) =>
                                                setEditingLesson({
                                                  ...editingLesson,
                                                  isFree: e.target.checked,
                                                })
                                              }
                                              className="rounded"
                                            />
                                            <Label className="text-xs">
                                              Free Lesson
                                            </Label>
                                          </div>
                                        </div>
                                        {editingLesson.contentType ===
                                          "VIDEO" && (
                                          <Input
                                            value={editingLesson.videoUrl}
                                            onChange={(e) =>
                                              setEditingLesson({
                                                ...editingLesson,
                                                videoUrl: e.target.value,
                                              })
                                            }
                                            placeholder="Video URL..."
                                            className="text-sm"
                                          />
                                        )}
                                        {editingLesson.contentType ===
                                          "ARTICLE" && (
                                          <Textarea
                                            value={editingLesson.articleContent}
                                            onChange={(e) =>
                                              setEditingLesson({
                                                ...editingLesson,
                                                articleContent: e.target.value,
                                              })
                                            }
                                            placeholder="Article content..."
                                            rows={4}
                                            className="text-sm"
                                          />
                                        )}
                                        {editingLesson.contentType ===
                                          "ARTICLE" && (
                                          <Textarea
                                            value={editingLesson.articleContent}
                                            onChange={(e) =>
                                              setEditingLesson({
                                                ...editingLesson,
                                                articleContent: e.target.value,
                                              })
                                            }
                                            placeholder="Article content..."
                                            rows={4}
                                            className="text-sm"
                                          />
                                        )}
                                        {editingLesson.contentType ===
                                          "QUIZ" && (
                                          <Input
                                            value={editingLesson.quizUrl}
                                            onChange={(e) =>
                                              setEditingLesson({
                                                ...editingLesson,
                                                quizUrl: e.target.value,
                                              })
                                            }
                                            placeholder="Quiz URL..."
                                            className="text-sm"
                                          />
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={saveEditLesson}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={cancelEditLesson}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h5 className="font-medium text-gray-900 text-sm">
                                          {lesson.title}
                                        </h5>
                                        {lesson.description && (
                                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {lesson.description}
                                          </p>
                                        )}
                                      </div>
                                      {lesson.isFree && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                          Free
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                      <span className="bg-gray-100 px-2 py-1 rounded">
                                        {lesson.contentType}
                                      </span>
                                      {lesson.videoDuration && (
                                        <>
                                          <span>•</span>
                                          <span>
                                            {Math.floor(
                                              lesson.videoDuration / 60
                                            )}
                                            m {lesson.videoDuration % 60}s
                                          </span>
                                        </>
                                      )}
                                      <span>•</span>
                                      <span>Sort: {lesson.sortOrder}</span>
                                    </div>
                                    {lesson.contentType === "VIDEO" &&
                                      lesson.videoUrl && (
                                        <div className="mt-2">
                                          <a
                                            href={lesson.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                          >
                                            📹 Video Link
                                          </a>
                                        </div>
                                      )}
                                    {lesson.contentType === "QUIZ" &&
                                      lesson.quizUrl && (
                                        <div className="mt-2">
                                          <a
                                            href={lesson.quizUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                          >
                                            📝 Quiz Link
                                          </a>
                                        </div>
                                      )}
                                    <div className="flex gap-2 mt-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          startEditLesson(module.id, lesson)
                                        }
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeLesson(module.id, lesson.id)
                                        }
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Remove
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {modules.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No modules added yet. Click &quot;Add Module&quot; to add one.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div>
                <Label htmlFor="prerequisites">Prerequisites</Label>
                <Textarea
                  id="prerequisites"
                  value={formData.prerequisites}
                  onChange={(e) =>
                    handleFieldChange("prerequisites", e.target.value)
                  }
                  placeholder="List any prerequisites for this course..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 pb-8">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/admin/courses">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : "Update Course"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
