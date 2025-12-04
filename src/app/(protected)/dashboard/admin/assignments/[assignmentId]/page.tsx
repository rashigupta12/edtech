/*eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string | null;
  courseId: string;
  moduleId: string | null;
  dueDate: string | null;
  maxScore: number;
  attachments: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export default function AssignmentDetailPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  // Fixed useEffect – no missing dependency warning
  useEffect(() => {
    if (!assignmentId) return;

    const loadAssignment = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/assignments?id=${assignmentId}`);
        const result: ApiResponse<Assignment> = await response.json();

        if (result.success && result.data) {
          setAssignment(result.data);
        } else {
          setError(result.error?.message || 'Assignment not found');
        }
      } catch (err) {
        setError('Failed to fetch assignment details');
        console.error('Error fetching assignment:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [assignmentId]); // Only depends on assignmentId → perfect!

  const deleteAssignment = async () => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const response = await fetch(`/api/assignments?id=${assignmentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        router.push('/admin/assignments');
      } else {
        alert(result.error?.message || 'Failed to delete assignment');
      }
    } catch (err) {
      alert('Failed to delete assignment');
      console.error('Error deleting assignment:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error or not found
  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Assignment not found'}
          </div>
          <Link
            href="/admin/assignments"
            className="inline-block mt-4 text-blue-600 hover:text-blue-900"
          >
            ← Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/assignments"
            className="text-blue-600 hover:text-blue-900 mb-4 inline-block"
          >
            ← Back to Assignments
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
              <p className="text-gray-600 mt-2">Assignment Details</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/assignments/${assignmentId}/edit`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Edit
              </Link>
              <Link
                href={`/admin/assignments/${assignmentId}/submissions`}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Submissions
              </Link>
              <button
                onClick={deleteAssignment}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Course ID</h3>
              <p className="mt-1 text-sm text-gray-900">{assignment.courseId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Module ID</h3>
              <p className="mt-1 text-sm text-gray-900">
                {assignment.moduleId || 'Not assigned to module'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {assignment.dueDate
                  ? new Date(assignment.dueDate).toLocaleString()
                  : 'No due date'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Maximum Score</h3>
              <p className="mt-1 text-sm text-gray-900">{assignment.maxScore}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created By</h3>
              <p className="mt-1 text-sm text-gray-900">{assignment.createdBy}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(assignment.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{assignment.description}</p>
          </div>

          {assignment.instructions && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Instructions</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          )}

          {assignment.attachments && Object.keys(assignment.attachments).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
              <pre className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(assignment.attachments, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}