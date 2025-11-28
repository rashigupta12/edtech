/*eslint-disable  @typescript-eslint/no-explicit-any*/
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  Calendar,
  CreditCard,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  Users
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "USER" | "JYOTISHI";
  gst?: string | null;
  isActive: boolean;
  createdAt: string;
  addresses: { line1: string; city: string; state: string; pincode: string }[];
}

interface Enrollment {
  id: string;
  course: { id: string; title: string; slug: string };
  status: string;
  enrolledAt: string;
  certificateIssued: boolean;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  createdAt: string;
  invoiceId: string;
}

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [userRes, enrollRes, paymentRes] = await Promise.all([
          fetch(`/api/admin/users/${id}`),
          fetch(`/api/admin/enrollments?userId=${id}`),
          fetch(`/api/admin/payments?userId=${id}`),
        ]);

        // Parse JSON from all responses
        const [userDataRes, enrollDataRes, paymentDataRes] = await Promise.all([
          userRes.json(),
          enrollRes.json(),
          paymentRes.json(),
        ]);

        // Access data from parsed JSON (not from Response)
        const userData = userDataRes.user;
        const enrollData = enrollDataRes.enrollments;
        const paymentData = paymentDataRes.payments;

        // Map API response to UI model
        const mappedUser: UserDetail = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.mobile || null,
          role: userData.role,
          gst: userData.gstNumber || null,
          isActive: userData.emailVerified ? true : false, // or use isActive if exists
          createdAt: userData.createdAt,
          addresses: [], // populate if API sends addresses
        };

        // Enrollments mapping
        const mappedEnrollments: Enrollment[] = (enrollData || []).map(
          (e: any) => ({
            id: e.id,
            course: {
              id: e.courseId,
              title: e.course?.title || `Course #${e.courseId.slice(0, 8)}`, // fallback title
              slug: e.course?.slug ,
            },
            status: e.status,
            enrolledAt: e.enrolledAt,
            certificateIssued: e.certificateIssued || false,
          })
        );

        // Payments mapping
        const mappedPayments: Payment[] = (paymentData || []).map((p: any) => ({
          id: p.id,
          amount: Number(p.finalAmount || p.amount),
          currency: p.currency,
          status: p.status,
          method: p.paymentMethod || "Razorpay",
          createdAt: p.createdAt,
          invoiceId: p.invoiceNumber,
        }));

        setUser(mappedUser);
        setEnrollments(mappedEnrollments);
        setPayments(mappedPayments);
      } catch (err) {
        console.error("Failed to load user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">User not found.</p>
        <Link href="/dashboard/admin/users">
          <Button variant="outline" className="mt-4">
            Back to Users
          </Button>
        </Link>
      </div>
    );
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    user.role === "ADMIN"
                      ? "default"
                      : user.role === "JYOTISHI"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {user.role}
                </Badge>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            {/* <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/admin/users/edit/${user.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
            </div> */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone || "—"}</span>
            </div>
            {user.gst && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>GST: {user.gst}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Joined: {new Date(user.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
          </div>

          {user.addresses.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Addresses
              </h4>
              <div className="space-y-2">
                {user.addresses.map((addr, i) => (
                  <div key={i} className="text-sm text-muted-foreground pl-6">
                    {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="enrollments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="enrollments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Enrollments ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments ({payments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No enrollments yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Course
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Enrolled
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Certificate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {enrollments.map((e) => (
                        <tr key={e.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/admin/courses/${e.course.slug}`}
                              className="font-medium hover:underline"
                            >
                              {e.course.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">{e.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(e.enrolledAt).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            {e.certificateIssued ? (
                              <Award className="h-5 w-5 text-green-600" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No payments recorded.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Invoice
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Method
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Date
                        </th>
                        {/* <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                          Action
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-mono text-sm">
                            {p.invoiceId}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            ₹{p.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                p.status === "COMPLETED"
                                  ? "default"
                                  : p.status === "PENDING"
                                  ? "destructive" // or "secondary" if you don’t have a 'destructive' variant
                                  : "secondary"
                              }
                            >
                              {p.status === "PENDING" ? "FAILED" : p.status}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-sm">{p.method}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString("en-IN")}
                          </td>
                          {/* <td className="px-4 py-3 text-right">
                            <Link href={`/dashboard/admin/payments/${p.id}`}>
                              <Button size="sm" variant="ghost">
                                View
                              </Button>
                            </Link>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
