/*eslint-disable  @typescript-eslint/no-explicit-any*/
/*eslint-disable   @typescript-eslint/no-unused-vars*/
// --- Types ---
export type ContentType = 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSESSMENT';

export interface AssessmentQuestion {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options?: any[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  negativePoints: number;
  sortOrder: number;
}

export interface Assessment {
  negativePoints: number;
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

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: ContentType;
  videoUrl?: string | null;
  articleContent?: string | null;
  videoDuration?: number | null; // seconds
  sortOrder: number;
  isFree?: boolean;
  quiz?: Assessment; // Lesson quiz
}

export interface CurriculumModule {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  lessons: Lesson[];
  moduleAssessment?: Assessment;
}

export interface Curriculum {
  modules: CurriculumModule[];
  courseTitle?: string;
  finalAssessment?: Assessment;
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  isCompleted: boolean;
  completedAt: string | null;
  lastWatchedPosition: number; // seconds
  watchDuration: number; // seconds
  overallProgress:number;
  
}

export interface AssessmentAttempt {
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
  reviewAllowed: boolean;
}

export interface UserAssessmentAttempt {
  id: string;
  score: number;
  percentage: number;
  passed: boolean;
  status: string;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
}



// --- Helper utilities ---
export const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
};

export const formatVideoUrl = (url: string | null | undefined): string | null => {
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

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};


export interface ProgressResponse {
  enrollmentId: string;
  courseId: string;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  completedAssessments: number;
  totalAssessments: number;
  status: string;
  completedAt: string | null;
  overallScore: number;
  certificateEligible: boolean;
  lessonsProgress: {
    id: string;
    title: string;
    moduleId: string;
    moduleTitle: string;
    contentType: string;
    hasQuiz: string;
    quizRequired: boolean;
    progress: {
      lessonId: string;
      isCompleted: boolean;
      completedAt: string | null;
      lastWatchedPosition: number;
      watchDuration: number;
      videoPercentageWatched: number;
    } | null;
    isComplete: boolean;
    completionRules: any;
    quizResult: any;
  }[];
  moduleAssessmentStatus: any[];
  finalAssessmentStatus: any;
  assessmentAttempts?: Record<string, UserAssessmentAttempt[]>;
}




