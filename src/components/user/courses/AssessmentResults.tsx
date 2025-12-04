/*eslint-disable  @typescript-eslint/no-explicit-any*/
/*eslint-disable   @typescript-eslint/no-unused-vars*/
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Assessment } from "@/components/user/courses/learn";
import { Award, CheckCircle, RefreshCw, XCircle } from "lucide-react";

interface AssessmentResultsProps {
  results: {
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    passingScore: number;
    correctAnswers: number;
    totalQuestions: number;
    attemptId: string;
  };
  assessment: Assessment;
  userAnswers: Record<string, any>;
  onContinue: () => void;
  onRetake: () => void;
}

export default function AssessmentResults({
  results,
  assessment,
  userAnswers,
  onContinue,
  onRetake,
}: AssessmentResultsProps) {
  const canRetake =
    assessment.allowRetake &&
    (assessment.maxAttempts === null || true); // You'll need to implement attempt counting

  return (
    <div className="space-y-6">
      <Card
        className={`border ${
          results.passed ? "border-emerald-200" : "border-red-200"
        } bg-white`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  results.passed ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                {results.passed ? (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {results.passed
                    ? "Assessment Completed Successfully"
                    : "Assessment Not Passed"}
                </h3>
                <p className="text-gray-600">
                  {results.passed
                    ? "You have demonstrated understanding of the material."
                    : `Minimum passing score: ${results.passingScore}%`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-3xl font-bold ${
                  results.passed ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {results.percentage}%
              </div>
              <div className="text-sm text-gray-500">Your Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {results.score}
              </div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {results.correctAnswers}/{results.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {results.totalPoints}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {results.passed ? (
                  <Award className="h-6 w-6 text-emerald-600 mx-auto" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 mx-auto" />
                )}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        {canRetake && (
          <Button
            onClick={onRetake}
            variant="outline"
            className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retake Assessment
          </Button>
        )}
        <Button
          onClick={onContinue}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Continue Learning
        </Button>
      </div>
    </div>
  );
}