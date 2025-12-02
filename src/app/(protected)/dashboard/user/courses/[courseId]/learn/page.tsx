/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlayCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Video,
  FileText,
  AlertCircle,
  HelpCircle,
  Target,
  Award,
  CheckSquare,
  XCircle,
  BarChart3,
  ListChecks,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// --- Types ---
type ContentType = 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSESSMENT';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: ContentType;
  videoUrl?: string | null;
  articleContent?: string | null;
  videoDuration?: number | null; // seconds
  sortOrder: number;
  isFree?: boolean;
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  assessmentLevel: 'LESSON_QUIZ' | 'MODULE_ASSESSMENT' | 'COURSE_FINAL';
  duration?: number | null;
  passingScore: number;
  maxAttempts?: number | null;
  timeLimit?: number | null;
  isRequired: boolean;
  showCorrectAnswers: boolean;
  allowRetake: boolean;
  randomizeQuestions: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  questions: AssessmentQuestion[];
}

interface AssessmentQuestion {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options?: any[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  negativePoints: number;
  sortOrder: number;
}

interface CurriculumModule {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  lessons: Lesson[];
  moduleAssessment?: Assessment;
}

interface Curriculum {
  modules: CurriculumModule[];
  courseTitle?: string;
  finalAssessment?: Assessment;
}

interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  isCompleted: boolean;
  completedAt: string | null;
  lastWatchedPosition: number; // seconds
  watchDuration: number; // seconds
}

interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  enrollmentId: string;
  score: number;
  percentage: number;
  passed: boolean;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
  answers: Record<string, any>;
}

interface ProgressResponse {
  progressPercentage: number;
  lessonsProgress: LessonProgress[];
}

// --- Helper utilities ---
const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
};

// Format video URL to ensure it's valid
const formatVideoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  let cleanUrl = url.trim();
  
  if (cleanUrl.toLowerCase() === 'youtube .com') {
    return 'https://youtube.com';
  }
  
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  
  return cleanUrl;
};

// Assessment timer component
const AssessmentTimer = ({ timeLimit, onTimeUp }: { timeLimit: number; onTimeUp: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // Convert minutes to seconds

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / (timeLimit * 60)) * 100;
  const isWarning = timeLeft < 300; // Less than 5 minutes

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${isWarning ? 'text-amber-500' : 'text-emerald-600'}`} />
          <span className={`font-medium ${isWarning ? 'text-amber-600' : 'text-emerald-700'}`}>
            Time Remaining: {formatTime(timeLeft)}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {Math.floor(timeLeft / 60)} min {timeLeft % 60} sec
        </span>
      </div>
      <Progress 
        value={progressPercentage} 
        className={`h-2 ${isWarning ? 'bg-amber-100' : 'bg-emerald-100'}`}
      />
    </div>
  );
};

// --- Component ---
export default function CourseLearnPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?.id ?? null;

  // Data states
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [assessmentAttempt, setAssessmentAttempt] = useState<AssessmentAttempt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(false);
  const [isAssessmentLoading, setIsAssessmentLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [playerPosition, setPlayerPosition] = useState<number>(0);
  
  // Assessment state
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [assessmentResults, setAssessmentResults] = useState<{
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    passingScore: number;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);

  // refs for debounced progress updates
  const progressTimeoutRef = useRef<number | null>(null);
  const latestPositionRef = useRef<number>(0);

  // Fetch curriculum once courseId changes
  useEffect(() => {
    let mounted = true;

    async function fetchCurriculum() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/courses?id=${encodeURIComponent(courseId)}&curriculum=true`);
        if (!res.ok) throw new Error('Failed to fetch curriculum');
        const json = await safeJson(res);
        if (!mounted) return;
        
        const modules = json?.data?.modules || [];
        if (modules.length === 0) {
          throw new Error('No curriculum found for this course');
        }
        
        setCurriculum({
          modules,
          courseTitle: json?.data?.courseTitle || 'Untitled Course',
          finalAssessment: json?.data?.finalAssessment || null
        });

        const firstLesson = modules?.[0]?.lessons?.[0];
        if (firstLesson) {
          setSelectedLessonId(firstLesson.id);
          setSelectedModuleId(modules[0].id);
        }
      } catch (err) {
        console.error('fetchCurriculum error', err);
        setError(err instanceof Error ? err.message : 'Failed to load course content');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (courseId) fetchCurriculum();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  // Fetch progress when userId or courseId change
  useEffect(() => {
    let mounted = true;
    if (!userId) return;

    async function fetchProgress() {
      setIsProgressLoading(true);
      try {
        const res = await fetch(`/api/progress?userId=${encodeURIComponent(userId ?? "")}&courseId=${encodeURIComponent(courseId ?? "")}`);
        if (!res.ok) throw new Error('Failed to fetch progress');
        const json = await safeJson(res);
        if (!mounted) return;
        setProgress(json?.data ?? null);

        if (selectedLessonId) {
          const lp = json?.data?.lessonsProgress?.find((x: LessonProgress) => x.lessonId === selectedLessonId);
          if (lp) {
            setPlayerPosition(lp.lastWatchedPosition ?? 0);
          }
        }
      } catch (err) {
        console.error('fetchProgress error', err);
      } finally {
        if (mounted) setIsProgressLoading(false);
      }
    }

    fetchProgress();

    return () => {
      mounted = false;
    };
  }, [userId, courseId, selectedLessonId]);

  // Derived data helpers
  const allLessons = curriculum?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === selectedLessonId);
  const nextLesson = currentIndex >= 0 ? allLessons[currentIndex + 1] ?? null : null;
  const prevLesson = currentIndex >= 0 ? allLessons[currentIndex - 1] ?? null : null;

  const getLessonProgress = (lessonId: string): LessonProgress | undefined =>
    progress?.lessonsProgress?.find((lp) => lp.lessonId === lessonId);

  // Check if lesson has assessment
  const lessonHasAssessment = (lessonId: string): boolean => {
    const module = curriculum?.modules.find(m => 
      m.lessons.some(l => l.id === lessonId)
    );
    if (!module) return false;
    
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (lesson?.contentType === 'QUIZ') return true;
    
    // Check if lesson has a quiz in module assessment
    return module.moduleAssessment?.assessmentLevel === 'LESSON_QUIZ';
  };

  // Start assessment
  const startAssessment = async (assessmentId: string) => {
    if (!userId) return;
    
    setIsAssessmentLoading(true);
    try {
      // Start new attempt
      const res = await fetch('/api/assessment-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          userId,
          enrollmentId: progress?.enrollmentId || '',
          status: 'IN_PROGRESS'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAssessmentAttempt(data.data);
        
        // Fetch assessment details
        const assessmentRes = await fetch(`/api/assessments?id=${assessmentId}`);
        if (assessmentRes.ok) {
          const assessmentData = await assessmentRes.json();
          setCurrentAssessment(assessmentData.data);
          setUserAnswers({});
          setAssessmentResults(null);
          setShowResults(false);
        }
      }
    } catch (err) {
      console.error('Start assessment error:', err);
      setError('Failed to start assessment');
    } finally {
      setIsAssessmentLoading(false);
    }
  };

  // Submit assessment
  const submitAssessment = async () => {
    if (!currentAssessment || !assessmentAttempt || !userId) return;
    
    try {
      // Calculate score
      let score = 0;
      let correctAnswers = 0;
      
      currentAssessment.questions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer !== undefined && userAnswer !== null) {
          if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
            if (userAnswer === question.correctAnswer) {
              score += question.points;
              correctAnswers++;
            } else if (question.negativePoints) {
              score -= question.negativePoints;
            }
          } else if (question.questionType === 'SHORT_ANSWER') {
            if (userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
              score += question.points;
              correctAnswers++;
            }
          }
        }
      });

      const totalPoints = currentAssessment.questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      const passed = percentage >= currentAssessment.passingScore;

      // Update attempt
      const res = await fetch(`/api/assessment-attempts?id=${assessmentAttempt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          percentage,
          passed,
          status: 'COMPLETED',
          timeSpent: Math.floor((new Date().getTime() - new Date(assessmentAttempt.startedAt).getTime()) / 1000),
          answers: userAnswers
        })
      });

      if (res.ok) {
        setAssessmentResults({
          score,
          totalPoints,
          percentage,
          passed,
          passingScore: currentAssessment.passingScore,
          correctAnswers,
          totalQuestions: currentAssessment.questions.length
        });
        setShowResults(true);
        
        // If assessment is passed, mark lesson as complete
        if (passed && selectedLessonId) {
          await markLessonComplete(selectedLessonId);
        }
      }
    } catch (err) {
      console.error('Submit assessment error:', err);
      setError('Failed to submit assessment');
    }
  };

  // Time up handler
  const handleTimeUp = () => {
    submitAssessment();
  };

  // Handlers
  const handleLessonSelect = (lessonId: string, moduleId: string) => {
    setSelectedLessonId(lessonId);
    setSelectedModuleId(moduleId);
    setPlayerPosition(0);
    setCurrentAssessment(null);
    setAssessmentAttempt(null);
    setUserAnswers({});
    setAssessmentResults(null);
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function markLessonComplete(lessonId: string) {
    if (!userId) return;
    try {
      await fetch(`/api/progress?userId=${encodeURIComponent(userId)}&lessonId=${encodeURIComponent(lessonId)}&complete=true`, {
        method: 'POST',
      });

      const res = await fetch(`/api/progress?userId=${encodeURIComponent(userId)}&courseId=${encodeURIComponent(courseId)}`);
      const json = await safeJson(res);
      setProgress(json?.data ?? null);
    } catch (err) {
      console.error('markLessonComplete error', err);
    }
  }

  async function sendProgressUpdate(lessonId: string, position: number) {
    if (!userId) return;
    try {
      await fetch(`/api/progress?userId=${encodeURIComponent(userId)}&lessonId=${encodeURIComponent(lessonId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastWatchedPosition: Math.floor(position) }),
      });
    } catch (err) {
      console.error('sendProgressUpdate error', err);
    }
  }

  const handleProgressUpdate = (positionSec: number) => {
    latestPositionRef.current = positionSec;

    if (progressTimeoutRef.current) {
      window.clearTimeout(progressTimeoutRef.current);
    }

    progressTimeoutRef.current = window.setTimeout(() => {
      if (selectedLessonId) {
        sendProgressUpdate(selectedLessonId, latestPositionRef.current);
      }
      progressTimeoutRef.current = null;
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (progressTimeoutRef.current && selectedLessonId) {
        sendProgressUpdate(selectedLessonId, latestPositionRef.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLesson: Lesson | undefined = allLessons.find((l) => l.id === selectedLessonId);
  const formattedVideoUrl = selectedLesson?.videoUrl ? formatVideoUrl(selectedLesson.videoUrl) : null;

  // UI: Error state
  if (error) {
    return (
      <div className="space-y-6 min-h-screen p-6">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Back to Course
        </Button>
      </div>
    );
  }

  // UI: loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 min-h-screen p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px] md:col-span-2" />
        </div>
      </div>
    );
  }

  // UI: No curriculum
  if (!curriculum || curriculum.modules.length === 0) {
    return (
      <div className="text-center py-12 min-h-screen">
        <BookOpen className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-emerald-900">No content available</h3>
        <p className="text-emerald-700 mb-6">This course doesn&apos;t have any lessons yet.</p>
        <Button 
          onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Back to Course
        </Button>
      </div>
    );
  }

  // Assessment Results Component
  const AssessmentResults = () => {
    if (!assessmentResults) return null;

    return (
      <div className="space-y-6">
        <div className={`p-6 rounded-lg ${
          assessmentResults.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        } border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {assessmentResults.passed ? (
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {assessmentResults.passed ? 'Assessment Passed!' : 'Assessment Failed'}
                </h3>
                <p className="text-sm text-gray-600">
                  {assessmentResults.passed 
                    ? 'Congratulations! You have successfully passed the assessment.'
                    : `You need ${assessmentResults.passingScore}% to pass. Try again!`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {assessmentResults.percentage}%
              </div>
              <div className="text-sm text-gray-600">
                Passing Score: {assessmentResults.passingScore}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-emerald-700">{assessmentResults.score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-700">{assessmentResults.correctAnswers}/{assessmentResults.totalQuestions}</div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-purple-700">{assessmentResults.totalPoints}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
          </div>
        </div>

        {currentAssessment?.showCorrectAnswers && (
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Review Answers</h4>
            {currentAssessment.questions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className={`p-4 rounded border ${
                  isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Question {index + 1}</span>
                        <Badge variant={question.difficulty === 'HARD' ? 'destructive' : 
                                       question.difficulty === 'MEDIUM' ? 'default' : 'secondary'}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant={isCorrect ? 'default' : 'destructive'}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>
                      <p className="font-semibold mb-2">{question.questionText}</p>
                      
                      {question.questionType === 'MULTIPLE_CHOICE' && question.options && (
                        <div className="space-y-2 ml-4">
                          {question.options.map((option: any, optIndex: number) => (
                            <div key={optIndex} className={`p-2 rounded ${
                              option === question.correctAnswer 
                                ? 'bg-emerald-100 border-emerald-300 border' 
                                : option === userAnswer && !isCorrect
                                ? 'bg-red-100 border-red-300 border'
                                : ''
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded-full border ${
                                  option === question.correctAnswer 
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : option === userAnswer && !isCorrect
                                    ? 'bg-red-500 border-red-500'
                                    : 'border-gray-300'
                                }`} />
                                <span>{option}</span>
                                {option === question.correctAnswer && (
                                  <Badge className="ml-2 bg-emerald-500">Correct Answer</Badge>
                                )}
                                {option === userAnswer && !isCorrect && (
                                  <Badge className="ml-2 bg-red-500">Your Answer</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.questionType === 'TRUE_FALSE' && (
                        <div className="space-y-2 ml-4">
                          <div className={`p-2 rounded ${
                            'True' === question.correctAnswer 
                              ? 'bg-emerald-100 border-emerald-300 border' 
                              : 'True' === userAnswer && !isCorrect
                              ? 'bg-red-100 border-red-300 border'
                              : ''
                          }`}>
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 rounded-full border ${
                                'True' === question.correctAnswer 
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'True' === userAnswer && !isCorrect
                                  ? 'bg-red-500 border-red-500'
                                  : 'border-gray-300'
                              }`} />
                              <span>True</span>
                              {'True' === question.correctAnswer && (
                                <Badge className="ml-2 bg-emerald-500">Correct Answer</Badge>
                              )}
                              {'True' === userAnswer && !isCorrect && (
                                <Badge className="ml-2 bg-red-500">Your Answer</Badge>
                              )}
                            </div>
                          </div>
                          <div className={`p-2 rounded ${
                            'False' === question.correctAnswer 
                              ? 'bg-emerald-100 border-emerald-300 border' 
                              : 'False' === userAnswer && !isCorrect
                              ? 'bg-red-100 border-red-300 border'
                              : ''
                          }`}>
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 rounded-full border ${
                                'False' === question.correctAnswer 
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'False' === userAnswer && !isCorrect
                                  ? 'bg-red-500 border-red-500'
                                  : 'border-gray-300'
                              }`} />
                              <span>False</span>
                              {'False' === question.correctAnswer && (
                                <Badge className="ml-2 bg-emerald-500">Correct Answer</Badge>
                              )}
                              {'False' === userAnswer && !isCorrect && (
                                <Badge className="ml-2 bg-red-500">Your Answer</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {question.questionType === 'SHORT_ANSWER' && (
                        <div className="space-y-2 ml-4">
                          <div className="p-2 rounded bg-emerald-100 border-emerald-300 border">
                            <div className="font-medium text-emerald-700">Correct Answer:</div>
                            <div>{question.correctAnswer}</div>
                          </div>
                          {userAnswer && (
                            <div className="p-2 rounded bg-blue-100 border-blue-300 border">
                              <div className="font-medium text-blue-700">Your Answer:</div>
                              <div>{userAnswer}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="font-medium text-blue-700 mb-1">Explanation:</div>
                          <div className="text-sm">{question.explanation}</div>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold">{question.points} pts</div>
                      <div className="text-sm text-gray-600">Points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {currentAssessment?.allowRetake && !assessmentResults.passed && (
            <Button
              onClick={() => {
                setShowResults(false);
                setUserAnswers({});
                setAssessmentResults(null);
              }}
              variant="outline"
              className="flex-1"
            >
              Retake Assessment
            </Button>
          )}
          <Button
            onClick={() => {
              setCurrentAssessment(null);
              setAssessmentAttempt(null);
              setUserAnswers({});
              setAssessmentResults(null);
              setShowResults(false);
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Continue Learning
          </Button>
        </div>
      </div>
    );
  };

  // Assessment Component
  const AssessmentComponent = () => {
    if (!currentAssessment || !assessmentAttempt) return null;

    return (
      <div className="space-y-6">
        {/* Assessment Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-emerald-900">{currentAssessment.title}</h2>
              <p className="text-emerald-700 mt-1">{currentAssessment.description}</p>
            </div>
            <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50">
              {currentAssessment.assessmentLevel.replace('_', ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded">
              <div className="font-bold text-emerald-700">{currentAssessment.questions.length}</div>
              <div className="text-sm text-emerald-600">Questions</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="font-bold text-blue-700">{currentAssessment.passingScore}%</div>
              <div className="text-sm text-blue-600">Passing Score</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded">
              <div className="font-bold text-amber-700">
                {currentAssessment.maxAttempts || 'Unlimited'}
              </div>
              <div className="text-sm text-amber-600">Max Attempts</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="font-bold text-purple-700">
                {currentAssessment.timeLimit ? `${currentAssessment.timeLimit} min` : 'No Limit'}
              </div>
              <div className="text-sm text-purple-600">Time Limit</div>
            </div>
          </div>

          {currentAssessment.timeLimit && (
            <AssessmentTimer 
              timeLimit={currentAssessment.timeLimit} 
              onTimeUp={handleTimeUp}
            />
          )}
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentAssessment.questions.map((question, index) => (
            <div key={question.id} className="p-6 border rounded-lg bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {question.questionType.replace('_', ' ')}
                      </span>
                      <Badge variant={
                        question.difficulty === 'HARD' ? 'destructive' :
                        question.difficulty === 'MEDIUM' ? 'default' : 'secondary'
                      }>
                        {question.difficulty}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Points: {question.points} | Negative: {question.negativePoints}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-lg font-medium mb-4">{question.questionText}</p>

              {/* Question Options */}
              {question.questionType === 'MULTIPLE_CHOICE' && question.options && (
                <RadioGroup
                  value={userAnswers[question.id] || ''}
                  onValueChange={(value) => setUserAnswers(prev => ({
                    ...prev,
                    [question.id]: value
                  }))}
                  className="space-y-3"
                >
                  {question.options.map((option: any, optIndex: number) => (
                    <div key={optIndex} className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded border">
                      <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                      <Label htmlFor={`${question.id}-${optIndex}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.questionType === 'TRUE_FALSE' && (
                <RadioGroup
                  value={userAnswers[question.id] || ''}
                  onValueChange={(value) => setUserAnswers(prev => ({
                    ...prev,
                    [question.id]: value
                  }))}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded border">
                    <RadioGroupItem value="True" id={`${question.id}-true`} />
                    <Label htmlFor={`${question.id}-true`} className="flex-1 cursor-pointer">
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 rounded border">
                    <RadioGroupItem value="False" id={`${question.id}-false`} />
                    <Label htmlFor={`${question.id}-false`} className="flex-1 cursor-pointer">
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {question.questionType === 'SHORT_ANSWER' && (
                <div className="space-y-2">
                  <Textarea
                    value={userAnswers[question.id] || ''}
                    onChange={(e) => setUserAnswers(prev => ({
                      ...prev,
                      [question.id]: e.target.value
                    }))}
                    placeholder="Type your answer here..."
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-gray-500">
                    Note: Answers are case-insensitive
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-6 bg-white p-4 border rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(userAnswers).length} of {currentAssessment.questions.length} questions answered
            </div>
            <Button
              onClick={submitAssessment}
              disabled={Object.keys(userAnswers).length < currentAssessment.questions.length}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              size="lg"
            >
              <CheckSquare className="mr-2 h-5 w-5" />
              Submit Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Lesson Content Component
  const LessonContent = ({ lesson }: { lesson: Lesson }) => {
    const module = curriculum?.modules.find(m => 
      m.lessons.some(l => l.id === lesson.id)
    );
    const lessonProgress = getLessonProgress(lesson.id);
    
    // Check if lesson has quiz/assessment
    const hasQuiz = lesson.contentType === 'QUIZ' || 
                   (module?.moduleAssessment?.assessmentLevel === 'LESSON_QUIZ' && 
                    module.lessons.some(l => l.id === lesson.id));

    return (
      <div className="space-y-6 p-6">
        {/* Lesson Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-emerald-900">{lesson.title}</h2>
            <div className="flex items-center gap-2">
              {hasQuiz && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Find and start the assessment
                    if (module?.moduleAssessment) {
                      startAssessment(module.moduleAssessment.id);
                    }
                  }}
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Take Quiz
                </Button>
              )}
              <Button
                variant={lessonProgress?.isCompleted ? 'secondary' : 'outline'}
                onClick={() => markLessonComplete(lesson.id)}
                disabled={lessonProgress?.isCompleted}
                size="sm"
                className={
                  lessonProgress?.isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900'
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {lessonProgress?.isCompleted ? 'Completed' : 'Mark Complete'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-emerald-700">
            <div className="flex items-center gap-1">
              {lesson.contentType === 'VIDEO' && <Video className="h-4 w-4" />}
              {lesson.contentType === 'ARTICLE' && <FileText className="h-4 w-4" />}
              {lesson.contentType === 'QUIZ' && <Target className="h-4 w-4" />}
              <span className="capitalize">{lesson.contentType.toLowerCase()}</span>
            </div>
            {lesson.videoDuration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(lesson.videoDuration / 60)} min</span>
              </div>
            )}
            {hasQuiz && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                <Target className="mr-1 h-3 w-3" />
                Has Quiz
              </Badge>
            )}
          </div>
          
          {lesson.description && lesson.contentType !== 'ARTICLE' && (
            <p className="text-emerald-700 mt-2">{lesson.description}</p>
          )}
        </div>

        <Separator className="bg-emerald-200" />

        {/* Lesson Content */}
        {lesson.contentType === 'VIDEO' ? (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {formattedVideoUrl ? (
                <ReactPlayer
                  url={formattedVideoUrl}
                  width="100%"
                  height="100%"
                  controls
                  playing={false}
                  onProgress={({ playedSeconds }: { playedSeconds: number }) => {
                    setPlayerPosition(playedSeconds);
                    handleProgressUpdate(playedSeconds);
                  }}
                  onEnded={() => {
                    markLessonComplete(lesson.id);
                  }}
                  onError={(e: any) => {
                    console.error('ReactPlayer error:', e);
                  }}
                  progressInterval={1000}
                  config={{
                    youtube: {
                      playerVars: {
                        modestbranding: 1,
                        rel: 0,
                        origin: window.location.origin,
                      },
                      embedOptions: {
                        host: 'https://www.youtube-nocookie.com'
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Video URL not available</p>
                  </div>
                </div>
              )}
            </div>
            {formattedVideoUrl && (
              <div className="text-xs text-emerald-700">
                <p>Video URL: {formattedVideoUrl}</p>
                <p className="mt-1">If the video doesn&apos;t load, try opening it directly: 
                  <a 
                    href={formattedVideoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline ml-1"
                  >
                    Open in YouTube
                  </a>
                </p>
              </div>
            )}
            {!formattedVideoUrl && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Video URL is missing or invalid. Please contact support.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : lesson.contentType === 'ARTICLE' ? (
          <div className="space-y-4">
            <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none prose-emerald">
              {(lesson.articleContent || lesson.description) ? (
                <div className="p-6 bg-emerald-50 rounded-lg">
                  {lesson.articleContent ? (
                    <div dangerouslySetInnerHTML={{ __html: lesson.articleContent }} />
                  ) : (
                    <div className="whitespace-pre-line text-base leading-relaxed text-emerald-900">
                      {lesson.description}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                  <p className="text-emerald-700">Article content not available</p>
                </div>
              )}
            </div>
          </div>
        ) : lesson.contentType === 'QUIZ' ? (
          <div className="space-y-4">
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-8 w-8 text-amber-600" />
                <div>
                  <h3 className="font-bold text-lg text-amber-900">Lesson Quiz</h3>
                  <p className="text-amber-700">
                    Test your understanding of this lesson by taking the quiz.
                  </p>
                </div>
              </div>
              
              {module?.moduleAssessment ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded border">
                      <div className="font-bold text-amber-700">{module.moduleAssessment.questions?.length || 0}</div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <div className="font-bold text-amber-700">{module.moduleAssessment.passingScore}%</div>
                      <div className="text-sm text-gray-600">Passing Score</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => startAssessment(module.moduleAssessment!.id)}
                    disabled={isAssessmentLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isAssessmentLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        Loading Quiz...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-5 w-5" />
                        Start Quiz
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Quiz is not available yet. Please check back later.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        ) : null}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-emerald-200">
          <Button
            variant="outline"
            disabled={!prevLesson}
            onClick={() =>
              prevLesson && handleLessonSelect(
                prevLesson.id, 
                curriculum.modules.find((m) => m.lessons.some((l) => l.id === prevLesson.id))!.id
              )
            }
            className="bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900 disabled:opacity-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {selectedModuleId && (
              <Button 
                variant="outline" 
                onClick={() => router.push(`/dashboard/user/courses/${courseId}/modules/${selectedModuleId}`)}
                className="bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900"
              >
                Module Overview
              </Button>
            )}
          </div>

          <Button
            disabled={!nextLesson}
            onClick={() =>
              nextLesson && handleLessonSelect(
                nextLesson.id, 
                curriculum.modules.find((m) => m.lessons.some((l) => l.id === nextLesson.id))!.id
              )
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Learning Interface</h1>
          <p className="text-emerald-700 mt-2">
            {curriculum.courseTitle} • Progress: {progress?.progressPercentage ?? 0}%
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
          className="bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900"
        >
          Back to Course
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-emerald-900">
          <span>Overall Progress</span>
          <span>{progress?.progressPercentage ?? 0}%</span>
        </div>
        <Progress value={progress?.progressPercentage ?? 0} className="h-2" />
      </div>

      {/* Assessment Results Modal */}
      {showResults && assessmentResults && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AssessmentResults />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Sidebar - Curriculum */}
        <Card className="md:col-span-1 bg-white border-emerald-200">
          <CardContent className="p-0">
            <Tabs defaultValue="curriculum" className="h-full">
              <TabsList className="grid w-full grid-cols-2 bg-emerald-50">
                <TabsTrigger value="curriculum" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900">
                  Curriculum
                </TabsTrigger>
                <TabsTrigger value="assessments" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900">
                  Assessments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum" className="p-4 h-[calc(100vh-200px)] overflow-y-auto">
                <div className="space-y-4">
                  {curriculum.modules.map((module) => (
                    <div key={module.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-emerald-900">{module.title}</h3>
                        <div className="flex items-center gap-2">
                          {module.moduleAssessment && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                              <Target className="h-3 w-3 mr-1" />
                              Quiz
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50">
                            {module.lessons.length} lessons
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {module.lessons.map((lesson) => {
                          const lessonProgress = getLessonProgress(lesson.id);
                          const isActive = lesson.id === selectedLessonId;

                          return (
                            <Button
                              key={lesson.id}
                              variant={isActive ? 'secondary' : 'ghost'}
                              className={`w-full justify-start font-normal h-auto py-2 ${
                                isActive 
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900' 
                                  : 'hover:bg-emerald-50 text-emerald-800'
                              }`}
                              onClick={() => handleLessonSelect(lesson.id, module.id)}
                            >
                              <div className="flex items-start gap-3">
                                {lessonProgress?.isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border border-emerald-300 mt-0.5 flex-shrink-0" />
                                )}

                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center gap-2">
                                    {lesson.contentType === 'VIDEO' && <Video className="h-3 w-3 flex-shrink-0 text-emerald-600" />}
                                    {lesson.contentType === 'ARTICLE' && <FileText className="h-3 w-3 flex-shrink-0 text-emerald-600" />}
                                    {lesson.contentType === 'QUIZ' && <Target className="h-3 w-3 flex-shrink-0 text-amber-600" />}
                                    <span className="truncate font-medium">{lesson.title}</span>
                                    {lesson.contentType === 'QUIZ' && (
                                      <Badge className="ml-2 bg-amber-500 hover:bg-amber-600 text-white text-xs">
                                        Quiz
                                      </Badge>
                                    )}
                                  </div>

                                  {lesson.description && (
                                    <p className="text-xs text-emerald-700 mt-1 line-clamp-2">{lesson.description}</p>
                                  )}

                                  {lesson.contentType === 'VIDEO' && lesson.videoDuration && (
                                    <span className="text-xs text-emerald-700 flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3" />
                                      {Math.floor(lesson.videoDuration / 60)} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                        
                        {/* Module Assessment Button */}
                        {module.moduleAssessment && (
                          <Button
                            variant="outline"
                            className="w-full justify-start mt-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                            onClick={() => {
                              setSelectedLessonId(null);
                              setCurrentAssessment(module.moduleAssessment!);
                              setUserAnswers({});
                              setAssessmentResults(null);
                              setShowResults(false);
                            }}
                          >
                            <Target className="h-4 w-4 mr-2 text-amber-600" />
                            <div className="text-left">
                              <div className="font-medium">Module Assessment</div>
                              <div className="text-xs text-amber-600">
                                {module.moduleAssessment.questions?.length || 0} questions • {module.moduleAssessment.passingScore}% to pass
                              </div>
                            </div>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Course Final Assessment */}
                  {curriculum.finalAssessment && (
                    <div className="mt-6 pt-6 border-t border-emerald-200">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50 py-3"
                        onClick={() => {
                          setSelectedLessonId(null);
                          setCurrentAssessment(curriculum.finalAssessment!);
                          setUserAnswers({});
                          setAssessmentResults(null);
                          setShowResults(false);
                        }}
                      >
                        <Award className="h-5 w-5 mr-2 text-purple-600" />
                        <div className="text-left">
                          <div className="font-medium">Final Course Assessment</div>
                          <div className="text-xs text-purple-600">
                            {curriculum.finalAssessment.questions?.length || 0} questions • {curriculum.finalAssessment.passingScore}% to pass
                          </div>
                        </div>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="assessments" className="p-4">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-emerald-900">Assessments</h3>
                  
                  {/* Module Assessments */}
                  {curriculum.modules.filter(m => m.moduleAssessment).map(module => (
                    <div key={module.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-amber-600" />
                          <span className="font-medium">{module.title} Assessment</span>
                        </div>
                        <Badge className="bg-amber-500">Module</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {module.moduleAssessment?.description || 'Test your knowledge of this module'}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-bold">{module.moduleAssessment?.questions?.length || 0}</div>
                          <div className="text-gray-600">Questions</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-bold">{module.moduleAssessment?.passingScore}%</div>
                          <div className="text-gray-600">Passing Score</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => {
                          setSelectedLessonId(null);
                          setCurrentAssessment(module.moduleAssessment!);
                          setUserAnswers({});
                          setAssessmentResults(null);
                          setShowResults(false);
                        }}
                      >
                        Take Assessment
                      </Button>
                    </div>
                  ))}
                  
                  {/* Final Assessment */}
                  {curriculum.finalAssessment && (
                    <div className="p-4 border rounded-lg border-purple-300 bg-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">Final Course Assessment</span>
                        </div>
                        <Badge className="bg-purple-600">Final</Badge>
                      </div>
                      <p className="text-sm text-purple-700 mb-3">
                        Complete all modules before attempting the final assessment
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-bold">{curriculum.finalAssessment.questions?.length || 0}</div>
                          <div className="text-gray-600">Questions</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-bold">{curriculum.finalAssessment.passingScore}%</div>
                          <div className="text-gray-600">Passing Score</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-bold">
                            {curriculum.finalAssessment.timeLimit || 'No'}
                          </div>
                          <div className="text-gray-600">Time Limit</div>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => {
                          setSelectedLessonId(null);
                          setCurrentAssessment(curriculum.finalAssessment!);
                          setUserAnswers({});
                          setAssessmentResults(null);
                          setShowResults(false);
                        }}
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Take Final Assessment
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <Card className="md:col-span-2 bg-white border-emerald-200">
          <CardContent className="p-0 h-[calc(100vh-200px)] overflow-y-auto">
            {currentAssessment && assessmentAttempt ? (
              <div className="p-6">
                <AssessmentComponent />
              </div>
            ) : selectedLesson ? (
              <LessonContent lesson={selectedLesson} />
            ) : (
              <div className="text-center py-12">
                <PlayCircle className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-emerald-900">Select a lesson to begin</h3>
                <p className="text-emerald-700">Choose a lesson from the sidebar to start learning</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}