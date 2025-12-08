// app/dashboard/faculty/assessments/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,

  Trash2,
  FileText,
  BookOpen,
 
  Clock,
  CheckCircle,
  XCircle,
  Users,
 
  Eye,
 
  RotateCcw,
  Hash,
  TrendingUp,
 
  Download,
 
  AlertCircle,
  
  Plus,
  User,
  Layers,
  Target,
  BarChart,
  FileQuestion,
  
  Percent,
  Award as AwardIcon,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/auth";

// Types
interface Assessment {
  id: string;
  title: string;
  description: string | null;
  assessmentLevel: "LESSON_QUIZ" | "MODULE_ASSESSMENT" | "COURSE_FINAL";
  courseId: string;
  courseTitle?: string;
  moduleTitle?: string | null;
  lessonTitle?: string | null;
  duration: number | null;
  passingScore: number;
  maxAttempts: number | null;
  timeLimit: number | null;
  isRequired: boolean;
  showCorrectAnswers: boolean;
  allowRetake: boolean;
  randomizeQuestions: boolean;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Question {
  id: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  points: number;
  negativePoints: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

interface Attempt {
  id: string;
  userId: string;
  userName?: string;
  attemptNumber: number;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  completedAt: string | null;
  timeSpent: number | null;
  answers: Answer[]; // Changed from any
}

interface AssessmentDetails {
  assessment: Assessment;
  questions: Question[];
  attempts?: Attempt[];
  questionCount: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
}

const AssessmentDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;
  const user = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentDetails | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "questions" | "attempts" | "analytics"
  >("overview");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 
  const [showPreview, setShowPreview] = useState(false);

  // Fetch assessment details
  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assessment with questions
      const assessmentResponse = await fetch(
        `/api/assessments?id=${assessmentId}&questions=true`
      );
      if (!assessmentResponse.ok) {
        throw new Error("Failed to fetch assessment details");
      }

      const assessmentData = await assessmentResponse.json();
      if (!assessmentData.success) {
        throw new Error(assessmentData.message || "Failed to load assessment");
      }

      // Fetch attempts (you might want to add this to your API)
      const attemptsResponse = await fetch(
        `/api/assessments?id=${assessmentId}&attempts=true`
      );
      let attempts: Attempt[] = [];
      const stats = {
        questionCount: assessmentData.data.questions?.length || 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      };

      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json();
        if (attemptsData.success) {
          attempts = attemptsData.data.attempts || [];

          // Calculate statistics
          // If attempts don't have status, infer from completedAt
          const completedAttempts = attempts.filter(
            (a: Attempt) => a.completedAt !== null // or a.status === 'COMPLETED' if status exists
          );
          stats.totalAttempts = completedAttempts.length;

          if (completedAttempts.length > 0) {
            const totalScore = completedAttempts.reduce(
              (sum: number, a: Attempt) => sum + a.percentage,
              0
            );
            stats.averageScore = Math.round(
              totalScore / completedAttempts.length
            );

            const passedCount = completedAttempts.filter(
              (a: Attempt) => a.passed
            ).length;
            stats.passRate = Math.round(
              (passedCount / completedAttempts.length) * 100
            );
          }
        }
      }

      setData({
        assessment: assessmentData.data,
        questions: assessmentData.data.questions || [],
        attempts,
        ...stats,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching assessment details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentDetails();
    }
  }, [assessmentId]);

  const handleDelete = async () => {
    if (!data) return;

    try {
      const response = await fetch(`/api/assessments?id=${assessmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/faculty/assessments");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete assessment");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete assessment"
      );
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handlePreviewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedQuestion(null);
  };

  const getAssessmentLevelIcon = (level: string) => {
    switch (level) {
      case "LESSON_QUIZ":
        return <FileText className="w-5 h-5" />;
      case "MODULE_ASSESSMENT":
        return <BookOpen className="w-5 h-5" />;
      case "COURSE_FINAL":
        return <AwardIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getAssessmentLevelColor = (level: string) => {
    switch (level) {
      case "LESSON_QUIZ":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "MODULE_ASSESSMENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COURSE_FINAL":
        return "bg-violet-100 text-violet-800 border-violet-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAssessmentLevelText = (level: string) => {
    return level.replace("_", " ").toLowerCase();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HARD":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "No limit";
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
  };


   // After the state declarations, before the fetchAssessmentDetails function:
if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/faculty/assessments"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessments
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment details...</p>
        </div>
      </div>
    </div>
  );
}
  if (!loading && error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href="/dashboard/faculty/assessments"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessments
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <div className="flex items-center text-red-600 mb-4">
              <AlertCircle className="w-6 h-6 mr-3" />
              <h2 className="text-xl font-semibold">
                Error Loading Assessment
              </h2>
            </div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchAssessmentDetails}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Assessment Not Found
            </h2>
            <p className="text-gray-500 mb-4">
              The assessment you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link
              href="/dashboard/faculty/assessments"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assessments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    assessment,
    questions,
    attempts = [],
    questionCount,
    totalAttempts,
    averageScore,
    passRate,
  } = data;


 
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <Link
                href="/dashboard/faculty/assessments"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {assessment.title}
                </h1>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${getAssessmentLevelColor(
                      assessment.assessmentLevel
                    )}`}
                  >
                    {getAssessmentLevelIcon(assessment.assessmentLevel)}
                    <span className="ml-1.5 capitalize">
                      {getAssessmentLevelText(assessment.assessmentLevel)}
                    </span>
                  </span>

                  {assessment.courseTitle && (
                    <span className="inline-flex items-center text-sm text-gray-600">
                      <Layers className="w-4 h-4 mr-1" />
                      {assessment.courseTitle}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "overview"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileQuestion className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("questions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "questions"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Hash className="w-4 h-4 inline mr-2" />
              Questions ({questionCount})
            </button>
            <button
              onClick={() => setActiveTab("attempts")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "attempts"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Attempts ({totalAttempts})
            </button>
            {/* <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'analytics'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <BarChart className="w-4 h-4 inline mr-2" />
              Analytics
            </button> */}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {activeTab === "overview" && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Assessment Details */}
                <div className="lg:col-span-2">
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Assessment Details
                    </h2>
                    {assessment.description && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Description
                        </h3>
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                          {assessment.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">
                          Settings
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Target className="w-4 h-4 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Passing Score
                              </p>
                              <p className="font-medium">
                                {assessment.passingScore}%
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Time Limit
                              </p>
                              <p className="font-medium">
                                {formatDuration(assessment.timeLimit)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <RotateCcw className="w-4 h-4 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Max Attempts
                              </p>
                              <p className="font-medium">
                                {assessment.maxAttempts || "Unlimited"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">
                          Features
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            {assessment.showCorrectAnswers ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400 mr-3" />
                            )}
                            <div>
                              <p className="text-sm text-gray-500">
                                Show Correct Answers
                              </p>
                              <p className="font-medium">
                                {assessment.showCorrectAnswers
                                  ? "Enabled"
                                  : "Disabled"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {assessment.allowRetake ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400 mr-3" />
                            )}
                            <div>
                              <p className="text-sm text-gray-500">
                                Allow Retake
                              </p>
                              <p className="font-medium">
                                {assessment.allowRetake
                                  ? "Allowed"
                                  : "Not Allowed"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {assessment.randomizeQuestions ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400 mr-3" />
                            )}
                            <div>
                              <p className="text-sm text-gray-500">
                                Randomize Questions
                              </p>
                              <p className="font-medium">
                                {assessment.randomizeQuestions
                                  ? "Enabled"
                                  : "Disabled"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Stats & Info */}
                <div>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Quick Stats
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FileQuestion className="w-5 h-5 text-emerald-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Questions</p>
                            <p className="text-lg font-semibold">
                              {questionCount}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">
                              Total Attempts
                            </p>
                            <p className="text-lg font-semibold">
                              {totalAttempts}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <Percent className="w-5 h-5 text-violet-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">
                              Average Score
                            </p>
                            <p className="text-lg font-semibold">
                              {averageScore}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Pass Rate</p>
                            <p className="text-lg font-semibold">{passRate}%</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 mb-3">
                        Created{" "}
                      </h4>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {assessment.createdBy === user?.id ? "You" : ""}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(assessment.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Questions ({questionCount})
                </h2>
                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/faculty/assessments/${assessmentId}/questions/new`
                    )
                  }
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12">
                  <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No questions yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Add questions to this assessment to get started.
                  </p>
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/faculty/assessments/${assessmentId}/questions/new`
                      )
                    }
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-gray-500 mr-3">
                              Q{index + 1}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                                question.difficulty
                              )}`}
                            >
                              {question.difficulty.toLowerCase()}
                            </span>
                            <span className="ml-3 text-sm text-gray-500">
                              {question.questionType
                                .replace("_", " ")
                                .toLowerCase()}
                            </span>
                            <span className="ml-3 text-sm font-medium">
                              {question.points} point
                              {question.points !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-gray-900 mb-3">
                            {question.questionText}
                          </p>
                          {question.options &&
                            question.questionType === "MULTIPLE_CHOICE" && (
                              <div className="space-y-2 ml-4">
                                {question.options.map(
                                  (option: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center"
                                    >
                                      <div
                                        className={`w-6 h-6 rounded-full border flex items-center justify-center mr-2 ${
                                          option === question.correctAnswer
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + idx)}
                                      </div>
                                      <span
                                        className={`${
                                          option === question.correctAnswer
                                            ? "font-medium text-emerald-700"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {option}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          {question.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-800 mb-1">
                                Explanation
                              </p>
                              <p className="text-sm text-blue-700">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handlePreviewQuestion(question)}
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                       
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "attempts" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Student Attempts ({totalAttempts})
                </h2>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>
              </div>

              {attempts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No attempts yet
                  </h3>
                  <p className="text-gray-500">
                    Students haven&apos;t taken this assessment yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attempt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Spent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {attempt.userName ||
                                    `Student ${attempt.userId.slice(0, 8)}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {attempt.userId.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              #{attempt.attemptNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span
                                className={`text-lg font-semibold ${
                                  attempt.passed
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {attempt.percentage}%
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                ({attempt.score}/{attempt.totalPoints})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                attempt.passed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {attempt.passed ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Passed
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {attempt.timeSpent
                              ? `${Math.floor(attempt.timeSpent / 60)}:${(
                                  attempt.timeSpent % 60
                                )
                                  .toString()
                                  .padStart(2, "0")}`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {attempt.completedAt
                              ? formatDate(attempt.completedAt)
                              : "In Progress"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-emerald-600 hover:text-emerald-900">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Assessment Analytics
              </h2>

              {totalAttempts === 0 ? (
                <div className="text-center py-12">
                  <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No data yet
                  </h3>
                  <p className="text-gray-500">
                    Analytics will appear after students take the assessment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Metrics */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Performance Overview
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            Average Score
                          </span>
                          <span className="text-sm font-bold text-emerald-600">
                            {averageScore}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-emerald-600 h-2.5 rounded-full"
                            style={{ width: `${averageScore}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            Pass Rate
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {passRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-600 h-2.5 rounded-full"
                            style={{ width: `${passRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                          <p className="text-2xl font-bold text-emerald-600">
                            {questionCount}
                          </p>
                          <p className="text-sm text-gray-500">
                            Total Questions
                          </p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                          <p className="text-2xl font-bold text-blue-600">
                            {totalAttempts}
                          </p>
                          <p className="text-sm text-gray-500">
                            Total Attempts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Distribution */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Score Distribution
                    </h3>
                    <div className="space-y-4">
                      {attempts
                        .filter((a) => a.status === "COMPLETED")
                        .map((attempt) => (
                          <div key={attempt.id} className="flex items-center">
                            <div className="w-32 text-sm text-gray-600 truncate">
                              {attempt.userName ||
                                `Student ${attempt.userId.slice(0, 8)}`}
                            </div>
                            <div className="flex-1 mx-4">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    attempt.passed
                                      ? "bg-green-600"
                                      : "bg-red-600"
                                  }`}
                                  style={{ width: `${attempt.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="w-16 text-right">
                              <span
                                className={`font-medium ${
                                  attempt.passed
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {attempt.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Question Preview Modal */}
      {showPreview && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Question Preview
                </h3>
                <button
                  onClick={closePreview}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium mr-3 ${getDifficultyColor(
                      selectedQuestion.difficulty
                    )}`}
                  >
                    {selectedQuestion.difficulty.toLowerCase()}
                  </span>
                  <span className="text-sm text-gray-500 mr-3">
                    {selectedQuestion.questionType
                      .replace("_", " ")
                      .toLowerCase()}
                  </span>
                  <span className="text-sm font-medium">
                    {selectedQuestion.points} point
                    {selectedQuestion.points !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-lg font-medium text-gray-900">
                    {selectedQuestion.questionText}
                  </p>
                </div>

                {selectedQuestion.options &&
                  selectedQuestion.questionType === "MULTIPLE_CHOICE" && (
                    <div className="space-y-3 ml-4">
                      {selectedQuestion.options.map(
                        (option: string, idx: number) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              option === selectedQuestion.correctAnswer
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 ${
                                  option === selectedQuestion.correctAnswer
                                    ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                                    : "border-gray-300 text-gray-700"
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span
                                className={`${
                                  option === selectedQuestion.correctAnswer
                                    ? "font-medium text-emerald-700"
                                    : "text-gray-700"
                                }`}
                              >
                                {option}
                              </span>
                              {option === selectedQuestion.correctAnswer && (
                                <span className="ml-auto text-emerald-600 text-sm font-medium">
                                  Correct Answer
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                {selectedQuestion.questionType === "TRUE_FALSE" && (
                  <div className="space-y-3 ml-4">
                    <div
                      className={`p-3 rounded-lg border ${
                        selectedQuestion.correctAnswer === "true"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 ${
                            selectedQuestion.correctAnswer === "true"
                              ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                              : "border-gray-300 text-gray-700"
                          }`}
                        >
                          A
                        </div>
                        <span
                          className={`${
                            selectedQuestion.correctAnswer === "true"
                              ? "font-medium text-emerald-700"
                              : "text-gray-700"
                          }`}
                        >
                          True
                        </span>
                        {selectedQuestion.correctAnswer === "true" && (
                          <span className="ml-auto text-emerald-600 text-sm font-medium">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`p-3 rounded-lg border ${
                        selectedQuestion.correctAnswer === "false"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 ${
                            selectedQuestion.correctAnswer === "false"
                              ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                              : "border-gray-300 text-gray-700"
                          }`}
                        >
                          B
                        </div>
                        <span
                          className={`${
                            selectedQuestion.correctAnswer === "false"
                              ? "font-medium text-emerald-700"
                              : "text-gray-700"
                          }`}
                        >
                          False
                        </span>
                        {selectedQuestion.correctAnswer === "false" && (
                          <span className="ml-auto text-emerald-600 text-sm font-medium">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedQuestion.questionType === "SHORT_ANSWER" && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm font-medium text-emerald-800 mb-2">
                      Expected Answer
                    </p>
                    <p className="text-emerald-700">
                      {selectedQuestion.correctAnswer}
                    </p>
                  </div>
                )}

                {selectedQuestion.explanation && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      Explanation
                    </p>
                    <p className="text-blue-700">
                      {selectedQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>

              
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Assessment
                </h3>
                <p className="text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-medium">{assessment.title}</p>
              {assessment.courseTitle && (
                <p className="text-red-600 text-sm mt-1">
                  Course: {assessment.courseTitle}
                </p>
              )}
              <p className="text-red-600 text-sm mt-1">
                {questionCount} questions • {totalAttempts} attempts
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
              >
                Delete Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentDetailPage;
