/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/admin/certificates/requests/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/auth";
import { generateCertificatePDF } from "@/hooks/generate-certificate-pdf";
import { Award, BookOpen, CheckCircle, Clock, Download, FileText, Mail, Search, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

interface CertificateRequest {
  id: string;
  userId: string;
  enrollmentId: string;
  user: {
    name: string;
    email: string;
  };
  enrollment: {
    course: {
      title: string;
      instructor: string;
      duration: string;
      startDate: string;
      endDate: string;
    };
    completedAt: string | null;
    certificateIssued: boolean;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  notes: string | null;
}

export default function CertificateRequestsPage() {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [currentCertificateData, setCurrentCertificateData] = useState<any>(null);
  const user = useCurrentUser();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/certificates/requests");
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Failed to load certificate requests',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, requestData: CertificateRequest) => {
    const result = await Swal.fire({
      title: 'Approve Certificate?',
      text: `Approve certificate request for ${requestData.user.name} - ${requestData.enrollment.course.title}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Approve!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setProcessingRequest(requestId);
      
      // Generate certificate ID
      const certificateId = `FT-${requestId.slice(0, 8).toUpperCase()}`;
      
      // Create certificate metadata
      const certificateData = {
        studentName: requestData.user.name,
        courseName: requestData.enrollment.course.title,
        startDate: requestData.enrollment.course.startDate,
        endDate: requestData.enrollment.course.endDate,
        instructor: requestData.enrollment.course.instructor,
        certificateId,
        issueDate: new Date().toISOString()
      };

      console.log('Approving certificate with data:', certificateData);

      // Approve the request with certificate metadata
      const response = await fetch("/api/admin/certificates/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          adminId: user?.id,
          certificateData
        }),
      });

      if (response.ok) {
        console.log('Certificate approved successfully');
        await fetchRequests();
        await Swal.fire({
          icon: 'success',
          title: 'Approved!',
          text: 'Certificate request approved successfully!',
          timer: 3000,
          showConfirmButton: false
        });
      } else {
        const errorData = await response.json();
        console.error('Approval failed:', errorData);
        throw new Error(errorData.error || 'Failed to approve certificate');
      }
    } catch (error) {
      console.error('Error approving certificate:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Approval Failed',
        text: error instanceof Error ? error.message : 'Failed to approve certificate',
        confirmButtonColor: '#d33',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDownloadCertificate = async (requestData: CertificateRequest) => {
    console.log('=== START CERTIFICATE DOWNLOAD ===');
    console.log('Request data:', requestData);
    
    try {
      setProcessingRequest(requestData.id);
      
      // Show loading alert
      Swal.fire({
        title: 'Generating Certificate...',
        text: 'Please wait while we prepare your certificate',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Fetch the stored certificate data from the database
      console.log('Fetching certificate data for enrollment:', requestData.enrollmentId);
      const response = await fetch(`/api/admin/certificates/data?enrollmentId=${requestData.enrollmentId}`);
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch certificate data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Certificate data received:', data);
      
      // Use stored data or generate new data as fallback
      const certificateData = data.certificateData || {
        studentName: requestData.user.name,
        courseName: requestData.enrollment.course.title,
        startDate: requestData.enrollment.course.startDate,
        endDate: requestData.enrollment.course.endDate,
        instructor: requestData.enrollment.course.instructor,
        certificateId: `FT-${requestData.id.slice(0, 8).toUpperCase()}`,
        issueDate: new Date().toISOString()
      };

      console.log('Final certificate data to use:', certificateData);

      setCurrentCertificateData(certificateData);
      console.log('State updated, waiting for render...');

      // Wait for certificate to render
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Certificate ref:', certificateRef.current);
      console.log('Ref has element:', !!certificateRef.current);
      
      if (!certificateRef.current) {
        console.error('Certificate ref is null!');
        throw new Error('Certificate element not found - template may not be rendering');
      }

      console.log('Certificate element found, children count:', certificateRef.current.children.length);
      console.log('Certificate HTML preview:', certificateRef.current.innerHTML.substring(0, 200));

      console.log('Starting PDF generation...');

      // Close the loading alert
      Swal.close();

      // Generate and download PDF
      await generateCertificatePDF(
        certificateRef.current, 
        `${certificateData.studentName.replace(/\s+/g, '_')}_${certificateData.courseName.replace(/\s+/g, '_')}_certificate`
      );
      
      console.log('=== PDF GENERATED SUCCESSFULLY ===');
      
      setCurrentCertificateData(null);
      
      await Swal.fire({
        icon: 'success',
        title: 'Download Complete!',
        text: 'Certificate downloaded successfully!',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('=== ERROR IN CERTIFICATE DOWNLOAD ===');
      console.error('Error object:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      // Close any open alerts first
      Swal.close();
      
      await Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        html: `Failed to download certificate: <br/><strong>${error instanceof Error ? error.message : 'Unknown error'}</strong><br/><br/>Check console for details.`,
        confirmButtonColor: '#d33',
      });
    } finally {
      setProcessingRequest(null);
      console.log('=== END CERTIFICATE DOWNLOAD ===');
    }
  };

  const handleReject = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Reject Certificate?',
      text: 'Are you sure you want to reject this certificate request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Reject!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/admin/certificates/requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REJECTED",
          processedBy: user?.id,
          notes: "Certificate request rejected by admin",
        }),
      });

      if (response.ok) {
        await fetchRequests();
        await Swal.fire({
          icon: 'success',
          title: 'Rejected!',
          text: 'Certificate request rejected successfully',
          timer: 3000,
          showConfirmButton: false
        });
      } else {
        throw new Error('Failed to reject request');
      }
    } catch (error) {
      console.error("Error rejecting certificate:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Rejection Failed',
        text: 'Failed to reject certificate request',
        confirmButtonColor: '#d33',
      });
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || request.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const pendingRequests = requests.filter(r => r.status === "PENDING").length;
  const approvedRequests = requests.filter(r => r.status === "APPROVED").length;
  const rejectedRequests = requests.filter(r => r.status === "REJECTED").length;

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading Certificate Requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
   

      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-blue-700 bg-clip-text text-transparent">
            Certificate Requests
          </h2>
          <p className="text-gray-600 mt-2">
            Manage and process certificate requests from students ({filteredRequests.length} requests)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats Overview - All cards in single row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600">
                Pending
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingRequests}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {approvedRequests}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {rejectedRequests}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No certificate requests found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedStatus !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "No certificate requests at the moment."}
            </p>
            {searchTerm || selectedStatus !== "all" ? (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("all");
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Clear Filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-500 text-white border-b border-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Request Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Course Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {request.enrollment.course.title}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <BookOpen className="h-3 w-3" />
                        {request.enrollment.course.instructor}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {request.user.name}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {request.user.email}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        Duration: {request.enrollment.course.duration}
                      </div>
                      <div className="text-sm text-gray-600">
                        Completed: {request.enrollment.completedAt ? 
                          new Date(request.enrollment.completedAt).toLocaleDateString() : 
                          'N/A'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                          request.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : request.status === "APPROVED"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {request.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                        {request.status === "APPROVED" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {request.status === "REJECTED" && <XCircle className="w-3 h-3 mr-1" />}
                        {request.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(request.requestedAt).toLocaleDateString('en-GB')}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {request.status === "PENDING" && (
                          <>
                            <Button
                              onClick={() => handleApprove(request.id, request)}
                              disabled={processingRequest === request.id}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {processingRequest === request.id ? (
                                <>
                                  <Clock className="w-3 h-3 mr-1 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleReject(request.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {request.status === "APPROVED" && (
                          <Button
                            onClick={() => handleDownloadCertificate(request)}
                            disabled={processingRequest === request.id}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {processingRequest === request.id ? (
                              <>
                                <Clock className="w-3 h-3 mr-1 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}