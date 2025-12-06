"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Globe,
  DollarSign,
  Award,
  CheckSquare,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/college/shared/LoadingState";

const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(200, "Short description must be at most 200 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  categoryId: z.string().min(1, "Category is required"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  language: z.string().default("English"),
  duration: z.string().optional(),
  prerequisites: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  previewVideoUrl: z.string().url().optional().or(z.literal("")),
  isFree: z.boolean().default(true),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional(),
  maxStudents: z.number().min(1).optional(),
  hasFinalAssessment: z.boolean().default(false),
  finalAssessmentRequired: z.boolean().default(true),
  minimumCoursePassingScore: z.number().min(0).max(100).default(60),
  requireAllModulesComplete: z.boolean().default(true),
  requireAllAssessmentsPassed: z.boolean().default(true),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "PUBLISHED"]).default("DRAFT"),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

type LearningOutcome = {
  id: string;
  outcome: string;
  sortOrder: number;
};

type Requirement = {
  id: string;
  requirement: string;
  sortOrder: number;
};

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      level: "Beginner",
      language: "English",
      isFree: true,
      hasFinalAssessment: false,
      finalAssessmentRequired: true,
      minimumCoursePassingScore: 60,
      requireAllModulesComplete: true,
      requireAllAssessmentsPassed: true,
      status: "DRAFT",
    },
  });

  // Fetch course data
  useEffect(() => {
    if (params.id) {
      fetchCourseData();
      fetchCategories();
    }
  }, [params.id]);

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`/api/courses?id=${params.id}`);
      const data = await response.json();
      if (data.success) {
        setCourse(data.data);
        setLearningOutcomes(data.data.learningOutcomes || []);
        setRequirements(data.data.requirements || []);
        
        // Set form values
        form.reset({
          title: data.data.title,
          slug: data.data.slug,
          shortDescription: data.data.shortDescription || "",
          description: data.data.description || "",
          categoryId: data.data.categoryId,
          level: data.data.level,
          language: data.data.language,
          duration: data.data.duration || "",
          prerequisites: data.data.prerequisites || "",
          thumbnailUrl: data.data.thumbnailUrl || "",
          previewVideoUrl: data.data.previewVideoUrl || "",
          isFree: data.data.isFree,
          price: data.data.price || 0,
          discountPrice: data.data.discountPrice || 0,
          maxStudents: data.data.maxStudents || 0,
          hasFinalAssessment: data.data.hasFinalAssessment || false,
          finalAssessmentRequired: data.data.finalAssessmentRequired || true,
          minimumCoursePassingScore: data.data.minimumCoursePassingScore || 60,
          requireAllModulesComplete: data.data.requireAllModulesComplete !== false,
          requireAllAssessmentsPassed: data.data.requireAllAssessmentsPassed !== false,
          status: data.data.status,
        });
      } else {
        throw new Error("Course not found");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch course data",
        variant: "destructive",
      });
      router.push("/dashboard/college/courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  // Learning outcomes handlers
  const addLearningOutcome = () => {
    const newOutcome: LearningOutcome = {
      id: `new-${Date.now()}`,
      outcome: "",
      sortOrder: learningOutcomes.length,
    };
    setLearningOutcomes([...learningOutcomes, newOutcome]);
  };

  const updateLearningOutcome = (id: string, value: string) => {
    setLearningOutcomes(
      learningOutcomes.map((outcome) =>
        outcome.id === id ? { ...outcome, outcome: value } : outcome
      )
    );
  };

  const removeLearningOutcome = (id: string) => {
    if (learningOutcomes.length > 1) {
      setLearningOutcomes(learningOutcomes.filter((outcome) => outcome.id !== id));
    }
  };

  // Requirements handlers
  const addRequirement = () => {
    const newRequirement: Requirement = {
      id: `new-${Date.now()}`,
      requirement: "",
      sortOrder: requirements.length,
    };
    setRequirements([...requirements, newRequirement]);
  };

  const updateRequirement = (id: string, value: string) => {
    setRequirements(
      requirements.map((req) =>
        req.id === id ? { ...req, requirement: value } : req
      )
    );
  };

  const removeRequirement = (id: string) => {
    if (requirements.length > 1) {
      setRequirements(requirements.filter((req) => req.id !== id));
    }
  };

  const onSubmit = async (values: CourseFormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare payload
      const payload = {
        ...values,
        learningOutcomes: learningOutcomes
          .filter((lo) => lo.outcome.trim())
          .map((lo) => ({
            id: lo.id.startsWith("new-") ? undefined : lo.id,
            outcome: lo.outcome,
            sortOrder: lo.sortOrder,
          })),
        requirements: requirements
          .filter((req) => req.requirement.trim())
          .map((req) => ({
            id: req.id.startsWith("new-") ? undefined : req.id,
            requirement: req.requirement,
            sortOrder: req.sortOrder,
          })),
      };

      const response = await fetch(`/api/courses?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Course updated successfully",
        });
        router.push(`/dashboard/college/courses/${params.id}`);
      } else {
        toast({
          title: "Error",
          description: data.error?.message || "Failed to update course",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !course) {
    return <LoadingState message="Loading course..." />;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/college/courses/${params.id}`}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Link>
          <h1 className="text-3xl font-bold">Edit Course</h1>
          <p className="text-muted-foreground">
            Update course information and settings
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Web Development Bootcamp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="web-development-bootcamp" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL-friendly version of the title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief summary of the course..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Max 200 characters. Displayed in course cards.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description *</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Detailed course description..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input placeholder="English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 40 hours" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Thumbnails & Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Thumbnails & Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail Image</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        folder="course-thumbnails"
                      />
                    </FormControl>
                    <FormDescription>
                      Recommended size: 1280x720px
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              <FormField
                control={form.control}
                name="previewVideoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preview Video URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional. YouTube or Vimeo URL for course preview
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Learning Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Learning Outcomes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                What students will learn in this course
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {learningOutcomes.map((outcome) => (
                <div key={outcome.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Learning outcome"
                      value={outcome.outcome}
                      onChange={(e) =>
                        updateLearningOutcome(outcome.id, e.target.value)
                      }
                    />
                  </div>
                  {learningOutcomes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLearningOutcome(outcome.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addLearningOutcome}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Learning Outcome
              </Button>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Requirements
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Prerequisites for this course
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="prerequisites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Prerequisites</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any general requirements for taking this course..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Specific Requirements</h4>
                {requirements.map((requirement) => (
                  <div key={requirement.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Requirement"
                        value={requirement.requirement}
                        onChange={(e) =>
                          updateRequirement(requirement.id, e.target.value)
                        }
                      />
                    </div>
                    {requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRequirement(requirement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRequirement}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Requirement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Free Course</FormLabel>
                      <FormDescription>
                        Make this course available for free
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!form.watch("isFree") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="maxStudents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Students</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Leave empty for unlimited enrollment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Course Completion Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Course Completion Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasFinalAssessment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Final Assessment
                        </FormLabel>
                        <FormDescription>
                          Add a final assessment for the course
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("hasFinalAssessment") && (
                  <div className="space-y-4 pl-4 border-l-2">
                    <FormField
                      control={form.control}
                      name="finalAssessmentRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Assessment Required</FormLabel>
                            <FormDescription>
                              Students must pass to complete course
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minimumCoursePassingScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Passing Score</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                            />
                          </FormControl>
                          <FormDescription>
                            Score required to pass (0-100)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <Separator />

                <FormField
                  control={form.control}
                  name="requireAllModulesComplete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Require All Modules Complete</FormLabel>
                        <FormDescription>
                          Students must complete all modules
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requireAllAssessmentsPassed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Require All Assessments Passed</FormLabel>
                        <FormDescription>
                          Students must pass all required assessments
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PENDING_APPROVAL">
                          Pending Approval
                        </SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Save as draft or submit for approval
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/college/courses/${params.id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}