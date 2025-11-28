/*eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/admin/certificates/page.tsx
"use client";

import CertificateTemplate from "@/components/certificate-template";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateCertificatePDF } from "@/hooks/generate-certificate-pdf";
import { Award, BookOpen, Calendar, Clock, Download, GraduationCap, Mail, Search, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

interface Certificate {
  id: string;
  enrollmentId: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  course: {
    title: string;
    instructor: string;
  };
  certificateUrl: string;
  certificateData?: any;
  certificateIssuedAt: string;
  completedAt: string;
  finalGrade?: number;
}

export default function AllCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [processingCertificate, setProcessingCertificate] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [currentCertificateData, setCurrentCertificateData] = useState<any>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch("/api/admin/certificates");
      const data = await response.json();
      setCertificates(data.certificates || []);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Failed to load certificates',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    console.log('=== START CERTIFICATE DOWNLOAD ===');
    console.log('Certificate data:', certificate);
    
    try {
      setProcessingCertificate(certificate.id);
      
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
      console.log('Fetching certificate data for enrollment:', certificate.enrollmentId);
      const response = await fetch(`/api/admin/certificates/data?enrollmentId=${certificate.enrollmentId}`);
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch certificate data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Certificate data received:', data);
      
      // Use stored data or generate new data as fallback
      const certificateData = data.certificateData || certificate.certificateData || {
        studentName: certificate.user.name,
        courseName: certificate.course.title,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        instructor: certificate.course.instructor,
        certificateId: `FT-${certificate.id.slice(0, 8).toUpperCase()}`,
        issueDate: certificate.certificateIssuedAt
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
      setProcessingCertificate(null);
      console.log('=== END CERTIFICATE DOWNLOAD ===');
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch = 
      cert.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = (!dateRange.start || new Date(cert.certificateIssuedAt) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(cert.certificateIssuedAt) <= new Date(dateRange.end));
    
    return matchesSearch && matchesDate;
  });

  // Calculate stats
  const totalCertificates = certificates.length;
  const thisMonthCertificates = certificates.filter(cert => {
    const certDate = new Date(cert.certificateIssuedAt);
    const now = new Date();
    return certDate.getMonth() === now.getMonth() && certDate.getFullYear() === now.getFullYear();
  }).length;
  const highGrades = certificates.filter(cert => cert.finalGrade && cert.finalGrade >= 90).length;

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading Certificates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden Certificate Template for PDF Generation - EXACT SAME AS REQUESTS PAGE */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {currentCertificateData && (
          <div ref={certificateRef}>
            <CertificateTemplate
              {...currentCertificateData}
            />
          </div>
        )}
      </div>

      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-blue-700 bg-clip-text text-transparent">
            Certificates Management
          </h2>
          <p className="text-gray-600 mt-2">
            View and manage all issued certificates ({filteredCertificates.length} certificates)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Date Filters */}
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Start date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <input
              type="date"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="End date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Certificates
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCertificates}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600">
                This Month
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {thisMonthCertificates}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">High Grades</p>
              <p className="text-2xl font-bold text-gray-900">
                {highGrades}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(certificates.map(cert => cert.userId)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredCertificates.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No certificates found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || dateRange.start || dateRange.end
                ? "Try adjusting your search or filter criteria"
                : "No certificates have been issued yet."}
            </p>
            {(searchTerm || dateRange.start || dateRange.end) && (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setDateRange({ start: "", end: "" });
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-500 text-white border-b border-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Certificate Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Course Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Award className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {certificate.course.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            Issued to {certificate.user.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {certificate.user.name}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {certificate.user.email}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                          <BookOpen className="h-3 w-3" />
                          {certificate.course.instructor}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Issued: {new Date(certificate.certificateIssuedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Completed: {new Date(certificate.completedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {certificate.finalGrade ? (
                        <Badge 
                          variant={certificate.finalGrade >= 90 ? "default" : "secondary"}
                          className={
                            certificate.finalGrade >= 90 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }
                        >
                          {certificate.finalGrade}%
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => handleDownloadCertificate(certificate)}
                          disabled={processingCertificate === certificate.id}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {processingCertificate === certificate.id ? (
                            <>
                              <Clock className="w-3 h-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </>
                          )}
                        </Button>
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