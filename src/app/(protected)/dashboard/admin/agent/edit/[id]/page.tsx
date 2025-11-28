/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";

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
};

export default function EditJyotishiPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [jyotishi, setJyotishi] = useState<Jyotishi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchJyotishi();
    }
  }, [id]);

  const fetchJyotishi = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/jyotishi/${id}`);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch Jyotishi");
      }

      const data = await res.json();
      setJyotishi(data.jyotishi);
    } catch (err: any) {
      console.error("Failed to fetch jyotishi:", err);
      setError(err.message || "Jyotishi not found");
      Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: err.message || "Failed to load jyotishi details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!jyotishi) return;

    // Validation
    if (!jyotishi.name.trim()) {
      Swal.fire({ icon: "warning", title: "Missing Name", text: "Name is required" });
      return;
    }
    if (!jyotishi.mobile.trim()) {
      Swal.fire({ icon: "warning", title: "Missing Mobile", text: "Mobile number is required" });
      return;
    }
    if (jyotishi.commissionRate < 0 || jyotishi.commissionRate > 100) {
      Swal.fire({
        icon: "error",
        title: "Invalid Commission",
        text: "Commission rate must be between 0 and 100",
      });
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(jyotishi.mobile.replace(/[\s\-\(\)]/g, ""))) {
      Swal.fire({
        icon: "error",
        title: "Invalid Mobile",
        text: "Please enter a valid 10-digit mobile number starting with 6-9",
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/admin/jyotishi/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: jyotishi.name.trim(),
          mobile: jyotishi.mobile.trim(),
          commissionRate: Number(jyotishi.commissionRate),
          jyotishiCode: jyotishi.jyotishiCode,
          bio: jyotishi.bio?.trim() || null,
          bankAccountNumber: jyotishi.bankAccountNumber?.trim() || null,
          bankIfscCode: jyotishi.bankIfscCode?.trim().toUpperCase() || null,
          bankAccountHolderName: jyotishi.bankAccountHolderName?.trim() || null,
          bankName: jyotishi.bankName?.trim() || null,
          bankBranchName: jyotishi.bankBranchName?.trim() || null,
          cancelledChequeImage: jyotishi.cancelledChequeImage || null,
          panNumber: jyotishi.panNumber?.trim().toUpperCase() || null,
          isActive: jyotishi.isActive,
        }),
      });

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Jyotishi updated successfully!",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/agent");
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to update Jyotishi");
      }
    } catch (err: any) {
      console.error("Update error:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "An error occurred while updating",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-96">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && !jyotishi) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  if (!jyotishi) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Astrologer</h1>
            <p className="text-gray-600">Update astrologer profile, banking, and commission details</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          {/* Personal Info */}
          <Card className="border-gray-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={jyotishi.name}
                  onChange={(e) =>
                    setJyotishi({ ...jyotishi, name: e.target.value })
                  }
                  placeholder="Pandit Rajesh Sharma"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={jyotishi.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  value={jyotishi.mobile}
                  onChange={(e) =>
                    setJyotishi({ ...jyotishi, mobile: e.target.value })
                  }
                  placeholder="9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jyotishiCode">Astrologer Code</Label>
                <Input
                  id="jyotishiCode"
                  value={jyotishi.jyotishiCode}
                  disabled
                  className="bg-gray-100 font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground">Code is fixed and cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={jyotishi.commissionRate}
                  onChange={(e) =>
                    setJyotishi({
                      ...jyotishi,
                      commissionRate: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="bio">Bio / Introduction</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={jyotishi.bio || ""}
                  onChange={(e) =>
                    setJyotishi({ ...jyotishi, bio: e.target.value })
                  }
                  placeholder="Brief introduction about the astrologer..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Banking & Tax */}
          <Card className="border-gray-200">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100">
              <CardTitle>Banking & Tax Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="bankAccountHolderName">Account Holder Name</Label>
                <Input
                  id="bankAccountHolderName"
                  value={jyotishi.bankAccountHolderName || ""}
                  onChange={(e) =>
                    setJyotishi({
                      ...jyotishi,
                      bankAccountHolderName: e.target.value || null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  value={jyotishi.bankAccountNumber || ""}
                  onChange={(e) =>
                    setJyotishi({
                      ...jyotishi,
                      bankAccountNumber: e.target.value || null,
                    })
                  }
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankIfscCode">IFSC Code</Label>
                <Input
                  id="bankIfscCode"
                  value={jyotishi.bankIfscCode || ""}
                  onChange={(e) =>
                    setJyotishi({
                      ...jyotishi,
                      bankIfscCode: e.target.value.toUpperCase() || null,
                    })
                  }
                  placeholder="SBIN0001234"
                  className="uppercase font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={jyotishi.bankName || ""}
                  onChange={(e) =>
                    setJyotishi({ ...jyotishi, bankName: e.target.value || null })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankBranchName">Branch Name</Label>
                <Input
                  id="bankBranchName"
                  value={jyotishi.bankBranchName || ""}
                  onChange={(e) =>
                    setJyotishi({
                      ...jyotishi,
                      bankBranchName: e.target.value || null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number</Label>
                <Input
                  id="panNumber"
                  value={jyotishi.panNumber || ""}
                  onChange={(e) =>
                    setJyotishi({
                      ...jyotishi,
                      panNumber: e.target.value.toUpperCase() || null,
                    })
                  }
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="uppercase font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Cancelled Cheque Image</Label>
                <ImageUpload
                  label="Cancelled Cheque"
                  value={jyotishi.cancelledChequeImage || ""}
                  onChange={(url) =>
                    setJyotishi({ ...jyotishi, cancelledChequeImage: url })
                  }
                  isThumbnail={false}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Upload a clear image of cancelled cheque (optional, can be updated)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{jyotishi.isActive ? "Active" : "Inactive"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {jyotishi.isActive
                      ? "Can receive leads & commissions"
                      : "Account deactivated"}
                  </p>
                </div>
                <Switch
                  checked={jyotishi.isActive}
                  onCheckedChange={(checked) =>
                    setJyotishi({ ...jyotishi, isActive: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}