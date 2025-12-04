/*eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import AssessmentTimer from "@/components/user/courses/AssessmentTimer";
import {
  Assessment,
  AssessmentAttempt,
  formatTime,
  safeJson,
} from "@/components/user/courses/learn";
import { useCurrentUser } from "@/hooks/auth";
import {
  Award,
  CheckCircle,
  CheckSquare,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Target,
  XCircle,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AssessmentResults from "@/components/user/courses/AssessmentResults";

export default function AssessmentPage() {
  const { courseId, assessmentId } = useParams() as {
    courseId: string;
    assessmentId: string;
  };
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?.id ?? null;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Fetch assessment and attempt data
  useEffect(() => {
    let mounted = true;

    async function fetchAssessmentData() {
      if (!assessmentId || !attemptId) {
        setError("Invalid assessment attempt");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch assessment details
        const assessmentRes = await fetch(
          `/api/assessments?id=${encodeURIComponent(assessmentId)}`
        );
        if (!assessmentRes.ok) throw new Error("Failed to fetch assessment");

        const assessmentData = await safeJson(assessmentRes);
        if (!mounted) return;

        console.log("Assessment API Response:", assessmentData);

       // To this:
if (!assessmentData.data) {
  console.error("Invalid assessment data structure:", assessmentData);
  throw new Error("Invalid assessment data received from server");
}

        setAssessment(assessmentData.data);

        // Fetch attempt details
        const attemptRes = await fetch(
          `/api/assessment-attempts?id=${encodeURIComponent(attemptId)}`
        );
        if (!attemptRes.ok) throw new Error("Failed to fetch attempt");

        const attemptData = await safeJson(attemptRes);
        if (!mounted) return;

        console.log("Attempt API Response:", attemptData);

        setAttempt(attemptData.data);

        // Load saved answers if any
        if (attemptData.data?.answers) {
          setUserAnswers(attemptData.data.answers);
        }
      } catch (err) {
        console.error("fetchAssessmentData error", err);
        setError(
          err instanceof Error ? err.message : "Failed to load assessment"
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchAssessmentData();

    return () => {
      mounted = false;
    };
  }, [assessmentId, attemptId]);

  // Get assessment progress with safe checks
  const getAssessmentProgress = () => {
    if (!assessment || !assessment.questions || !Array.isArray(assessment.questions)) {
      return { answered: 0, total: 0, percentage: 0 };
    }

    const answered = Object.keys(userAnswers).filter(
      (key) =>
        userAnswers[key] !== undefined &&
        userAnswers[key] !== "" &&
        userAnswers[key] !== null
    ).length;

    const total = assessment.questions.length;

    return {
      answered,
      total,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  };

  // Submit assessment
  const submitAssessment = async () => {
    if (!assessment || !attempt || !userId) return;

    setIsSubmitting(true);
    try {
      // Calculate time spent
      const timeSpent = Math.floor(
        (Date.now() - new Date(attempt.startedAt).getTime()) / 1000
      );

      console.log("Submitting assessment with ID:", attempt.id);

      const res = await fetch(
        `/api/assessment-attempts?id=${attempt.id}&submit=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: userAnswers,
            status: "COMPLETED",
            completedAt: new Date().toISOString(),
            timeSpent: timeSpent,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API error response:", errorText);
        throw new Error(
          `Failed to submit assessment: ${res.status} ${res.statusText}`
        );
      }

      const responseData = await res.json();

      if (!responseData.success) {
        throw new Error(
          responseData.error?.message || "Failed to submit assessment"
        );
      }

      const backendResults = responseData.data?.results;
      const updatedAttempt = responseData.data?.attempt;

      if (!backendResults || !updatedAttempt) {
        throw new Error("Invalid response from server");
      }

      setAssessmentResults({
        score: backendResults.score,
        totalPoints: backendResults.totalPoints,
        percentage: backendResults.percentage,
        passed: backendResults.passed,
        passingScore:
          backendResults.passingScore || assessment.passingScore || 70,
        correctAnswers: backendResults.correctAnswers,
        totalQuestions: backendResults.totalQuestions,
        attemptId: attempt.id,
      });

      setAttempt(updatedAttempt);
      setShowResults(true);
    } catch (err) {
      console.error("Submit assessment error:", err);
      setError(
        "Failed to submit assessment: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Time up handler
  const handleTimeUp = () => {
    submitAssessment();
  };

  // Toggle timer pause
  const toggleTimerPause = () => {
    setIsTimerPaused(!isTimerPaused);
  };

  // Save and exit
  const saveAndExit = async () => {
    if (!attempt) return;

    try {
      await fetch(`/api/assessment-attempts?id=${attempt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: userAnswers,
          status: "IN_PROGRESS",
        }),
      });

      router.push(`/dashboard/user/courses/${courseId}/learn`);
    } catch (err) {
      console.error("Save and exit error:", err);
      setError("Failed to save progress");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <XCircle className="h-5 w-5" />
                <h3 className="font-semibold">Error</h3>
              </div>
              <p className="text-gray-700 mb-6">{error}</p>
              <Button
                onClick={() =>
                  router.push(`/dashboard/user/courses/${courseId}/learn`)
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Back to Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                  Assessment Not Found
                </h3>
                <p className="text-gray-600 mb-6">
                  The assessment you're looking for doesn't exist or you don't have access.
                </p>
                <Button
                  onClick={() =>
                    router.push(`/dashboard/user/courses/${courseId}/learn`)
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Back to Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = getAssessmentProgress();
  const questions = assessment.questions || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {showResults && assessmentResults ? (
          <AssessmentResults
            results={assessmentResults}
            assessment={assessment}
            userAnswers={userAnswers}
            onContinue={() => {
              setShowResults(false);
              router.push(`/dashboard/user/courses/${courseId}/learn`);
            }}
            onRetake={() => {
              router.push(`/dashboard/user/courses/${courseId}/learn`);
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Assessment Header */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {assessment.title || "Untitled Assessment"}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {assessment.description || "No description available."}
                    </p>
                  </div>
                  <Badge className="bg-emerald-600">
                    {assessment.assessmentLevel?.replace("_", " ") || "Assessment"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <div className="font-bold text-emerald-700">
                      {questions.length}
                    </div>
                    <div className="text-sm text-emerald-600">Questions</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-bold text-blue-700">
                      {assessment.passingScore || 70}%
                    </div>
                    <div className="text-sm text-blue-600">Passing Score</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="font-bold text-amber-700">
                      {progress.answered}/{progress.total}
                    </div>
                    <div className="text-sm text-amber-600">Answered</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-bold text-purple-700">
                      {assessment.timeLimit
                        ? `${assessment.timeLimit} min`
                        : "No Limit"}
                    </div>
                    <div className="text-sm text-purple-600">Time Limit</div>
                  </div>
                </div>

                {assessment.timeLimit && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <AssessmentTimer
                        timeLimit={assessment.timeLimit}
                        onTimeUp={handleTimeUp}
                        isPaused={isTimerPaused}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTimerPause}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        {isTimerPaused ? (
                          <Eye className="h-4 w-4 mr-2" />
                        ) : (
                          <EyeOff className="h-4 w-4 mr-2" />
                        )}
                        {isTimerPaused ? "Resume Timer" : "Pause Timer"}
                      </Button>
                    </div>
                    <Progress
                      value={progress.percentage}
                      className="h-2 bg-gray-200"
                    />
                    <div className="text-sm text-gray-500 text-center">
                      Progress: {progress.answered}/{progress.total} questions (
                      {progress.percentage}%)
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Questions */}
            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question: any, index: number) => {
                  const userAnswer = userAnswers[question.id];
                  const isAnswered =
                    userAnswer !== undefined &&
                    userAnswer !== "" &&
                    userAnswer !== null;

                  return (
                    <Card
                      key={question.id || index}
                      className={`border ${
                        isAnswered ? "border-emerald-200" : "border-gray-200"
                      } bg-white`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                                isAnswered
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {question.questionType?.replace("_", " ") || "Question"}
                                </span>
                                <Badge
                                  className={
                                    question.difficulty === "HARD"
                                      ? "bg-red-100 text-red-800"
                                      : question.difficulty === "MEDIUM"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-blue-100 text-blue-800"
                                  }
                                >
                                  {question.difficulty || "EASY"}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {question.points || 1} point(s)
                                {question.negativePoints > 0 &&
                                  ` • -${question.negativePoints} if wrong`}
                              </div>
                            </div>
                          </div>
                          {isAnswered && (
                            <Badge className="bg-emerald-100 text-emerald-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Answered
                            </Badge>
                          )}
                        </div>

                        <p className="text-lg font-medium mb-4 text-gray-900">
                          {question.questionText || "Question text not available"}
                        </p>

                        {/* Question Options */}
                        {question.questionType === "MULTIPLE_CHOICE" &&
                          question.options && (
                            <RadioGroup
                              value={userAnswer || ""}
                              onValueChange={(value) =>
                                setUserAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: value,
                                }))
                              }
                              className="space-y-2"
                            >
                              {question.options.map(
                                (option: any, optIndex: number) => (
                                  <div
                                    key={optIndex}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                                      userAnswer === option
                                        ? "bg-emerald-50 border-emerald-300"
                                        : "hover:bg-gray-50 border-gray-200"
                                    }`}
                                  >
                                    <RadioGroupItem
                                      value={option}
                                      id={`${question.id}-${optIndex}`}
                                    />
                                    <Label
                                      htmlFor={`${question.id}-${optIndex}`}
                                      className="flex-1 cursor-pointer text-gray-900"
                                    >
                                      {option}
                                    </Label>
                                  </div>
                                )
                              )}
                            </RadioGroup>
                          )}

                        {question.questionType === "TRUE_FALSE" && (
                          <RadioGroup
                            value={userAnswer || ""}
                            onValueChange={(value) =>
                              setUserAnswers((prev) => ({
                                ...prev,
                                [question.id]: value.toLowerCase(),
                              }))
                            }
                            className="space-y-2"
                          >
                            {["True", "False"].map((option) => (
                              <div
                                key={option}
                                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                                  userAnswer === option.toLowerCase()
                                    ? "bg-emerald-50 border-emerald-300"
                                    : "hover:bg-gray-50 border-gray-200"
                                }`}
                              >
                                <RadioGroupItem
                                  value={option}
                                  id={`${question.id}-${option}`}
                                />
                                <Label
                                  htmlFor={`${question.id}-${option}`}
                                  className="flex-1 cursor-pointer text-gray-900"
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}

                        {question.questionType === "SHORT_ANSWER" && (
                          <div className="space-y-2">
                            <Input
                              value={userAnswer || ""}
                              onChange={(e) =>
                                setUserAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: e.target.value,
                                }))
                              }
                              placeholder="Type your answer here..."
                              className="h-12 border-gray-300 focus:border-emerald-500"
                            />
                            <p className="text-sm text-gray-500">
                              Answers are case-insensitive
                            </p>
                          </div>
                        )}

                        {question.questionType === "ESSAY" && (
                          <div className="space-y-2">
                            <Textarea
                              value={userAnswer || ""}
                              onChange={(e) =>
                                setUserAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: e.target.value,
                                }))
                              }
                              placeholder="Type your essay answer here..."
                              className="min-h-[150px] border-gray-300 focus:border-emerald-500"
                            />
                            <p className="text-sm text-gray-500">
                              Essay questions will be reviewed manually
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">
                      No Questions Available
                    </h3>
                    <p className="text-gray-600 mb-6">
                      This assessment doesn't have any questions yet.
                    </p>
                    <Button
                      onClick={() =>
                        router.push(`/dashboard/user/courses/${courseId}/learn`)
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Back to Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button - Only show if there are questions */}
            {questions.length > 0 && (
              <div className="sticky bottom-4">
                <Card className="border-gray-200 bg-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {progress.answered} of {progress.total} questions answered
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={saveAndExit}
                          variant="outline"
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          Save & Exit
                        </Button>
                        <Button
                          onClick={submitAssessment}
                          disabled={progress.answered < progress.total}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                          size="lg"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckSquare className="mr-2 h-5 w-5" />
                              Submit Assessment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}