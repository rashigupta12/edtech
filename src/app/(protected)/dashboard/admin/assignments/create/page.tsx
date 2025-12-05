/*eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/auth';
import { ArrowLeft, Plus, Loader } from 'lucide-react';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  sortOrder: number;
}

export default function CreateAssignmentPage() {
  const user = useCurrentUser();
  const [formData, setFormData] = useState({
    courseId: '',
    moduleId: '',
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxScore: 100,
    createdBy: user?.id || '',
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        const result: ApiResponse<Course[]> = await response.json();

        if (result.success) {
          setCourses(result.data || []);
        } else {
          setError('Failed to load courses');
        }
      } catch (err) {
        setError('Failed to load courses');
        console.error('Error loading courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch modules when course is selected
  useEffect(() => {
    const fetchModules = async () => {
      if (!formData.courseId) {
        setModules([]);
        return;
      }

      setModulesLoading(true);
      try {
        const response = await fetch(`/api/courses?id=${formData.courseId}&modules=true`);
        const result: ApiResponse<Module[]> = await response.json();

        if (result.success) {
          setModules(result.data || []);
        } else {
          setError('Failed to load modules');
          setModules([]);
        }
      } catch (err) {
        setError('Failed to load modules');
        setModules([]);
        console.error('Error loading modules:', err);
      } finally {
        setModulesLoading(false);
      }
    };

    fetchModules();
  }, [formData.courseId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.courseId) {
      setError('Please select a course');
      return;
    }

    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          moduleId: formData.moduleId || null,
        }),
      });

      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        router.push('/dashboard/admin/assignments');
      } else {
        setError(result.error?.message || 'Failed to create assignment');
      }
    } catch (err) {
      setError('Failed to create assignment');
      console.error('Error creating assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'courseId') {
      // Reset module when course changes
      setFormData(prev => ({
        ...prev,
        courseId: value,
        moduleId: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="min-h-screen  p-4 md:p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assignments
          </button>
          
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Create New Assignment</h1>
            <p className="text-gray-600 mt-2">Create a new assignment for a course</p>
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
            {/* Course & Module Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  required
                  disabled={coursesLoading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 transition-colors"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {coursesLoading && (
                  <p className="text-sm text-gray-500 mt-2">Loading courses...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module
                </label>
                <select
                  name="moduleId"
                  value={formData.moduleId}
                  onChange={handleChange}
                  disabled={!formData.courseId || modulesLoading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 transition-colors"
                >
                  <option value="">Select a module</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
                {modulesLoading && (
                  <p className="text-sm text-gray-500 mt-2">Loading modules...</p>
                )}
                {!formData.courseId && (
                  <p className="text-sm text-gray-500 mt-2">Select a course first</p>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
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
                value={formData.description}
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
                value={formData.instructions}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Enter assignment instructions"
              />
            </div>

            {/* Due Date & Max Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={formData.dueDate}
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
                  value={formData.maxScore}
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
                disabled={loading || !formData.courseId}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Assignment
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