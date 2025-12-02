import { Loader2, Target } from "lucide-react";
import { Assessment, UserAssessmentAttempt } from "./learn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Assessment Confirmation Dialog
const AssessmentStartDialog = ({
  assessment,
  open,
  onOpenChange,
  onStart,
  previousAttempts = [],
  isLoading,
}: {
  assessment: Assessment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
  previousAttempts: UserAssessmentAttempt[];
  isLoading: boolean;
}) => {
  const hasPreviousAttempts = previousAttempts.length > 0;
  const bestAttempt = hasPreviousAttempts 
    ? previousAttempts.reduce((best, attempt) => 
        attempt.percentage > best.percentage ? attempt : best
      )
    : null;
  const attemptsLeft = assessment.maxAttempts 
    ? assessment.maxAttempts - previousAttempts.length
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Start Assessment
          </DialogTitle>
          <DialogDescription>
            {assessment.description || 'Test your knowledge with this assessment.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Assessment Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Questions</div>
              <div className="text-lg font-semibold">{assessment.questions.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Passing Score</div>
              <div className="text-lg font-semibold text-emerald-600">
                {assessment.passingScore}%
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Time Limit</div>
              <div className="text-lg font-semibold">
                {assessment.timeLimit ? `${assessment.timeLimit} min` : 'No limit'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-500">Attempts</div>
              <div className="text-lg font-semibold">
                {assessment.maxAttempts || 'Unlimited'}
              </div>
            </div>
          </div>

          {/* Previous Attempts */}
          {hasPreviousAttempts && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Your Previous Attempts</div>
              <div className="space-y-1">
                {previousAttempts.map((attempt, idx) => (
                  <div 
                    key={attempt.id} 
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      attempt.passed 
                        ? 'bg-emerald-50 border border-emerald-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        attempt.passed ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <span>Attempt {idx + 1}</span>
                      <Badge variant={attempt.passed ? "default" : "destructive"} className="text-xs">
                        {attempt.percentage}%
                      </Badge>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              
              {bestAttempt && (
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="text-sm font-medium text-blue-700">
                    Best Attempt: {bestAttempt.percentage}% - {bestAttempt.passed ? 'Passed' : 'Failed'}
                  </div>
                </div>
              )}

              {attemptsLeft !== null && attemptsLeft > 0 && (
                <div className="text-sm text-amber-600">
                  You have {attemptsLeft} attempt{attemptsLeft > 1 ? 's' : ''} left
                </div>
              )}
            </div>
          )}

          {/* Rules */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Assessment Rules:</div>
            <ul className="text-sm text-gray-600 space-y-1 pl-4 list-disc">
              <li>Answer all questions before submitting</li>
              {assessment.timeLimit && (
                <li>Timer will start when you begin the assessment</li>
              )}
              <li>You cannot pause and resume later</li>
              {assessment.showCorrectAnswers && (
                <li>Correct answers will be shown after submission</li>
              )}
              {assessment.negativePoints > 0 && (
                <li>Wrong answers may deduct points</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onStart}
            disabled={isLoading || (attemptsLeft !== null && attemptsLeft <= 0)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                {hasPreviousAttempts ? 'Retake Assessment' : 'Start Assessment'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentStartDialog;
