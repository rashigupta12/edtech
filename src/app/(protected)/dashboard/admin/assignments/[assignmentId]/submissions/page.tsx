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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export default function AssignmentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [grading, setGrading] = useState<string | null>(null);
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  useEffect(() => {
    if (assignmentId) {
      fetchSubmissions();
      fetchAssignment();
    }
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/assignments?id=${assignmentId}&submissions=true`);
      const result: ApiResponse<Submission[]> = await response.json();

      if (result.success && result.data) {
        setSubmissions(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch submissions');
      }
    } catch (err) {
      setError('Failed to fetch submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignment = async () => {
    try {
      const response = await fetch(`/api/assignments?id=${assignmentId}`);
      const result: ApiResponse<any> = await response.json();
      if (result.success && result.data) {
        setAssignment(result.data);
      }
    } catch (err) {
      console.error('Error fetching assignment:', err);
    }
  };

  const gradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    setGrading(submissionId);
    try {
      const response = await fetch(`/api/assignments?submissionId=${submissionId}&grade=true`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          maxScore: assignment?.maxScore || 100,
          feedback,
          gradedBy: 'admin', // In real app, get from auth context
        }),
      });

      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        await fetchSubmissions(); // Refresh submissions
      } else {
        alert(result.error?.message || 'Failed to grade submission');
      }
    } catch (err) {
      alert('Failed to grade submission');
      console.error('Error grading submission:', err);
    } finally {
      setGrading(null);
    }
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {assignment?.title || 'Assignment'} Submissions
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and grade student submissions
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">Students haven't submitted any work for this assignment.</p>
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
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <SubmissionRow
                      key={submission.id}
                      submission={submission}
                      assignment={assignment}
                      onGrade={gradeSubmission}
                      grading={grading === submission.id}
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

function SubmissionRow({ 
  submission, 
  assignment, 
  onGrade, 
  grading 
}: { 
  submission: Submission;
  assignment: any;
  onGrade: (submissionId: string, score: number, feedback: string) => void;
  grading: boolean;
}) {
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [score, setScore] = useState(submission.score || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');

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
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {submission.userName || submission.userId}
        </div>
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
        {submission.score !== null ? `${submission.score}/${submission.maxScore}` : 'Not graded'}
      </td>
      <td className="px-6 py-4 text-sm font-medium space-x-2">
        {!showGradeForm ? (
          <>
            <button
              onClick={() => setShowGradeForm(true)}
              className="text-blue-600 hover:text-blue-900"
            >
              Grade
            </button>
            <button className="text-gray-600 hover:text-gray-900">
              View
            </button>
          </>
        ) : (
          <div className="flex space-x-2">
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              min="0"
              max={assignment?.maxScore || 100}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Score"
            />
            <button
              onClick={handleGrade}
              disabled={grading}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {grading ? '...' : 'Save'}
            </button>
            <button
              onClick={() => setShowGradeForm(false)}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}