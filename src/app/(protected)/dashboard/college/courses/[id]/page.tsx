"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Eye,
  FileText,
  Users,
  Clock,
  Award,
  CheckSquare,
  BookOpen,
  Layers,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/college/shared/LoadingState";
import HierarchyBreadcrumb from "@/components/college/shared/HierarchyBreadcrumb";
import { EmptyState } from "@/components/college/shared/EmptyState";

type Course = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string | null;
  previewVideoUrl: string | null;
  duration: string | null;
  level: string;
  language: string;
  prerequisites: string | null;
  status: string;
  isFeatured: boolean;
  maxStudents: number | null;
  currentEnrollments: number;
  isFree: boolean;
  price: number | null;
  discountPrice: number | null;
  hasFinalAssessment: boolean;
  finalAssessmentRequired: boolean;
  minimumCoursePassingScore: number;
  requireAllModulesComplete: boolean;
  requireAllAssessmentsPassed: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  categoryName?: string;
  collegeName?: string;
  learningOutcomes: { id: string; outcome: string }[];
  requirements: { id: string; requirement: string }[];
  faculty: any[];
  assessments: any[];
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  hasAssessment: boolean;
  assessmentRequired: boolean;
  minimumPassingScore: number;
  requireAllLessonsComplete: boolean;
  lessons: Lesson[];
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  sortOrder: number;
  isFree: boolean;
  hasQuiz: boolean;
  quizRequired: boolean;
};

type Assessment = {
  id: string;
  title: string;
  assessmentLevel: string;
  description: string | null;
  passingScore: number;
  questionsCount: number;
  timeLimit: number | null;
  maxAttempts: number | null;
  isRequired: boolean;
  showCorrectAnswers: boolean;
  allowRetake: boolean;
  randomizeQuestions: boolean;
  availableFrom: string | null;
  availableUntil: string | null;
  lessonId: string | null;
  moduleId: string | null;
};

export default function ViewCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [curriculum, setCurriculum] = useState<Module[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (params.id) {
      fetchCourseData();
      fetchCurriculum();
      fetchAssessments();
    }
  }, [params.id]);

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`/api/courses?id=${params.id}`);
      const data = await response.json();
      if (data.success) {
        setCourse(data.data);
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

  const fetchCurriculum = async () => {
    try {
      const response = await fetch(`/api/courses?id=${params.id}&curriculum=true`);
      const data = await response.json();
      if (data.success) {
        setCurriculum(data.data.modules || []);
      }
    } catch (error) {
      console.error("Failed to fetch curriculum:", error);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = await fetch(`/api/courses?id=${params.id}&assessments=true`);
      const data = await response.json();
      if (data.success) {
        setAssessments(data.data.assessments || []);
      }
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await fetch(`/api/courses?id=${params.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Course deleted successfully",
        });
        router.push("/dashboard/college/courses");
      } else {
        toast({
          title: "Error",
          description: data.error?.message || "Failed to delete course",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "ARCHIVED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || !course) {
    return <LoadingState message="Loading course..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/college/courses"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <Badge className={getStatusColor(course.status)}>
              {course.status.replace(/_/g, " ")}
            </Badge>
            {course.isFeatured && <Badge variant="secondary">Featured</Badge>}
          </div>
          <p className="text-muted-foreground mt-2">{course.shortDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/college/courses/${params.id}/edit`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <HierarchyBreadcrumb
        items={[
          { label: "Courses", href: "/dashboard/college/courses" },
          { label: course.title, href: `#` },
        ]}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Image */}
              <Card>
                <div className="relative aspect-video bg-muted">
                  {course.thumbnailUrl ? (
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                </CardContent>
              </Card>

              {/* Learning Outcomes */}
              {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Learning Outcomes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {course.learningOutcomes.map((outcome) => (
                        <li key={outcome.id} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                            ✓
                          </div>
                          <span className="text-gray-700">{outcome.outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {course.requirements && course.requirements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {course.requirements.map((requirement) => (
                        <li key={requirement.id} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                            ✓
                          </div>
                          <span className="text-gray-700">{requirement.requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <Link href={`/dashboard/college/modules/create?courseId=${params.id}`}>
                      <Layers className="h-4 w-4" />
                      Add Module
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <Link href={`/dashboard/college/assessments/create?courseId=${params.id}&level=course`}>
                      <GraduationCap className="h-4 w-4" />
                      Add Final Assessment
                    </Link>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("curriculum")}
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4" />
                    View Curriculum
                  </Button>
                  {course.status === "DRAFT" && (
                    <Button className="w-full gap-2">
                      <FileText className="h-4 w-4" />
                      Publish Course
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Course Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Level</span>
                      <span className="font-medium">{course.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Language</span>
                      <span className="font-medium">{course.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <span className="font-medium">{course.duration || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Students</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{course.currentEnrollments}</span>
                        {course.maxStudents && (
                          <span className="text-sm text-muted-foreground">
                            / {course.maxStudents}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="font-medium">
                        {format(new Date(course.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    {course.publishedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Published</span>
                        <span className="font-medium">
                          {format(new Date(course.publishedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-medium">
                        {course.isFree ? "Free" : `$${course.price}`}
                      </span>
                    </div>
                    {course.discountPrice && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Discount</span>
                        <span className="font-medium text-green-600">
                          ${course.discountPrice}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Completion Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Completion Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Final Assessment</span>
                    <Badge variant={course.hasFinalAssessment ? "default" : "outline"}>
                      {course.hasFinalAssessment ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {course.hasFinalAssessment && (
                    <div className="pl-4 border-l-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Required</span>
                        <Badge variant={course.finalAssessmentRequired ? "default" : "outline"}>
                          {course.finalAssessmentRequired ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Passing Score</span>
                        <span className="font-medium">{course.minimumCoursePassingScore}%</span>
                      </div>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">All Modules Complete</span>
                    <Badge variant={course.requireAllModulesComplete ? "default" : "outline"}>
                      {course.requireAllModulesComplete ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">All Assessments Passed</span>
                    <Badge variant={course.requireAllAssessmentsPassed ? "default" : "outline"}>
                      {course.requireAllAssessmentsPassed ? "Required" : "Optional"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Curriculum Tab */}
        <TabsContent value="curriculum" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Course Curriculum</CardTitle>
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="gap-2"
                  >
                    <Link href={`/dashboard/college/modules/create?courseId=${params.id}`}>
                      <Plus className="h-4 w-4" />
                      Add Module
                    </Link>
                  </Button>
                  {course.hasFinalAssessment && (
                    <Button
                      asChild
                      className="gap-2"
                    >
                      <Link href={`/dashboard/college/assessments/create?courseId=${params.id}&level=course`}>
                        <GraduationCap className="h-4 w-4" />
                        Add Final Assessment
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {curriculum.length === 0 ? (
                <EmptyState
                  title="No curriculum yet"
                  description="Add your first module to get started"
                  action={
                    <Link href={`/dashboard/college/modules/create?courseId=${params.id}`}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Module
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-6">
                  {curriculum.map((module) => (
                    <Card key={module.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Layers className="h-5 w-5 text-muted-foreground" />
                              {module.title}
                            </CardTitle>
                            {module.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {module.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Sort: {module.sortOrder}
                            </Badge>
                            {module.hasAssessment && (
                              <Badge variant="secondary">Assessment</Badge>
                            )}
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                            >
                              <Link href={`/dashboard/college/modules/${module.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                            >
                              <Link href={`/dashboard/college/modules/${module.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {module.lessons.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              No lessons in this module
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {module.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <h4 className="font-medium">{lesson.title}</h4>
                                      {lesson.description && (
                                        <p className="text-sm text-muted-foreground">
                                          {lesson.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {lesson.isFree && (
                                      <Badge variant="outline">Free</Badge>
                                    )}
                                    {lesson.hasQuiz && (
                                      <Badge variant="secondary">Quiz</Badge>
                                    )}
                                    <Badge variant="outline">
                                      Sort: {lesson.sortOrder}
                                    </Badge>
                                    <Button
                                      asChild
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Link href={`/dashboard/college/lessons/${lesson.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    <Button
                                      asChild
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Link href={`/dashboard/college/lessons/${lesson.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                            >
                              <Link href={`/dashboard/college/lessons/create?moduleId=${module.id}&courseId=${params.id}`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Lesson
                              </Link>
                            </Button>
                            {!module.hasAssessment && (
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                              >
                                <Link href={`/dashboard/college/assessments/create?moduleId=${module.id}&level=module`}>
                                  <GraduationCap className="h-4 w-4 mr-2" />
                                  Add Assessment
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Course Assessments</CardTitle>
                <Button
                  asChild
                  className="gap-2"
                >
                  <Link href={`/dashboard/college/assessments/create?courseId=${params.id}`}>
                    <Plus className="h-4 w-4" />
                    Create Assessment
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <EmptyState
                  title="No assessments yet"
                  description="Create assessments for your course"
                  action={
                    <Link href={`/dashboard/college/assessments/create?courseId=${params.id}`}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Assessment
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {/* Group assessments by type */}
                  {["COURSE_FINAL", "MODULE_ASSESSMENT", "LESSON_QUIZ"].map((level) => {
                    const levelAssessments = assessments.filter(
                      (a) => a.assessmentLevel === level
                    );
                    if (levelAssessments.length === 0) return null;

                    return (
                      <div key={level} className="space-y-3">
                        <h3 className="font-semibold text-lg">
                          {level.replace(/_/g, " ")}
                        </h3>
                        <div className="grid gap-4">
                          {levelAssessments.map((assessment) => (
                            <Card key={assessment.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">{assessment.title}</h4>
                                    {assessment.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {assessment.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                      <span>Passing: {assessment.passingScore}%</span>
                                      <span>Questions: {assessment.questionsCount}</span>
                                      {assessment.timeLimit && (
                                        <span>Time: {assessment.timeLimit} min</span>
                                      )}
                                      {assessment.maxAttempts && (
                                        <span>Attempts: {assessment.maxAttempts}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      asChild
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Link href={`/dashboard/college/assessments/${assessment.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    <Button
                                      asChild
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Link href={`/dashboard/college/assessments/${assessment.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Course performance and engagement metrics
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Enrollments</p>
                        <p className="text-2xl font-bold">{course.currentEnrollments}</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold">0%</p>
                      </div>
                      <Award className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Score</p>
                        <p className="text-2xl font-bold">N/A</p>
                      </div>
                      <GraduationCap className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-6 text-center text-muted-foreground">
                <p>Analytics data will be available after course is published and students enroll.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}