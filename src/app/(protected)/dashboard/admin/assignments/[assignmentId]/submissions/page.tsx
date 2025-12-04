/*eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Submission {
  id: string;
  userId: string;
  userName?: string;
  content: string | null;
  attachments: any;
  status: string;
  score: number | null;
  maxScore: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  gradedBy: string | null;
}

interface Assignment {
  id: string;
  title: string;
  maxScore: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export default function AssignmentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [grading, setGrading] = useState<string | null>(null);
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  // Fixed: No more missing dependency warnings!
  useEffect(() => {
    if (!assignmentId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Parallel fetch both assignment and submissions
        const [subRes, assignRes] = await Promise.all([
          fetch(`/api/assignments?id=${assignmentId}&submissions=true`),
          fetch(`/api/assignments?id=${assignmentId}`)
        ]);

        const subResult: ApiResponse<Submission[]> = await subRes.json();
        const assignResult: ApiResponse<Assignment> = await assignRes.json();

        if (subResult.success && subResult.data) {
          setSubmissions(subResult.data);
        } else {
          setError(subResult.error?.message || 'Failed to load submissions');
        }

        if (assignResult.success && assignResult.data) {
          setAssignment(assignResult.data);
        }
      } catch (err) {
        setError('Failed to load assignment data');
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assignmentId]); // Only depends on assignmentId → perfect!

  const gradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    setGrading(submissionId);

    try {
      const response = await fetch(`/api/assignments?submissionId=${submissionId}&grade=true`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          maxScore: assignment?.maxScore || 100,
          feedback,
          gradedBy: 'admin',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh submissions only
        const res = await fetch(`/api/assignments?id=${assignmentId}&submissions=true`);
        const data: ApiResponse<Submission[]> = await res.json();
        if (data.success && data.data) {
          setSubmissions(data.data);
        }
      } else {
        alert(result.error?.message || 'Failed to grade submission');
      }
    } catch (err) {
      alert('Failed to grade submission');
      console.error(err);
    } finally {
      setGrading(null);
    }
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'GRADED': return 'bg-green-100 text-green-800';
  //     case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
  //     case 'PENDING': return 'bg-yellow-100 text-yellow-800';
  //     case 'LATE': return 'bg-red-100 text-red-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {assignment?.title || 'Assignment'} Submissions
          </h1>
          <p className="text-gray-600 mt-2">Manage and grade student submissions</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">No submissions</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">Students haven &apos;t submitted any work for this assignment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <SubmissionRow
                      key={submission.id}
                      submission={submission}
                      maxScore={assignment?.maxScore || 100}
                      onGrade={gradeSubmission}
                      isGrading={grading === submission.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Clean SubmissionRow — no duplicate logic
function SubmissionRow({
  submission,
  maxScore,
  onGrade,
  isGrading,
}: {
  submission: Submission;
  maxScore: number;
  onGrade: (id: string, score: number, feedback: string) => void;
  isGrading: boolean;
}) {
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [score, setScore] = useState(submission.score ?? 0);
  const [feedback, setFeedback] = useState(submission.feedback ?? '');

  const handleGrade = () => {
    onGrade(submission.id, score, feedback);
    setShowGradeForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GRADED': return 'bg-green-100 text-green-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'LATE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 text-sm font-medium text-gray-900">
        {submission.userName || submission.userId}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {new Date(submission.submittedAt).toLocaleString()}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
          {submission.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {submission.score !== null ? `${submission.score}/${maxScore}` : 'Not graded'}
      </td>
      <td className="px-6 py-4 text-sm">
        {!showGradeForm ? (
          <div className="flex gap-4">
            <button onClick={() => setShowGradeForm(true)} className="text-blue-600 hover:text-blue-900 font-medium">
              Grade
            </button>
            <button className="text-gray-600 hover:text-gray-900">View</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              min="0"
              max={maxScore}
              className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              placeholder="0"
            />
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Feedback (optional)"
              className="flex-1 min-w-48 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={handleGrade}
              disabled={isGrading}
              className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {isGrading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setShowGradeForm(false)}
              className="bg-gray-500 text-white px-4 py-1.5 rounded-md text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}