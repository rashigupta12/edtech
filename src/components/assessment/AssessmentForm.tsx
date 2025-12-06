"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Layers,
  FileText,
  Clock,
  Target,
  CheckCircle,
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrentUser } from "@/hooks/auth";
import { Label } from "@/components/ui/label";
import Link from "next/link";

// Types (same as before)
export type AssessmentLevel = "LESSON_QUIZ" | "MODULE_ASSESSMENT" | "COURSE_FINAL";

export type Question = {
  id?: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer: string;
  points?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  explanation?: string;
};

export type AssessmentFormData = {
  title: string;
  description?: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  assessmentLevel: AssessmentLevel;
  duration?: number;
  passingScore: number;
  maxAttempts?: number;
  timeLimit?: number;
  isRequired: boolean;
  showCorrectAnswers: boolean;
  allowRetake: boolean;
  randomizeQuestions: boolean;
  createdBy: string;
  facultyId?: string;
};

export type Course = {
  id: string;
  title: string;
  code: string;
};

export type Module = {
  id: string;
  title: string;
  courseId: string;
  lessons: Lesson[];
};

export type Lesson = {
  id: string;
  title: string;
  moduleId: string;
  description: string | null;
  contentType: string;
  videoUrl: string | null;
  hasQuiz: boolean;
  quiz?: {
    id: string;
    title: string;
    description: string | null;
    assessmentLevel: string;
    passingScore: number;
    questions: any[];
  } | null;
};

export type AssessmentFormProps = {
  mode: "create" | "edit";
  assessmentId?: string;
  initialData?: {
    formData?: Partial<AssessmentFormData>;
    questions?: Question[];
  };
  onSuccess?: (assessmentId?: string) => void;
  onCancel?: () => void;
  onDelete?: () => void;
};

export default function AssessmentForm({
  mode,
  assessmentId,
  initialData,
  onSuccess,
  onCancel,
  onDelete,
}: AssessmentFormProps) {
  const user = useCurrentUser();
  
  const [loading, setLoading] = useState(false);
  const [loadingAssessment, setLoadingAssessment] = useState(mode === "edit");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Data for dropdowns
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingData, setLoadingData] = useState({
    courses: false,
    modules: false,
    lessons: false,
  });

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: "",
      questionType: "MULTIPLE_CHOICE",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      difficulty: "MEDIUM",
      explanation: "",
    },
  ]);

  // Form state
  const [formData, setFormData] = useState<AssessmentFormData>({
    title: "",
    description: "",
    courseId: "",
    moduleId: "",
    lessonId: "",
    assessmentLevel: "LESSON_QUIZ",
    duration: undefined,
    passingScore: 60,
    maxAttempts: undefined,
    timeLimit: undefined,
    isRequired: true,
    showCorrectAnswers: true,
    allowRetake: true,
    randomizeQuestions: false,
    createdBy: user?.id || "",
    facultyId: "",
  });

  // Initialize with provided data
  useEffect(() => {
    if (initialData) {
      if (initialData.formData) {
        setFormData(prev => ({
          ...prev,
          ...initialData.formData,
        }));
      }
      if (initialData.questions) {
        setQuestions(initialData.questions);
      }
    }
  }, [initialData]);

  // Fetch data based on mode
  useEffect(() => {
    fetchCourses();
    
    if (mode === "edit" && assessmentId) {
      fetchAssessment();
    }
  }, [mode, assessmentId]);

  const fetchAssessment = async () => {
    try {
      setLoadingAssessment(true);
      const response = await fetch(`/api/assessments?id=${assessmentId}`);
      if (!response.ok) throw new Error("Failed to fetch assessment");

      const data = await response.json();
      if (data.success) {
        const assessment = data.data;
        
        // Set form data
        setFormData(prev => ({
          ...prev,
          title: assessment.title,
          description: assessment.description || "",
          courseId: assessment.courseId,
          moduleId: assessment.moduleId || "",
          lessonId: assessment.lessonId || "",
          assessmentLevel: assessment.assessmentLevel,
          duration: assessment.duration || undefined,
          passingScore: assessment.passingScore,
          maxAttempts: assessment.maxAttempts || undefined,
          timeLimit: assessment.timeLimit || undefined,
          isRequired: assessment.isRequired,
          showCorrectAnswers: assessment.showCorrectAnswers,
          allowRetake: assessment.allowRetake,
          randomizeQuestions: assessment.randomizeQuestions,
          createdBy: assessment.createdBy,
          facultyId: assessment.facultyId || "",
        }));

        // Set questions
        setQuestions(assessment.questions || [
          {
            questionText: "",
            questionType: "MULTIPLE_CHOICE",
            options: ["", "", "", ""],
            correctAnswer: "",
            points: 1,
            difficulty: "MEDIUM",
            explanation: "",
          },
        ]);

        // Fetch related modules and lessons based on assessment level
        if (assessment.courseId) {
          fetchModules(assessment.courseId);
        }
        
        // Set lesson from assessment data if available
        if (assessment.lessonId && assessment.lessonTitle) {
          const lessonFromAssessment: Lesson = {
            id: assessment.lessonId,
            title: assessment.lessonTitle,
            moduleId: assessment.moduleId || "",
            description: null,
            contentType: "",
            videoUrl: null,
            hasQuiz: true,
            quiz: null,
          };
          setLessons([lessonFromAssessment]);
        }
      } else {
        throw new Error(data.error?.message || "Failed to load assessment");
      }
    } catch (err) {
      console.error("Failed to fetch assessment:", err);
      setError(
        `Failed to load assessment: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoadingAssessment(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingData((prev) => ({ ...prev, courses: true }));
      const response = await fetch("/api/courses?faculty=true");
      if (!response.ok) throw new Error("Failed to fetch courses");

      const data = await response.json();
      if (data.success) {
        setCourses(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoadingData((prev) => ({ ...prev, courses: false }));
    }
  };

  const fetchModules = async (courseId: string) => {
    try {
      if (!courseId) {
        setModules([]);
        setLessons([]);
        return;
      }

      setLoadingData((prev) => ({ ...prev, modules: true }));

      const response = await fetch(
        `/api/courses?id=${courseId}&curriculum=true`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const modulesData = data.data?.modules || [];
        setModules(modulesData);
        
        // If we have a moduleId from form data, fetch its lessons
        if (formData.moduleId) {
          const selectedModule = modulesData.find((module: Module) => module.id === formData.moduleId);
          if (selectedModule && selectedModule.lessons) {
            setLessons(selectedModule.lessons || []);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch modules:", err);
      setError(
        `Failed to load modules: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoadingData((prev) => ({ ...prev, modules: false }));
    }
  };

  const fetchLessons = async (moduleId: string) => {
    try {
      if (!moduleId) {
        setLessons([]);
        return;
      }

      setLoadingData((prev) => ({ ...prev, lessons: true }));

      const selectedModule = modules.find((module) => module.id === moduleId);

      if (selectedModule && selectedModule.lessons) {
        const lessonsData = selectedModule.lessons || [];
        setLessons(lessonsData);
      } else {
        setLessons([]);
      }
    } catch (err) {
      console.error("Failed to fetch lessons:", err);
      setError(
        `Failed to load lessons: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoadingData((prev) => ({ ...prev, lessons: false }));
    }
  };

  // Handle assessment level change
  const handleAssessmentLevelChange = (level: AssessmentLevel) => {
    // Reset fields based on selected level
    const resetFields: Partial<AssessmentFormData> = {};
    
    if (level === "COURSE_FINAL") {
      resetFields.moduleId = "";
      resetFields.lessonId = "";
      setLessons([]);
    } else if (level === "MODULE_ASSESSMENT") {
      resetFields.lessonId = "";
      setLessons([]);
    }
    
    setFormData((prev) => ({
      ...prev,
      assessmentLevel: level,
      ...resetFields,
    }));
  };

  // Handle course change
  const handleCourseChange = (courseId: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      courseId,
      moduleId: "",
      lessonId: "",
    }));
    setModules([]);
    setLessons([]);
    
    if (courseId) {
      fetchModules(courseId);
    }
  };

  // Handle module change
  const handleModuleChange = (moduleId: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      moduleId,
      lessonId: "",
    }));
    setLessons([]);
    
    if (moduleId) {
      fetchLessons(moduleId);
    }
  };

  // Handle lesson change
  const handleLessonChange = (lessonId: string) => {
    setFormData((prev) => ({ ...prev, lessonId }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (
    name: keyof AssessmentFormData,
    checked: boolean
  ) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Question Management Functions (keep these the same)
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        questionType: "MULTIPLE_CHOICE",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
        difficulty: "MEDIUM",
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index, 1);
      setQuestions(updatedQuestions);
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];

    if (field === "questionType") {
      // Reset options and correct answer when question type changes
      if (value === "MULTIPLE_CHOICE") {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          questionType: value,
          options: ["", "", "", ""],
          correctAnswer: "",
        };
      } else if (value === "TRUE_FALSE") {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          questionType: value,
          options: undefined,
          correctAnswer: "true",
        };
      } else if (value === "SHORT_ANSWER") {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          questionType: value,
          options: undefined,
          correctAnswer: "",
        };
      }
    } else if (field === "options") {
      // Handle option updates
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        options: value,
      };
    } else {
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value,
      };
    }

    setQuestions(updatedQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    const options = [...(updatedQuestions[questionIndex].options || [])];
    options[optionIndex] = value;
    updatedQuestions[questionIndex].options = options;
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const options = [...(updatedQuestions[questionIndex].options || [])];
    options.push("");
    updatedQuestions[questionIndex].options = options;
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    const options = [...(updatedQuestions[questionIndex].options || [])];
    if (options.length > 2) {
      options.splice(optionIndex, 1);
      updatedQuestions[questionIndex].options = options;
      setQuestions(updatedQuestions);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError("Assessment title is required");
      return false;
    }

    if (!formData.courseId) {
      setError("Please select a course");
      return false;
    }

    if (formData.assessmentLevel === "LESSON_QUIZ" && !formData.lessonId) {
      setError("Please select a lesson for the quiz");
      return false;
    }

    if (
      formData.assessmentLevel === "MODULE_ASSESSMENT" &&
      !formData.moduleId
    ) {
      setError("Please select a module for the assessment");
      return false;
    }

    if (formData.passingScore < 0 || formData.passingScore > 100) {
      setError("Passing score must be between 0 and 100");
      return false;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question.questionText.trim()) {
        setError(`Question ${i + 1}: Question text is required`);
        return false;
      }

      if (question.questionType === "MULTIPLE_CHOICE") {
        // Check if at least one option is filled
        const hasOptions = question.options?.some((opt) => opt.trim() !== "");
        if (!hasOptions) {
          setError(
            `Question ${
              i + 1
            }: At least one option is required for multiple choice`
          );
          return false;
        }

        // Check if correct answer is set
        if (!question.correctAnswer.trim()) {
          setError(
            `Question ${
              i + 1
            }: Please select a correct answer for multiple choice`
          );
          return false;
        }
      }

      if (!question.correctAnswer.trim()) {
        setError(`Question ${i + 1}: Correct answer is required`);
        return false;
      }
    }

    return true;
  };

 const prepareFormDataForApi = () => {
  // Ensure all questions have required fields with proper defaults
  const processedQuestions = questions.map((question) => {
    const baseQuestion = {
      questionText: question.questionText || '',
      questionType: question.questionType || 'MULTIPLE_CHOICE',
      correctAnswer: question.correctAnswer || '',
      points: question.points || 1,
      difficulty: question.difficulty || 'MEDIUM',
      explanation: question.explanation || null,
      negativePoints: 0,
      questionBankId: null,
    };

    // Add options only for multiple choice questions
    if (question.questionType === 'MULTIPLE_CHOICE') {
      const filteredOptions = question.options?.filter((opt) => opt.trim() !== '') || [];
      return {
        ...baseQuestion,
        options: filteredOptions.length > 0 ? filteredOptions : ['Option 1', 'Option 2'],
      };
    }

    return baseQuestion;
  });

  return {
    title: formData.title,
    description: formData.description || null,
    courseId: formData.courseId,
    moduleId: formData.moduleId || null,
    lessonId: formData.lessonId || null,
    assessmentLevel: formData.assessmentLevel,
    duration: formData.duration || null,
    passingScore: formData.passingScore,
    maxAttempts: formData.maxAttempts || null,
    timeLimit: formData.timeLimit || null,
    isRequired: formData.isRequired,
    showCorrectAnswers: formData.showCorrectAnswers,
    allowRetake: formData.allowRetake,
    randomizeQuestions: formData.randomizeQuestions,
    createdBy: formData.createdBy,
    questions: processedQuestions.filter(q => q.questionText.trim() !== ''), // Filter out empty questions
  };
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  if (!validateForm()) return;

  setLoading(true);

  try {
    const apiData = prepareFormDataForApi();
    
    const requestData = {
      ...apiData,
      questions: apiData.questions.map(q => {
        const baseQuestion = {
          questionText: q.questionText || '',
          questionType: q.questionType || 'MULTIPLE_CHOICE',
          correctAnswer: q.correctAnswer || '',
          points: q.points || 1,
          difficulty: q.difficulty || 'MEDIUM',
          explanation: q.explanation || null,
        };
        
        // Only add options for MULTIPLE_CHOICE questions
        if (q.questionType === 'MULTIPLE_CHOICE' && 'options' in q) {
          return {
            ...baseQuestion,
            options: q.options,
          };
        }
        
        return baseQuestion;
      })
    };

    let response;
    let url;
    
    if (mode === 'edit' && assessmentId) {
      // UPDATE existing assessment
      url = `/api/assessments?id=${assessmentId}`;
      response = await fetch(url, {
        method: 'PUT', // Use PUT for updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
    } else {
      // CREATE new assessment
      url = '/api/assessments';
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 
        (mode === 'edit' ? 'Failed to update assessment' : 'Failed to create assessment'));
    }

    console.log(`${mode === 'edit' ? 'Update' : 'Create'} response:`, data);
    
    setSuccess(true);
    
    if (onSuccess) {
      onSuccess(data.data?.id);
    }
  } catch (err: any) {
    console.error(`${mode === 'edit' ? 'Update' : 'Create'} assessment error:`, err);
    setError(
      err.message || `An error occurred while ${mode === 'edit' ? 'updating' : 'creating'} the assessment`
    );
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
    if (!assessmentId) return;

    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/assessments?id=${assessmentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to delete assessment");
      }

      if (onDelete) {
        onDelete();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the assessment");
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    if (mode === "edit" && assessmentId) {
      fetchAssessment();
    } else {
      setFormData({
        title: "",
        description: "",
        courseId: "",
        moduleId: "",
        lessonId: "",
        assessmentLevel: "LESSON_QUIZ",
        duration: undefined,
        passingScore: 60,
        maxAttempts: undefined,
        timeLimit: undefined,
        isRequired: true,
        showCorrectAnswers: true,
        allowRetake: true,
        randomizeQuestions: false,
        createdBy: user?.id || "",
        facultyId: "",
      });
      setQuestions([
        {
          questionText: "",
          questionType: "MULTIPLE_CHOICE",
          options: ["", "", "", ""],
          correctAnswer: "",
          points: 1,
          difficulty: "MEDIUM",
          explanation: "",
        },
      ]);
    }
    setError(null);
    setSuccess(false);
  };

  if (loadingAssessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {mode === "edit" && assessmentId ? (
                <Link
                  href={`/dashboard/faculty/assessments`}
                  className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  onClick={onCancel}
                  className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {mode === "edit" ? "Edit Assessment" : "Create New Assessment"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {mode === "edit" 
                    ? "Update assessment details and questions" 
                    : "Design quizzes and assessments for your courses"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {mode === "create" && (
                <Button onClick={resetForm} variant="outline">
                  Reset
                </Button>
              )}
              
              {mode === "edit" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        the assessment and all its questions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Assessment"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 border border-emerald-200 bg-emerald-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-emerald-500 mr-2" />
              <span className="text-emerald-800 font-medium">
                Assessment {mode === "edit" ? "updated" : "created"} successfully!
                {!onSuccess && " Redirecting..."}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-emerald-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Title *
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter assessment title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe the purpose and content of this assessment"
                />
              </div>
            </div>
          </div>

          {/* Course Selection Card */}
          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-emerald-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Course & Level
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Assessment Level Dropdown */}
              <div>
                <Label>Assessment Level *</Label>
                <Select
                  value={formData.assessmentLevel}
                  onValueChange={(value: AssessmentLevel) => handleAssessmentLevelChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LESSON_QUIZ">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Lesson Quiz
                      </div>
                    </SelectItem>
                    <SelectItem value="MODULE_ASSESSMENT">
                      <div className="flex items-center">
                        <Layers className="h-4 w-4 mr-2" />
                        Module Assessment
                      </div>
                    </SelectItem>
                    <SelectItem value="COURSE_FINAL">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Course Final
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.assessmentLevel === "LESSON_QUIZ" && "For individual lessons - requires course, module, and lesson selection"}
                  {formData.assessmentLevel === "MODULE_ASSESSMENT" && "For course modules - requires course and module selection"}
                  {formData.assessmentLevel === "COURSE_FINAL" && "End of course exam - requires only course selection"}
                </p>
              </div>

              {/* Course Dropdown - Always shown */}
              <div>
                <Label>Select Course *</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={handleCourseChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData.courses ? (
                      <SelectItem disabled value="loading">
                        Loading courses...
                      </SelectItem>
                    ) : (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Module Dropdown - Only shown for LESSON_QUIZ and MODULE_ASSESSMENT */}
              {(formData.assessmentLevel === "LESSON_QUIZ" || formData.assessmentLevel === "MODULE_ASSESSMENT") && (
                <div>
                  <Label>Select Module *</Label>
                  <Select
                    value={formData.moduleId || ""}
                    onValueChange={handleModuleChange}
                    disabled={!formData.courseId || loadingData.modules}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="d">Select a module</SelectItem>
                      {loadingData.modules ? (
                        <SelectItem disabled value="loading">
                          Loading modules...
                        </SelectItem>
                      ) : modules.length === 0 ? (
                        <SelectItem disabled value="no-modules">
                          No modules available for this course
                        </SelectItem>
                      ) : (
                        modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Lesson Dropdown - Only shown for LESSON_QUIZ */}
              {formData.assessmentLevel === "LESSON_QUIZ" && (
                <div>
                  <Label>Select Lesson *</Label>
                  <Select
                    value={formData.lessonId || ""}
                    onValueChange={handleLessonChange}
                    disabled={!formData.moduleId || loadingData.lessons}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="d">Select a lesson</SelectItem>
                      {loadingData.lessons ? (
                        <SelectItem disabled value="loading">
                          Loading lessons...
                        </SelectItem>
                      ) : lessons.length === 0 ? (
                        <SelectItem disabled value="no-lessons">
                          No lessons available for this module
                        </SelectItem>
                      ) : (
                        lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Questions Card (keep this section the same) */}
          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-emerald-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Questions ({questions.length})
                  </h2>
                </div>
                <Button
                  type="button"
                  onClick={addQuestion}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">
                      Question {questionIndex + 1}
                    </h3>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(questionIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <Textarea
                      value={question.questionText}
                      onChange={(e) =>
                        updateQuestion(
                          questionIndex,
                          "questionText",
                          e.target.value
                        )
                      }
                      placeholder="Enter your question here..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type
                      </label>
                      <Select
                        value={question.questionType}
                        onValueChange={(
                          value:
                            | "MULTIPLE_CHOICE"
                            | "TRUE_FALSE"
                            | "SHORT_ANSWER"
                        ) =>
                          updateQuestion(questionIndex, "questionType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MULTIPLE_CHOICE">
                            Multiple Choice
                          </SelectItem>
                          <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                          <SelectItem value="SHORT_ANSWER">
                            Short Answer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points
                      </label>
                      <Input
                        type="number"
                        value={question.points || 1}
                        onChange={(e) =>
                          updateQuestion(
                            questionIndex,
                            "points",
                            Number(e.target.value)
                          )
                        }
                        min={1}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty
                      </label>
                      <Select
                        value={question.difficulty || "MEDIUM"}
                        onValueChange={(value: "EASY" | "MEDIUM" | "HARD") =>
                          updateQuestion(questionIndex, "difficulty", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {question.questionType === "MULTIPLE_CHOICE" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Options *
                        </label>
                        <Button
                          type="button"
                          onClick={() => addOption(questionIndex)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      {question.options?.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="flex items-center gap-2"
                        >
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(
                                questionIndex,
                                optionIndex,
                                e.target.value
                              )
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={question.correctAnswer === option}
                              onChange={() =>
                                updateQuestion(
                                  questionIndex,
                                  "correctAnswer",
                                  option
                                )
                              }
                              className="h-4 w-4 text-emerald-600"
                            />
                            <label className="text-sm text-gray-600">
                              Correct
                            </label>
                          </div>
                          {question.options && question.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeOption(questionIndex, optionIndex)
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.questionType === "TRUE_FALSE" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer *
                      </label>
                      <Select
                        value={question.correctAnswer}
                        onValueChange={(value) =>
                          updateQuestion(questionIndex, "correctAnswer", value)
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer *
                      </label>
                      <Input
                        value={question.correctAnswer}
                        onChange={(e) =>
                          updateQuestion(
                            questionIndex,
                            "correctAnswer",
                            e.target.value
                          )
                        }
                        placeholder="Enter the expected answer"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation (Optional)
                    </label>
                    <Textarea
                      value={question.explanation || ""}
                      onChange={(e) =>
                        updateQuestion(
                          questionIndex,
                          "explanation",
                          e.target.value
                        )
                      }
                      placeholder="Explain why this answer is correct..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No questions added yet</p>
                  <Button type="button" onClick={addQuestion} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Question
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Settings Card (keep this section the same) */}
          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-emerald-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Assessment Settings
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      Duration (minutes, optional)
                    </div>
                  </label>
                  <Input
                    type="number"
                    name="duration"
                    value={formData.duration || ""}
                    onChange={handleInputChange}
                    min="1"
                    max="480"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1 text-gray-400" />
                      Passing Score (%) *
                    </div>
                  </label>
                  <Input
                    type="number"
                    name="passingScore"
                    value={formData.passingScore}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Attempts (optional)
                  </label>
                  <Input
                    type="number"
                    name="maxAttempts"
                    value={formData.maxAttempts || ""}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (minutes, optional)
                  </label>
                  <Input
                    type="number"
                    name="timeLimit"
                    value={formData.timeLimit || ""}
                    onChange={handleInputChange}
                    min="1"
                    max="480"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Additional Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Required
                      </label>
                      <p className="text-xs text-gray-500">
                        Students must complete this assessment
                      </p>
                    </div>
                    <Switch
                      checked={formData.isRequired}
                      onCheckedChange={(checked) =>
                        handleSwitchChange("isRequired", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Show Correct Answers
                      </label>
                      <p className="text-xs text-gray-500">
                        Show answers after completion
                      </p>
                    </div>
                    <Switch
                      checked={formData.showCorrectAnswers}
                      onCheckedChange={(checked) =>
                        handleSwitchChange("showCorrectAnswers", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Allow Retake
                      </label>
                      <p className="text-xs text-gray-500">
                        Allow students to retake assessment
                      </p>
                    </div>
                    <Switch
                      checked={formData.allowRetake}
                      onCheckedChange={(checked) =>
                        handleSwitchChange("allowRetake", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Randomize Questions
                      </label>
                      <p className="text-xs text-gray-500">
                        Randomize question order
                      </p>
                    </div>
                    <Switch
                      checked={formData.randomizeQuestions}
                      onCheckedChange={(checked) =>
                        handleSwitchChange("randomizeQuestions", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              
              {mode === "create" && (
                <Button type="button" onClick={resetForm} variant="outline">
                  Reset
                </Button>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "edit" ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "edit" ? "Save Changes" : "Create Assessment"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}