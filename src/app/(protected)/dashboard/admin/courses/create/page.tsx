/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/dashboard/admin/courses/create/page.tsx
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Plus, X, ChevronDown, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useCurrentUser } from "@/hooks/auth";
import { FileUpload } from "@/components/Videoupload";

type College = {
  id: string;
  collegeName: string;
};

type Category = {
  id: string;
  name: string;
};

type Question = {
  id?: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer: string;
  points?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  explanation?: string;
};

type Assessment = {
  id?: string;
  title: string;
  description?: string;
  assessmentLevel: "LESSON_QUIZ" | "MODULE_ASSESSMENT" | "COURSE_FINAL";
  passingScore: number;
  maxAttempts?: number;
  timeLimit?: number;
  isRequired: boolean;
  showCorrectAnswers: boolean;
  allowRetake: boolean;
  randomizeQuestions: boolean;
  availableFrom?: string;
  availableUntil?: string;
  questions: Question[];
};

type Lesson = {
  id?: string;
  title: string;
  description: string;
  contentType: "VIDEO" | "ARTICLE" | "QUIZ";
  videoUrl?: string;
  articleContent?: string;
  videoDuration?: number;
  isFree: boolean;
  sortOrder: number;
  hasQuiz: boolean;
  quizRequired: boolean;
  quiz?: Assessment;
};

type Module = {
  id?: string;
  title: string;
  description: string;
  sortOrder: number;
  lessons: Lesson[];
  hasAssessment: boolean;
  assessmentRequired: boolean;
  minimumPassingScore: number;
  requireAllLessonsComplete: boolean;
  moduleAssessment?: Assessment;
};

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const user = useCurrentUser();
  const [uploadedVideoUrls, setUploadedVideoUrls] = useState<
    Record<string, string>
  >({});
  const [modules, setModules] = useState<Module[]>([
    {
      title: "",
      description: "",
      sortOrder: 0,
      lessons: [],
      hasAssessment: false,
      assessmentRequired: true,
      minimumPassingScore: 60,
      requireAllLessonsComplete: true,
    },
  ]);

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
    hasFinalAssessment: true,
    finalAssessmentRequired: true,
    minimumCoursePassingScore: 60,
    requireAllModulesComplete: true,
    requireAllAssessmentsPassed: true,
  });

  // Dynamic arrays
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [showAddQuiz, setShowAddQuiz] = useState<string | null>(null);
  const [showAddModuleAssessment, setShowAddModuleAssessment] = useState<
    string | null
  >(null);
  const [editingAssessment, setEditingAssessment] = useState<{
    type: "lesson" | "module" | "course";
    moduleIndex?: number;
    lessonIndex?: number;
  } | null>(null);

  // Course final assessment
  const [courseFinalAssessment, setCourseFinalAssessment] =
    useState<Assessment>({
      title: "Final Course Assessment",
      description: "Complete this final assessment to finish the course",
      assessmentLevel: "COURSE_FINAL",
      passingScore: 60,
      isRequired: true,
      showCorrectAnswers: false,
      allowRetake: true,
      randomizeQuestions: false,
      questions: [],
    });

  // Fetch colleges and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch colleges
        const collegesRes = await fetch("/api/colleges");
        const collegesData = await collegesRes.json();
        if (collegesData.success) {
          setColleges(collegesData.data);
        }

        // Fetch categories
        const categoriesRes = await fetch("/api/categories");
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title]);

  const handleVideoUploadComplete = (
    moduleIndex: number,
    lessonIndex: number,
    url: string
  ) => {
    updateLesson(moduleIndex, lessonIndex, "videoUrl", url);
    const key = `${moduleIndex}-${lessonIndex}`;
    setUploadedVideoUrls((prev) => ({
      ...prev,
      [key]: url,
    }));
  };

  const handleFieldChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addLearningOutcome = () => {
    setLearningOutcomes([...learningOutcomes, ""]);
  };

  const removeLearningOutcome = (index: number) => {
    setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index));
  };

  const updateLearningOutcome = (index: number, value: string) => {
    const updated = [...learningOutcomes];
    updated[index] = value;
    setLearningOutcomes(updated);
  };

  const addRequirement = () => {
    setRequirements([...requirements, ""]);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const addModule = () => {
    setModules([
      ...modules,
      {
        title: "",
        description: "",
        sortOrder: modules.length,
        lessons: [],
        hasAssessment: false,
        assessmentRequired: true,
        minimumPassingScore: 60,
        requireAllLessonsComplete: true,
      },
    ]);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, field: keyof Module, value: any) => {
    const updated = [...modules];
    (updated[index] as any)[field] = value;
    setModules(updated);
  };

  const addLesson = (moduleIndex: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push({
      title: "",
      description: "",
      contentType: "VIDEO",
      isFree: false,
      sortOrder: updatedModules[moduleIndex].lessons.length,
      hasQuiz: false,
      quizRequired: false,
    });
    setModules(updatedModules);
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = updatedModules[
      moduleIndex
    ].lessons.filter((_, i) => i !== lessonIndex);
    setModules(updatedModules);
  };

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    field: keyof Lesson,
    value: any
  ) => {
    const updatedModules = [...modules];
    (updatedModules[moduleIndex].lessons[lessonIndex] as any)[field] = value;
    setModules(updatedModules);
  };

  const toggleQuizForLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules];
    const lesson = updatedModules[moduleIndex].lessons[lessonIndex];

    if (!lesson.hasQuiz) {
      // Add quiz
      lesson.hasQuiz = true;
      lesson.quiz = {
        title: `${lesson.title} Quiz`,
        description: "Test your knowledge from this lesson",
        assessmentLevel: "LESSON_QUIZ",
        passingScore: 60,
        isRequired: false,
        showCorrectAnswers: true,
        allowRetake: true,
        randomizeQuestions: false,
        questions: [],
      };
    } else {
      // Remove quiz
      lesson.hasQuiz = false;
      lesson.quizRequired = false;
      lesson.quiz = undefined;
    }

    setModules(updatedModules);
  };

  const toggleModuleAssessment = (moduleIndex: number) => {
    const updatedModules = [...modules];
    const module = updatedModules[moduleIndex];

    if (!module.hasAssessment) {
      // Add module assessment
      module.hasAssessment = true;
      module.moduleAssessment = {
        title: `${module.title} Assessment`,
        description: "Module assessment to test your understanding",
        assessmentLevel: "MODULE_ASSESSMENT",
        passingScore: module.minimumPassingScore || 60,
        isRequired: module.assessmentRequired,
        showCorrectAnswers: false,
        allowRetake: true,
        randomizeQuestions: true,
        questions: [],
      };
    } else {
      // Remove module assessment
      module.hasAssessment = false;
      module.moduleAssessment = undefined;
    }

    setModules(updatedModules);
  };

  const updateAssessment = (
    type: "lesson" | "module" | "course",
    field: keyof Assessment | "questions", // Move required parameter up
    value: any, // Move required parameter up
    moduleIndex?: number, // Optional parameters at the end
    lessonIndex?: number // Optional parameters at the end
  ) => {
    if (
      type === "lesson" &&
      moduleIndex !== undefined &&
      lessonIndex !== undefined
    ) {
      const updatedModules = [...modules];
      const lesson = updatedModules[moduleIndex].lessons[lessonIndex];
      if (lesson.quiz) {
        (lesson.quiz as any)[field] = value;
        setModules(updatedModules);
      }
    } else if (type === "module" && moduleIndex !== undefined) {
      const updatedModules = [...modules];
      const module = updatedModules[moduleIndex];
      if (module.moduleAssessment) {
        (module.moduleAssessment as any)[field] = value;
        setModules(updatedModules);
      }
    } else if (type === "course") {
      setCourseFinalAssessment((prev) => ({ ...prev, [field]: value }));
    }
  };

  const addQuestion = (
    type: "lesson" | "module" | "course",
    moduleIndex?: number,
    lessonIndex?: number
  ) => {
    const newQuestion: Question = {
      questionText: "",
      questionType: "MULTIPLE_CHOICE",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      difficulty: "MEDIUM",
    };

    updateAssessment(
      type,
      "questions",
      type === "lesson" &&
        moduleIndex !== undefined &&
        lessonIndex !== undefined
        ? [
            ...(modules[moduleIndex].lessons[lessonIndex].quiz?.questions ||
              []),
            newQuestion,
          ]
        : type === "module" && moduleIndex !== undefined
        ? [
            ...(modules[moduleIndex].moduleAssessment?.questions || []),
            newQuestion,
          ]
        : [...courseFinalAssessment.questions, newQuestion],
      moduleIndex,
      lessonIndex
    );
  };

  const updateQuestion = (
    type: "lesson" | "module" | "course",
    questionIndex: number,
    field: keyof Question,
    value: any,
    moduleIndex?: number,
    lessonIndex?: number
  ) => {
    let questions: Question[] = [];

    if (
      type === "lesson" &&
      moduleIndex !== undefined &&
      lessonIndex !== undefined
    ) {
      questions = [
        ...(modules[moduleIndex].lessons[lessonIndex].quiz?.questions || []),
      ];
    } else if (type === "module" && moduleIndex !== undefined) {
      questions = [...(modules[moduleIndex].moduleAssessment?.questions || [])];
    } else if (type === "course") {
      questions = [...courseFinalAssessment.questions];
    }

    if (questionIndex < questions.length) {
      (questions[questionIndex] as any)[field] = value;
      updateAssessment(type, "questions", questions, moduleIndex, lessonIndex);
    }
  };

  const removeQuestion = (
    type: "lesson" | "module" | "course",
    questionIndex: number, // Move required parameter up
    moduleIndex?: number,
    lessonIndex?: number
  ) => {
    let questions: Question[] = [];

    if (
      type === "lesson" &&
      moduleIndex !== undefined &&
      lessonIndex !== undefined
    ) {
      questions =
        modules[moduleIndex].lessons[lessonIndex].quiz?.questions || [];
    } else if (type === "module" && moduleIndex !== undefined) {
      questions = modules[moduleIndex].moduleAssessment?.questions || [];
    } else if (type === "course") {
      questions = courseFinalAssessment.questions;
    }

    const updatedQuestions = questions.filter((_, i) => i !== questionIndex);
    updateAssessment(
      type,
      "questions",
      updatedQuestions,
      moduleIndex,
      lessonIndex
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

    setLoading(true);

    const createdBy = user?.id;

    const payload = {
      ...formData,
      createdBy,
      status: formData.status,
      collegeId: formData.collegeId || null,
      thumbnailUrl: formData.thumbnailUrl || null,
      previewVideoUrl: formData.previewVideoUrl || null,
      prerequisites: formData.prerequisites || null,
      price: formData.price ? Number(formData.price) : null,
      discountPrice: formData.discountPrice
        ? Number(formData.discountPrice)
        : null,
      maxStudents: formData.maxStudents ? Number(formData.maxStudents) : null,
      hasFinalAssessment: formData.hasFinalAssessment,
      finalAssessmentRequired: formData.finalAssessmentRequired,
      minimumCoursePassingScore: Number(formData.minimumCoursePassingScore),
      requireAllModulesComplete: formData.requireAllModulesComplete,
      requireAllAssessmentsPassed: formData.requireAllAssessmentsPassed,
    };

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (response.success) {
        const courseId = response.data.id;

        // Add learning outcomes
        for (const outcome of learningOutcomes.filter((o) => o.trim())) {
          await fetch(`/api/courses?id=${courseId}&outcomes=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ outcome }),
          });
        }

        // Add requirements
        for (const requirement of requirements.filter((r) => r.trim())) {
          await fetch(`/api/courses?id=${courseId}&requirements=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requirement }),
          });
        }

        // Add modules and lessons
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          if (module.title.trim()) {
            // Create module
            const moduleRes = await fetch(
              `/api/courses?id=${courseId}&modules=true`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: module.title,
                  description: module.description,
                  hasAssessment: module.hasAssessment,
                  assessmentRequired: module.assessmentRequired,
                  minimumPassingScore: module.minimumPassingScore,
                  requireAllLessonsComplete: module.requireAllLessonsComplete,
                  sortOrder: i,
                }),
              }
            );

            const moduleData = await moduleRes.json();

            if (moduleData.success) {
              // Add module assessment if exists
              if (module.hasAssessment && module.moduleAssessment) {
                // For module assessment:
                // For module assessment
                // For module assessment
                await fetch(
                  `/api/courses?id=${courseId}&assessments=true&assessmentLevel=MODULE_ASSESSMENT&moduleId=${moduleData.data.id}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...module.moduleAssessment,
                      createdBy,
                      questions: module.moduleAssessment?.questions || [],
                    }),
                  }
                );
              }

              // Add lessons for this module
              for (let j = 0; j < module.lessons.length; j++) {
                const lesson = module.lessons[j];
                if (lesson.title.trim()) {
                  const lessonRes = await fetch(
                    `/api/courses?id=${courseId}&lessons=true&moduleId=${moduleData.data.id}`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: lesson.title,
                        description: lesson.description,
                        contentType: lesson.contentType,
                        videoUrl: lesson.videoUrl || null,
                        articleContent: lesson.articleContent || null,
                        videoDuration: lesson.videoDuration || null,
                        isFree: lesson.isFree,
                        hasQuiz: lesson.hasQuiz,
                        quizRequired: lesson.quizRequired,
                        sortOrder: j,
                      }),
                    }
                  );

                  const lessonData = await lessonRes.json();

                  if (lessonData.success && lesson.hasQuiz && lesson.quiz) {
                    // Add lesson quiz
                    await fetch(
                      `/api/courses?id=${courseId}&assessments=true&assessmentLevel=LESSON_QUIZ&lessonId=${lessonData.data.id}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...lesson.quiz,
                          createdBy,
                          questions: lesson.quiz?.questions || [],
                        }),
                      }
                    );
                  }
                }
              }
            }
          }
        }

        // Add course final assessment
        if (formData.hasFinalAssessment) {
          // For course final assessment
          await fetch(
            `/api/courses?id=${courseId}&assessments=true&assessmentLevel=COURSE_FINAL`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...courseFinalAssessment,
                createdBy,
                questions: courseFinalAssessment.questions,
              }),
            }
          );
        }

        Swal.fire({
          icon: "success",
          title: "Course Created!",
          text: "Course has been created successfully",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          router.push("/dashboard/admin/courses");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Failed to create course",
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

  const toggleModule = (index: number) => {
    setExpandedModules((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const renderAssessmentEditor = () => {
    if (!editingAssessment) return null;

    const { type, moduleIndex, lessonIndex } = editingAssessment;

    let assessment: Assessment | undefined;
    let title = "";

    if (
      type === "lesson" &&
      moduleIndex !== undefined &&
      lessonIndex !== undefined
    ) {
      assessment = modules[moduleIndex]?.lessons[lessonIndex]?.quiz;
      title = `${modules[moduleIndex]?.lessons[lessonIndex]?.title} Quiz`;
    } else if (type === "module" && moduleIndex !== undefined) {
      assessment = modules[moduleIndex]?.moduleAssessment;
      title = `${modules[moduleIndex]?.title} Assessment`;
    } else if (type === "course") {
      assessment = courseFinalAssessment;
      title = "Final Course Assessment";
    }

    if (!assessment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit {title}</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setEditingAssessment(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Assessment Title</Label>
                <Input
                  value={assessment.title}
                  onChange={(e) =>
                    updateAssessment(
                      type,
                      "title",
                      e.target.value,
                      moduleIndex,
                      lessonIndex
                    )
                  }
                  placeholder="Assessment title"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={assessment.description || ""}
                  onChange={(e) =>
                    updateAssessment(
                      type,
                      "description",
                      e.target.value,
                      moduleIndex,
                      lessonIndex
                    )
                  }
                  placeholder="Assessment description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    value={assessment.passingScore}
                    onChange={(e) =>
                      updateAssessment(
                        type,
                        "passingScore",
                        Number(e.target.value),
                        moduleIndex,
                        lessonIndex
                      )
                    }
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <Label>Time Limit (minutes, optional)</Label>
                  <Input
                    type="number"
                    value={assessment.timeLimit || ""}
                    onChange={(e) =>
                      updateAssessment(
                        type,
                        "timeLimit",
                        e.target.value ? Number(e.target.value) : undefined,
                        moduleIndex,
                        lessonIndex
                      )
                    }
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Questions ({assessment.questions.length})</Label>
                  <Button
                    type="button"
                    onClick={() => addQuestion(type, moduleIndex, lessonIndex)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {assessment.questions.map((question, qIndex) => (
                  <div key={qIndex} className="border rounded p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Label>Question {qIndex + 1}</Label>
                        <Textarea
                          value={question.questionText}
                          onChange={(e) =>
                            updateQuestion(
                              type,
                              qIndex,
                              "questionText",
                              e.target.value,
                              moduleIndex,
                              lessonIndex
                            )
                          }
                          placeholder="Enter question text..."
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          removeQuestion(type, qIndex, moduleIndex, lessonIndex)
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Question Type</Label>
                        <Select
                          value={question.questionType}
                          onValueChange={(
                            value:
                              | "MULTIPLE_CHOICE"
                              | "TRUE_FALSE"
                              | "SHORT_ANSWER"
                          ) =>
                            updateQuestion(
                              type,
                              qIndex,
                              "questionType",
                              value,
                              moduleIndex,
                              lessonIndex
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MULTIPLE_CHOICE">
                              Multiple Choice
                            </SelectItem>
                            <SelectItem value="TRUE_FALSE">
                              True/False
                            </SelectItem>
                            <SelectItem value="SHORT_ANSWER">
                              Short Answer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={question.points || 1}
                          onChange={(e) =>
                            updateQuestion(
                              type,
                              qIndex,
                              "points",
                              Number(e.target.value),
                              moduleIndex,
                              lessonIndex
                            )
                          }
                          min={1}
                        />
                      </div>
                    </div>

                    {question.questionType === "MULTIPLE_CHOICE" && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {(question.options || []).map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center gap-2"
                          >
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [
                                  ...(question.options || []),
                                ];
                                newOptions[optionIndex] = e.target.value;
                                updateQuestion(
                                  type,
                                  qIndex,
                                  "options",
                                  newOptions,
                                  moduleIndex,
                                  lessonIndex
                                );
                              }}
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correctAnswer === option}
                              onChange={() =>
                                updateQuestion(
                                  type,
                                  qIndex,
                                  "correctAnswer",
                                  option,
                                  moduleIndex,
                                  lessonIndex
                                )
                              }
                              className="h-4 w-4"
                            />
                            <Label>Correct</Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.questionType === "TRUE_FALSE" && (
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <Select
                          value={question.correctAnswer}
                          onValueChange={(value) =>
                            updateQuestion(
                              type,
                              qIndex,
                              "correctAnswer",
                              value,
                              moduleIndex,
                              lessonIndex
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {question.questionType === "SHORT_ANSWER" && (
                      <div>
                        <Label>Correct Answer</Label>
                        <Input
                          value={question.correctAnswer}
                          onChange={(e) =>
                            updateQuestion(
                              type,
                              qIndex,
                              "correctAnswer",
                              e.target.value,
                              moduleIndex,
                              lessonIndex
                            )
                          }
                          placeholder="Expected answer"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Explanation (optional)</Label>
                      <Textarea
                        value={question.explanation || ""}
                        onChange={(e) =>
                          updateQuestion(
                            type,
                            qIndex,
                            "explanation",
                            e.target.value,
                            moduleIndex,
                            lessonIndex
                          )
                        }
                        placeholder="Explanation for the answer"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAssessment(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditingAssessment(null)}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className=" mx-auto ">
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
                Create New Course
              </h1>
              <p className="text-gray-600">
                Fill in the course details to create a new course.
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
                  <p className="text-xs text-gray-500 mt-1">
                    URL-friendly version of the title (auto-generated)
                  </p>
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

          {/* Course Completion Settings */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Course Completion Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Final Assessment</Label>
                    <p className="text-sm text-gray-500">
                      Add a final assessment for the course
                    </p>
                  </div>
                  <Switch
                    checked={formData.hasFinalAssessment}
                    onCheckedChange={(checked) =>
                      handleFieldChange("hasFinalAssessment", checked)
                    }
                  />
                </div>

                {formData.hasFinalAssessment && (
                  <div className="border rounded p-4 space-y-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">
                          Final Assessment Required
                        </Label>
                        <p className="text-sm text-gray-500">
                          Students must pass final assessment to complete course
                        </p>
                      </div>
                      <Switch
                        checked={formData.finalAssessmentRequired}
                        onCheckedChange={(checked) =>
                          handleFieldChange("finalAssessmentRequired", checked)
                        }
                      />
                    </div>

                    <div>
                      <Label>Minimum Passing Score for Course</Label>
                      <Input
                        type="number"
                        value={formData.minimumCoursePassingScore}
                        onChange={(e) =>
                          handleFieldChange(
                            "minimumCoursePassingScore",
                            Number(e.target.value)
                          )
                        }
                        min={0}
                        max={100}
                        placeholder="60"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => setEditingAssessment({ type: "course" })}
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Configure Final Assessment
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">
                      Require All Modules Complete
                    </Label>
                    <p className="text-sm text-gray-500">
                      Students must complete all modules to finish course
                    </p>
                  </div>
                  <Switch
                    checked={formData.requireAllModulesComplete}
                    onCheckedChange={(checked) =>
                      handleFieldChange("requireAllModulesComplete", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">
                      Require All Assessments Passed
                    </Label>
                    <p className="text-sm text-gray-500">
                      Students must pass all required assessments
                    </p>
                  </div>
                  <Switch
                    checked={formData.requireAllAssessmentsPassed}
                    onCheckedChange={(checked) =>
                      handleFieldChange("requireAllAssessmentsPassed", checked)
                    }
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
                <CardTitle className="text-xl text-gray-900">
                  Learning Outcomes
                </CardTitle>
                <Button
                  type="button"
                  onClick={addLearningOutcome}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Outcome
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={outcome}
                    onChange={(e) =>
                      updateLearningOutcome(index, e.target.value)
                    }
                    placeholder="What students will learn..."
                  />
                  {learningOutcomes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLearningOutcome(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-gray-900">
                  Requirements
                </CardTitle>
                <Button
                  type="button"
                  onClick={addRequirement}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {requirements.map((requirement, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={requirement}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    placeholder="Prerequisites for the course..."
                  />
                  {requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRequirement(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Course Modules */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-gray-900">
                  Course Modules
                </CardTitle>
                <Button
                  type="button"
                  onClick={addModule}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {modules.map((module, moduleIndex) => (
                <div
                  key={moduleIndex}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleModule(moduleIndex)}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expandedModules.includes(moduleIndex)
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </Button>
                      <Label className="text-sm font-medium">
                        Module {moduleIndex + 1}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => toggleModuleAssessment(moduleIndex)}
                        variant={module.hasAssessment ? "default" : "outline"}
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {module.hasAssessment
                          ? "Assessment Added"
                          : "Add Assessment"}
                      </Button>
                      {modules.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeModule(moduleIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Input
                    value={module.title}
                    onChange={(e) =>
                      updateModule(moduleIndex, "title", e.target.value)
                    }
                    placeholder="Module title..."
                  />
                  <Textarea
                    value={module.description}
                    onChange={(e) =>
                      updateModule(moduleIndex, "description", e.target.value)
                    }
                    placeholder="Module description (optional)..."
                    rows={2}
                  />

                  {module.hasAssessment && (
                    <div className="border rounded p-3 space-y-3 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <Label className="font-medium text-blue-800">
                            Module Assessment
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            onClick={() =>
                              setEditingAssessment({
                                type: "module",
                                moduleIndex,
                              })
                            }
                            variant="outline"
                            size="sm"
                          >
                            Configure
                          </Button>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`module-required-${moduleIndex}`}
                              checked={module.assessmentRequired}
                              onChange={(e) =>
                                updateModule(
                                  moduleIndex,
                                  "assessmentRequired",
                                  e.target.checked
                                )
                              }
                              className="rounded"
                            />
                            <Label
                              htmlFor={`module-required-${moduleIndex}`}
                              className="text-sm"
                            >
                              Required
                            </Label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Minimum Passing Score</Label>
                        <Input
                          type="number"
                          value={module.minimumPassingScore}
                          onChange={(e) =>
                            updateModule(
                              moduleIndex,
                              "minimumPassingScore",
                              Number(e.target.value)
                            )
                          }
                          min={0}
                          max={100}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Lessons Section */}
                  {expandedModules.includes(moduleIndex) && (
                    <div className="ml-6 border-l-2 border-gray-200 pl-4 space-y-4">
                      <div className="flex items-center justify-between pt-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Lessons ({module.lessons.length})
                        </Label>
                        <Button
                          type="button"
                          onClick={() => addLesson(moduleIndex)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Lesson
                        </Button>
                      </div>

                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lessonIndex}
                          className="border rounded p-3 space-y-3 bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">
                              Lesson {lessonIndex + 1}
                            </Label>
                            <div className="flex items-center gap-2">
                              {lesson.hasQuiz && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <FileText className="h-3 w-3" />
                                  <span className="text-xs">Quiz</span>
                                </div>
                              )}
                              {module.lessons.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeLesson(moduleIndex, lessonIndex)
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <Input
                            value={lesson.title}
                            onChange={(e) =>
                              updateLesson(
                                moduleIndex,
                                lessonIndex,
                                "title",
                                e.target.value
                              )
                            }
                            placeholder="Lesson title..."
                            className="text-sm"
                          />

                          <Textarea
                            value={lesson.description}
                            onChange={(e) =>
                              updateLesson(
                                moduleIndex,
                                lessonIndex,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Lesson description..."
                            rows={2}
                            className="text-sm"
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label
                                htmlFor={`content-type-${moduleIndex}-${lessonIndex}`}
                                className="text-xs"
                              >
                                Content Type
                              </Label>
                              <Select
                                value={lesson.contentType}
                                onValueChange={(value: "VIDEO" | "ARTICLE") =>
                                  updateLesson(
                                    moduleIndex,
                                    lessonIndex,
                                    "contentType",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="VIDEO">Video</SelectItem>
                                  <SelectItem value="ARTICLE">
                                    Article
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                              <input
                                type="checkbox"
                                id={`is-free-${moduleIndex}-${lessonIndex}`}
                                checked={lesson.isFree}
                                onChange={(e) =>
                                  updateLesson(
                                    moduleIndex,
                                    lessonIndex,
                                    "isFree",
                                    e.target.checked
                                  )
                                }
                                className="rounded"
                              />
                              <Label
                                htmlFor={`is-free-${moduleIndex}-${lessonIndex}`}
                                className="text-xs"
                              >
                                Free Lesson
                              </Label>
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                              <input
                                type="checkbox"
                                id={`has-quiz-${moduleIndex}-${lessonIndex}`}
                                checked={lesson.hasQuiz}
                                onChange={() =>
                                  toggleQuizForLesson(moduleIndex, lessonIndex)
                                }
                                className="rounded"
                              />
                              <Label
                                htmlFor={`has-quiz-${moduleIndex}-${lessonIndex}`}
                                className="text-xs"
                              >
                                Add Quiz
                              </Label>
                            </div>
                          </div>

                          {lesson.hasQuiz && (
                            <div className="border rounded p-3 space-y-2 bg-blue-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-blue-600" />
                                  <Label className="text-xs font-medium text-blue-800">
                                    Lesson Quiz
                                  </Label>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    onClick={() =>
                                      setEditingAssessment({
                                        type: "lesson",
                                        moduleIndex,
                                        lessonIndex,
                                      })
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs"
                                  >
                                    Configure Quiz
                                  </Button>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      id={`quiz-required-${moduleIndex}-${lessonIndex}`}
                                      checked={lesson.quizRequired}
                                      onChange={(e) =>
                                        updateLesson(
                                          moduleIndex,
                                          lessonIndex,
                                          "quizRequired",
                                          e.target.checked
                                        )
                                      }
                                      className="rounded h-3 w-3"
                                    />
                                    <Label
                                      htmlFor={`quiz-required-${moduleIndex}-${lessonIndex}`}
                                      className="text-xs"
                                    >
                                      Required
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {lesson.contentType === "VIDEO" && (
                            <div className="space-y-3">
                              <Label className="text-xs">Video Content</Label>
                              <Input
                                value={lesson.videoUrl || ""}
                                onChange={(e) =>
                                  updateLesson(
                                    moduleIndex,
                                    lessonIndex,
                                    "videoUrl",
                                    e.target.value
                                  )
                                }
                                placeholder="YouTube URL or leave empty for upload..."
                                className="text-sm"
                              />
                              <div className="text-xs text-gray-500">
                                - OR -
                              </div>
                              <FileUpload
                                onUploadComplete={(url) =>
                                  handleVideoUploadComplete(
                                    moduleIndex,
                                    lessonIndex,
                                    url
                                  )
                                }
                                accept="video/*"
                                maxSize={200}
                                label="Upload Video File"
                                value={lesson.videoUrl || ""}
                              />
                              {lesson.videoUrl &&
                                lesson.videoUrl.includes(
                                  "s3.amazonaws.com"
                                ) && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">
                                        Video Duration (minutes)
                                      </Label>
                                      <Input
                                        type="number"
                                        value={lesson.videoDuration || ""}
                                        onChange={(e) =>
                                          updateLesson(
                                            moduleIndex,
                                            lessonIndex,
                                            "videoDuration",
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        placeholder="e.g., 45"
                                        className="text-sm"
                                      />
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}

                          {lesson.contentType === "ARTICLE" && (
                            <Textarea
                              value={lesson.articleContent || ""}
                              onChange={(e) =>
                                updateLesson(
                                  moduleIndex,
                                  lessonIndex,
                                  "articleContent",
                                  e.target.value
                                )
                              }
                              placeholder="Article content..."
                              rows={4}
                              className="text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating…" : "Create Course"}
            </Button>
          </div>
        </form>
      </div>

      {/* Assessment Editor Modal */}
      {renderAssessmentEditor()}
    </div>
  );
}
