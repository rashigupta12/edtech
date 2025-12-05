/*eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader } from 'lucide-react';

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
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export default function EditAssignmentPage() {
  const [formData, setFormData] = useState<Partial<Assignment>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  useEffect(() => {
    if (!assignmentId) return;

    const loadAssignment = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/assignments?id=${assignmentId}`);
        const result: ApiResponse<Assignment> = await response.json();

        if (result.success && result.data) {
          const a = result.data;
          setFormData({
            title: a.title,
            description: a.description,
            instructions: a.instructions ?? '',
            courseId: a.courseId,
            moduleId: a.moduleId ?? '',
            dueDate: a.dueDate ? a.dueDate.split('T')[0] : '',
            maxScore: a.maxScore,
          });
        } else {
          setError(result.error?.message || 'Assignment not found');
        }
      } catch (err) {
        setError('Failed to load assignment');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [assignmentId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/assignments?id=${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        router.push(`/dashboard/admin/assignments/${assignmentId}`);
      } else {
        setError(result.error?.message || 'Failed to update assignment');
      }
    } catch (err) {
      setError('Failed to update assignment');
      console.error('Error updating assignment:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="w-full mx-auto">
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

  if (error && !formData.title) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="w-full mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 mb-6 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Assignments
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assignment
          </button>
          
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Edit Assignment</h1>
            <p className="text-gray-600 mt-2">Update assignment details</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Enter assignment title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Enter assignment description"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions (Optional)
              </label>
              <textarea
                name="instructions"
                value={formData.instructions || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Enter assignment instructions"
              />
            </div>

            {/* Course ID & Module ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course ID
                </label>
                <input
                  type="text"
                  name="courseId"
                  value={formData.courseId || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module ID
                </label>
                <input
                  type="text"
                  name="moduleId"
                  value={formData.moduleId || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Due Date & Max Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Score
                </label>
                <input
                  type="number"
                  name="maxScore"
                  value={formData.maxScore || 100}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-emerald-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}