/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// app/(protected)/dashboard/user/courses/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  Loader2,
  Award,
  FileText
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import CertificateTemplate from "@/components/certificate-template";
import { generateCertificatePDF } from "@/hooks/generate-certificate-pdf";
import Swal from "sweetalert2";

interface RawEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  status: "ACTIVE" | "COMPLETED" | "PENDING";
  enrolledAt: string;
  completedAt?: string | null;
  certificateIssued: boolean;
  certificateData?: any;
  courseThumbnail?: string | null;
  certificateRequested?: boolean;
  certificateRequestStatus?: "PENDING" | "APPROVED" | "REJECTED";
  courseInstructor?: string;
  courseStartDate?: string;
  courseEndDate?: string;
  progress?: number; // Added real progress field
}

export default function MyCoursesPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [enrollments, setEnrollments] = useState<RawEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingCertificate, setRequestingCertificate] = useState<string | null>(null);
  const [downloadingCertificate, setDownloadingCertificate] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [currentCertificateData, setCurrentCertificateData] = useState<any>(null);

  useEffect(() => {
    async function fetchEnrollments() {
      if (!userId) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/user/enrollments`);
        if (!res.ok) throw new Error("Failed to load courses");

        const data = await res.json();
        setEnrollments(data.enrollments ?? []);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchEnrollments();
  }, [userId]);

  const requestCertificate = async (enrollmentId: string) => {
    if (!userId) return;

    try {
      setRequestingCertificate(enrollmentId);
      
      const response = await fetch('/api/user/certificate-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollmentId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request certificate');
      }

      setEnrollments(prev => prev.map(enrollment => 
        enrollment.id === enrollmentId 
          ? { 
              ...enrollment, 
              certificateRequested: true, 
              certificateRequestStatus: 'PENDING' 
            }
          : enrollment
      ));

      await Swal.fire({
        icon: 'success',
        title: 'Request Submitted!',
        text: 'Certificate request submitted successfully!',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error requesting certificate:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Request Failed',
        text: err instanceof Error ? err.message : 'Failed to request certificate',
        confirmButtonColor: '#d33',
      });
    } finally {
      setRequestingCertificate(null);
    }
  };

  const downloadCertificate = async (enrollment: RawEnrollment) => {
    try {
      setDownloadingCertificate(enrollment.id);
      
      // Generate certificate data
      const certificateData = enrollment.certificateData || {
        studentName: session?.user?.name || 'Student',
        courseName: enrollment.courseTitle,
        startDate: enrollment.courseStartDate || new Date().toISOString(),
        endDate: enrollment.courseEndDate || new Date().toISOString(),
        instructor: enrollment.courseInstructor || 'Instructor',
        certificateId: `FT-${enrollment.id.slice(0, 8).toUpperCase()}`,
        issueDate: new Date().toISOString()
      };

      setCurrentCertificateData(certificateData);

      // Wait for certificate to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!certificateRef.current) {
        throw new Error('Certificate element not found');
      }

      // Generate and download PDF
      await generateCertificatePDF(
        certificateRef.current, 
        `${certificateData.studentName}_${certificateData.courseName.replace(/\s+/g, '_')}_certificate`
      );
      
      setCurrentCertificateData(null);
      
      await Swal.fire({
        icon: 'success',
        title: 'Download Complete!',
        text: 'Certificate downloaded successfully!',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Failed to download certificate. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setDownloadingCertificate(null);
    }
  };

  const checkCertificateStatus = async (enrollmentId: string) => {
    try {
      const response = await fetch(`/api/user/certificate-status?enrollmentId=${enrollmentId}`);
      if (response.ok) {
        const data = await response.json();
        
        setEnrollments(prev => prev.map(enrollment => 
          enrollment.id === enrollmentId 
            ? { 
                ...enrollment, 
                certificateIssued: data.certificateIssued,
                certificateData: data.certificateData,
                certificateRequestStatus: data.certificateRequestStatus
              }
            : enrollment
        ));
        
        if (data.certificateIssued) {
          await Swal.fire({
            icon: 'success',
            title: 'Certificate Ready!',
            text: 'Your certificate is ready to download!',
            confirmButtonColor: '#3085d6',
          });
        } else {
          await Swal.fire({
            icon: 'info',
            title: 'Still Processing',
            text: 'Certificate is still being processed. Please check back later.',
            confirmButtonColor: '#3085d6',
          });
        }
      }
    } catch (err) {
      console.error('Error checking certificate status:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Check Failed',
        text: 'Failed to check certificate status',
        confirmButtonColor: '#d33',
      });
    }
  };

  const getStatusBadge = (status: RawEnrollment["status"]) => {
    const cfg = {
      ACTIVE: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
      COMPLETED: { label: "Completed", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      PENDING: { label: "Pending", color: "bg-slate-100 text-slate-600 border-slate-200" },
    };
    const { label, color } = cfg[status];
    return <Badge className={`${color} border`}>{label}</Badge>;
  };

  const getCertificateBadge = (enrollment: RawEnrollment) => {
    if (enrollment.certificateIssued) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Certificate Ready
        </Badge>
      );
    }

    if (enrollment.certificateRequestStatus === "APPROVED") {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Award className="h-3 w-3 mr-1" />
          Processing Certificate
        </Badge>
      );
    }

    if (enrollment.certificateRequestStatus === "PENDING") {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
          <FileText className="h-3 w-3 mr-1" />
          Request Pending
        </Badge>
      );
    }

    if (enrollment.certificateRequestStatus === "REJECTED") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Request Rejected
        </Badge>
      );
    }

    return null;
  };

  const getProgress = (enrollment: RawEnrollment) => {
    // Use real progress if available, otherwise fallback based on status
    if (enrollment.progress !== undefined) {
      return enrollment.progress;
    }
    
    if (enrollment.status === "COMPLETED") return 100;
    if (enrollment.status === "PENDING") return 0;
    return 0; // Default for ACTIVE status when no progress data
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const canRequestCertificate = (enrollment: RawEnrollment) => {
    return !enrollment.certificateIssued && 
           enrollment.certificateRequestStatus !== "PENDING" &&
           enrollment.certificateRequestStatus !== "APPROVED";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900">Error</h3>
          <p className="text-slate-600 mt-1">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-200">
            <BookOpen className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-blue-900 mb-2">
            No Courses Yet
          </h3>
          <p className="text-slate-600 mb-6">
            Start your learning journey by enrolling in a course!
          </p>
          <Button 
            asChild 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
          >
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Hidden certificate template for PDF generation */}
      <div className="fixed -left-[9999px] -top-[9999px]">
        <div ref={certificateRef}>
          {currentCertificateData && (
            <CertificateTemplate data={currentCertificateData} />
          )}
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-yellow-500 rounded-full"></div>
        <div className="pl-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
            My Courses
          </h1>
          <p className="text-slate-600 mt-1">
            Continue learning and track your progress
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((enrollment) => {
          const isCompleted = enrollment.status === "COMPLETED";
          // const progress = getProgress(enrollment);
          const hasCertificate = enrollment.certificateIssued;
          const canRequest = canRequestCertificate(enrollment);

          return (
            <Card
              key={enrollment.id}
              className="border border-blue-100 bg-white hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col relative overflow-hidden group"
            >
              {isCompleted && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>
              )}

              {enrollment.courseThumbnail ? (
                <div className="h-40 overflow-hidden bg-slate-100">
                  <img
                    src={enrollment.courseThumbnail}
                    alt={enrollment.courseTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-50 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-blue-600 opacity-20" />
                </div>
              )}

              <CardHeader className={`pb-4 flex-1 ${isCompleted ? 'pt-5' : 'pt-4'}`}>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2 text-blue-900">
                    {enrollment.courseTitle}
                  </CardTitle>
                  {getStatusBadge(enrollment.status)}
                </div>

                <CardDescription className="mt-2 text-sm text-slate-600">
                  Enrolled on {formatDate(enrollment.enrolledAt)}
                </CardDescription>

                {getCertificateBadge(enrollment)}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-semibold text-blue-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-blue-50 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div> */}

                <div className="flex items-center gap-2 text-sm pt-2">
                  {hasCertificate ? (
                    <>
                      <div className="p-1 bg-green-100 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-green-700 font-medium">
                        Certificate Available
                      </span>
                    </>
                  ) : enrollment.certificateRequestStatus === "PENDING" ? (
                    <>
                      <div className="p-1 bg-yellow-100 rounded">
                        <FileText className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span className="text-yellow-700 font-medium">
                        Certificate request pending
                      </span>
                    </>
                  ) : enrollment.certificateRequestStatus === "REJECTED" ? (
                    <>
                      <div className="p-1 bg-red-100 rounded">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-red-700 font-medium">
                        Certificate request rejected
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="p-1 bg-orange-100 rounded">
                        <Award className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="text-orange-700 font-medium">
                        Request certificate anytime
                      </span>
                    </>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t border-blue-50 bg-gradient-to-r from-blue-50/50 to-transparent flex gap-2">
                {hasCertificate && (
                  <Button 
                    onClick={() => downloadCertificate(enrollment)}
                    disabled={downloadingCertificate === enrollment.id}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    {downloadingCertificate === enrollment.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </>
                    )}
                  </Button>
                )}

                {canRequest && (
                  <Button
                    onClick={() => requestCertificate(enrollment.id)}
                    disabled={requestingCertificate === enrollment.id}
                    className={`${
                      isCompleted 
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    } text-white`}
                  >
                    {requestingCertificate === enrollment.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      <>
                        <Award className="h-4 w-4 mr-2" />
                        Request Certificate
                      </>
                    )}
                  </Button>
                )}

                {enrollment.certificateRequestStatus === "PENDING" && (
                  <Button
                    onClick={() => checkCertificateStatus(enrollment.id)}
                    variant="outline"
                    className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Check Status
                  </Button>
                )}

                {enrollment.certificateRequestStatus === "REJECTED" && (
                  <Button
                    onClick={() => requestCertificate(enrollment.id)}
                    disabled={requestingCertificate === enrollment.id}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    {requestingCertificate === enrollment.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <Award className="h-4 w-4 mr-2" />
                        Retry Request
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}