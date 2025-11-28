/*eslint-disable @typescript-eslint/no-explicit-any*/
"use client";

import { ImageUpload } from "@/components/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  FileText,
  Hash,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  User,
  UserCheck,
  UserX,
  Wallet,
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

type Jyotishi = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  commissionRate: number;
  jyotishiCode: string;
  bio?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankAccountHolderName?: string | null;
  bankName?: string | null;
  bankBranchName?: string | null;
  cancelledChequeImage?: string | null;
  panNumber?: string | null;
  isActive: boolean;
  createdAt: string;
};

type CommissionStats = {
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  totalSales: number;
};

type RecentCommission = {
  id: string;
  saleAmount: number;
  commissionAmount: number;
  status: "PENDING" | "PAID";
  createdAt: string;
  courseName?: string | null;
  studentName?: string | null;
};

export default function ViewJyotishiPage() {
  const params = useParams();
  const router = useRouter();
  const [jyotishi, setJyotishi] = useState<Jyotishi | null>(null);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [recentCommissions, setRecentCommissions] = useState<RecentCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    commissionRate: "",
    jyotishiCode: "",
    bio: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountHolderName: "",
    bankName: "",
    bankBranchName: "",
    cancelledChequeImage: "",
    panNumber: "",
  });

  useEffect(() => {
    if (params.id) fetchJyotishi();
  }, [params.id]);

  const fetchJyotishi = async () => {
    try {
      const res = await fetch(`/api/admin/jyotishi/${params.id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();

      setJyotishi(data.jyotishi);
      setStats(data.stats);
      setRecentCommissions(data.recentCommissions || []);

      if (data.jyotishi) {
        setFormData({
          name: data.jyotishi.name || "",
          email: data.jyotishi.email || "",
          mobile: data.jyotishi.mobile || "",
          commissionRate: data.jyotishi.commissionRate?.toString() || "",
          jyotishiCode: data.jyotishi.jyotishiCode || "",
          bio: data.jyotishi.bio || "",
          bankAccountNumber: data.jyotishi.bankAccountNumber || "",
          bankIfscCode: data.jyotishi.bankIfscCode || "",
          bankAccountHolderName: data.jyotishi.bankAccountHolderName || "",
          bankName: data.jyotishi.bankName || "",
          bankBranchName: data.jyotishi.bankBranchName || "",
          cancelledChequeImage: data.jyotishi.cancelledChequeImage || "",
          panNumber: data.jyotishi.panNumber || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      const hasChanges = JSON.stringify({
        name: jyotishi?.name || "",
        mobile: jyotishi?.mobile || "",
        commissionRate: jyotishi?.commissionRate?.toString() || "",
        jyotishiCode: jyotishi?.jyotishiCode || "",
        bio: jyotishi?.bio || "",
        bankAccountNumber: jyotishi?.bankAccountNumber || "",
        bankIfscCode: jyotishi?.bankIfscCode || "",
        bankAccountHolderName: jyotishi?.bankAccountHolderName || "",
        bankName: jyotishi?.bankName || "",
        bankBranchName: jyotishi?.bankBranchName || "",
        cancelledChequeImage: jyotishi?.cancelledChequeImage || "",
        panNumber: jyotishi?.panNumber || "",
      }) !== JSON.stringify(formData);

      if (hasChanges) {
        Swal.fire({
          title: 'Discard Changes?',
          text: "You have unsaved changes that will be lost.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, discard!',
          cancelButtonText: 'Continue editing'
        }).then((result) => {
          if (result.isConfirmed) {
            resetForm();
            setIsEditing(false);
          }
        });
        return;
      }
    }
    setIsEditing(!isEditing);
  };

  const resetForm = () => {
    if (jyotishi) {
      setFormData({
        name: jyotishi.name || "",
        email: jyotishi.email || "",
        mobile: jyotishi.mobile || "",
        commissionRate: jyotishi.commissionRate?.toString() || "",
        jyotishiCode: jyotishi.jyotishiCode || "",
        bio: jyotishi.bio || "",
        bankAccountNumber: jyotishi.bankAccountNumber || "",
        bankIfscCode: jyotishi.bankIfscCode || "",
        bankAccountHolderName: jyotishi.bankAccountHolderName || "",
        bankName: jyotishi.bankName || "",
        bankBranchName: jyotishi.bankBranchName || "",
        cancelledChequeImage: jyotishi.cancelledChequeImage || "",
        panNumber: jyotishi.panNumber || "",
      });
    }
  };

  const handleSave = async () => {
    if (!jyotishi) return;

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim() || null,
        commissionRate: Number(formData.commissionRate),
        jyotishiCode: formData.jyotishiCode,
        bio: formData.bio.trim() || null,
        bankAccountNumber: formData.bankAccountNumber.trim() || null,
        bankIfscCode: formData.bankIfscCode.trim().toUpperCase() || null,
        bankAccountHolderName: formData.bankAccountHolderName.trim() || null,
        bankName: formData.bankName.trim() || null,
        bankBranchName: formData.bankBranchName.trim() || null,
        cancelledChequeImage: formData.cancelledChequeImage || null,
        panNumber: formData.panNumber.trim().toUpperCase() || null,
      };

      const res = await fetch(`/api/admin/jyotishi/${jyotishi.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setJyotishi(updatedData.jyotishi);
        setIsEditing(false);
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Astrologer details updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update');
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Could not save changes',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    const result = await Swal.fire({
      title: 'Deactivate Account?',
      text: "This astrologer will no longer receive leads or commissions.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, Deactivate',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/jyotishi/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        Swal.fire('Deactivated!', 'Account has been deactivated.', 'success');
        router.push("/dashboard/admin/agent");
      }
    } catch {
      Swal.fire('Error', 'Failed to deactivate account', 'error');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!jyotishi) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Astrologer Not Found</h2>
        <Button asChild>
          <Link href="/dashboard/admin/agent">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
          </Link>
        </Button>
      </div>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="relative py-8 mb-8 bg-gradient-to-r from-blue-50 to-amber-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard/admin/agent" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" /> Back to Astrologers
              </Link>
              <Badge variant="outline" className="bg-white">ADMIN VIEW</Badge>
            </div>

            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-amber-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                {jyotishi.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="text-3xl font-bold h-14"
                    placeholder="Full Name"
                  />
                ) : (
                  <h1 className="text-4xl font-bold text-gray-900">{jyotishi.name}</h1>
                )}
                <div className="flex items-center gap-6 mt-2 text-gray-600">
                  <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {jyotishi.email}</span>
                  <span className="flex items-center gap-2"><Hash className="h-4 w-4" /> {jyotishi.jyotishiCode}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Badge variant={jyotishi.isActive ? "default" : "secondary"} className={jyotishi.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {jyotishi.isActive ? <><UserCheck className="h-3 w-3 mr-1" /> Active</> : <><UserX className="h-3 w-3 mr-1" /> Inactive</>}
              </Badge>
              <Badge className="bg-amber-100 text-amber-800">Commission: {jyotishi.commissionRate}%</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Info */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Astrologer Code</Label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg font-mono text-lg">
                      <Hash className="h-5 w-5 text-blue-600" />
                      <span className="font-bold uppercase">{jyotishi.jyotishiCode}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    {isEditing ? (
                      <Input value={formData.mobile} onChange={(e) => handleInputChange("mobile", e.target.value)} />
                    ) : (
                      <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-blue-600" /> <span>{jyotishi.mobile || "—"}</span></div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio / Introduction</Label>
                  {isEditing ? (
                    <Textarea
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Brief introduction..."
                    />
                  ) : (
                    <p className="text-gray-700">{jyotishi.bio || "No bio provided"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Banking & Tax Details */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100">
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Banking & Tax Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Account Holder Name</Label>
                    {isEditing ? (
                      <Input value={formData.bankAccountHolderName} onChange={(e) => handleInputChange("bankAccountHolderName", e.target.value)} />
                    ) : (
                      <p className="font-medium">{jyotishi.bankAccountHolderName || "—"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    {isEditing ? (
                      <Input value={formData.bankAccountNumber} onChange={(e) => handleInputChange("bankAccountNumber", e.target.value)} className="font-mono" />
                    ) : (
                      <code className="bg-amber-50 px-4 py-2 rounded border font-mono">{jyotishi.bankAccountNumber || "—"}</code>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Building className="h-4 w-4" /> Bank Name</Label>
                    {isEditing ? (
                      <Input value={formData.bankName} onChange={(e) => handleInputChange("bankName", e.target.value)} />
                    ) : (
                      <p>{jyotishi.bankName || "—"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Branch Name</Label>
                    {isEditing ? (
                      <Input value={formData.bankBranchName} onChange={(e) => handleInputChange("bankBranchName", e.target.value)} />
                    ) : (
                      <p>{jyotishi.bankBranchName || "—"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    {isEditing ? (
                      <Input value={formData.bankIfscCode} onChange={(e) => handleInputChange("bankIfscCode", e.target.value.toUpperCase())} className="font-mono uppercase" />
                    ) : (
                      <code className="bg-amber-50 px-4 py-2 rounded border font-mono uppercase">{jyotishi.bankIfscCode || "—"}</code>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>PAN Number</Label>
                    {isEditing ? (
                      <Input value={formData.panNumber} onChange={(e) => handleInputChange("panNumber", e.target.value.toUpperCase())} className="font-mono uppercase" />
                    ) : (
                      <code className="bg-amber-50 px-4 py-2 rounded border font-mono uppercase">{jyotishi.panNumber || "—"}</code>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Cancelled Cheque Image</Label>
                  {isEditing ? (
                    <ImageUpload
                      value={formData.cancelledChequeImage}
                      onChange={(url) => handleInputChange("cancelledChequeImage", url)}
                      label="Upload Cancelled Cheque"
                      isThumbnail={false}
                    />
                  ) : jyotishi.cancelledChequeImage ? (
                    <a href={jyotishi.cancelledChequeImage} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={jyotishi.cancelledChequeImage} alt="Cancelled Cheque" className="max-h-48 rounded-lg border shadow" />
                    </a>
                  ) : (
                    <p className="text-gray-500 italic">No image uploaded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Commissions */}
            {recentCommissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Commissions</CardTitle>
                  <CardDescription>Last {recentCommissions.length} transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Sale</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentCommissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{formatDate(c.createdAt)}</TableCell>
                          <TableCell>{c.courseName || "—"}</TableCell>
                          <TableCell>{c.studentName || "—"}</TableCell>
                          <TableCell>{formatCurrency(c.saleAmount)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(c.commissionAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === "PAID" ? "default" : "secondary"} className={c.status === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                              {c.status === "PAID" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                              {c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle>Commission Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-4xl font-bold text-blue-600">{formatCurrency(stats?.totalCommission || 0)}</p>
                  <p className="text-sm text-blue-700 mt-1">Total Earned</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-amber-50 rounded-lg border">
                    <Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                    <p className="font-bold text-amber-700">{formatCurrency(stats?.pendingCommission || 0)}</p>
                    <p className="text-xs">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="font-bold text-green-700">{formatCurrency(stats?.paidCommission || 0)}</p>
                    <p className="text-xs">Paid</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-gray-600">Total Sales</span>
                  <span className="font-bold">{stats?.totalSales || 0}</span>
                </div>

                <Separator />

                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button onClick={handleEditToggle} variant="outline" className="w-full">
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEditToggle} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Edit className="h-4 w-4 mr-2" /> Edit Details
                    </Button>
                  )}

                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/jyotishi/${jyotishi.id}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" /> View Public Profile
                    </Link>
                  </Button>

                  <Button variant="destructive" onClick={handleDeactivate} disabled={!jyotishi.isActive} className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" /> Deactivate Account
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500 mt-6">
                  Joined on {formatDate(jyotishi.createdAt)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}