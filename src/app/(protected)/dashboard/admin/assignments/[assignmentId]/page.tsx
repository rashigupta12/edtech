/*eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, FileText, Trash2, Calendar, Award, User, Clock, BookOpen } from 'lucide-react';

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
        router.push('/dashboard/admin/assignments');
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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Assignment not found'}
          </div>
          <Link
            href="/dashboard/admin/assignments"
            className="inline-flex items-center gap-2 mt-4 text-emerald-600 hover:text-emerald-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 md:p-2">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/admin/assignments"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assignments
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{assignment.title}</h1>
              <p className="text-gray-600 mt-2">Assignment Details</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/admin/assignments/${assignmentId}/edit`}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Link>
              <Link
                href={`/dashboard/admin/assignments/${assignmentId}/submissions`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FileText className="h-4 w-4" />
                Submissions
              </Link>
              <button
                onClick={deleteAssignment}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Details Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-emerald-100">
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpen className="h-4 w-4" />
                Course ID
              </div>
              <p className="text-sm font-medium text-gray-900 pl-6">{assignment.courseId}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpen className="h-4 w-4" />
                Module ID
              </div>
              <p className="text-sm font-medium text-gray-900 pl-6">
                {assignment.moduleId || 'Not assigned to module'}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                Due Date
              </div>
              <p className="text-sm font-medium text-gray-900 pl-6">
                {assignment.dueDate
                  ? new Date(assignment.dueDate).toLocaleString()
                  : 'No due date'}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Award className="h-4 w-4" />
                Maximum Score
              </div>
              <p className="text-sm font-medium text-emerald-700 pl-6">{assignment.maxScore}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="h-4 w-4" />
                Created By
              </div>
              <p className="text-sm font-medium text-gray-900 pl-6">{assignment.createdBy}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Created At
              </div>
              <p className="text-sm font-medium text-gray-900 pl-6">
                {new Date(assignment.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
              Description
            </h3>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{assignment.description}</p>
            </div>
          </div>

          {/* Instructions */}
          {assignment.instructions && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                Instructions
              </h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{assignment.instructions}</p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {assignment.attachments && Object.keys(assignment.attachments).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                Attachments
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-900">
                  {JSON.stringify(assignment.attachments, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

       
      </div>
    </div>
  );
}