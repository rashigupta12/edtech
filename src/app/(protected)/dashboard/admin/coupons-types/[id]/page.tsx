// src/app/(protected)/dashboard/admin/coupon-types/[id]/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Swal from 'sweetalert2';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  FileText,
  Hash,
  Ticket,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Coupon = {
  id: string;
  code: string;
  discountValue: string;
  isActive: boolean;
  currentUsageCount: number;
  jyotishiName: string;
  jyotishiCode: string | null;
  createdAt: string;
};

type CouponType = {
  id: string;
  typeCode: string;
  typeName: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  maxDiscountLimit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  couponType: CouponType;
  coupons: Coupon[];
};

export default function ViewCouponTypePage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchCouponType();
  }, [params.id]);

const fetchCouponType = async () => {
  try {
    const res = await fetch(`/api/admin/coupon-types/${params.id}`);
    if (!res.ok) throw new Error("Not found");
    const json: ApiResponse = await res.json();
    setData(json);
  } catch (err) {
    console.error("Fetch error:", err);
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to load coupon type',
    });
  } finally {
    setLoading(false);
  }
};


 const handleDeactivate = async () => {
  if (!data?.couponType) return;

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You want to deactivate this coupon type?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, deactivate!',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/api/admin/coupon-types/${data.couponType.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });

    if (res.ok) {
      await Swal.fire({
        icon: 'success',
        title: 'Deactivated!',
        text: 'Coupon type deactivated successfully',
      });
      router.push("/dashboard/admin/coupons-types");
    } else {
      const err = await res.json();
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.error || 'Failed to deactivate coupon type',
      });
    }
  } catch {
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Error deactivating coupon type',
    });
  }
};


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data?.couponType) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Coupon Type Not Found</h2>
        <Button asChild>
          <Link href="/dashboard/admin/coupons-types">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>
      </div>
    );
  }

  const { couponType, coupons } = data;
  const activeCoupons = coupons.filter(c => c.isActive).length;
  const totalCoupons = coupons.length;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/coupons-types">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{couponType.typeName}</h1>
            <p className="text-muted-foreground">Type Code: <code className="font-mono">{couponType.typeCode}</code></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={couponType.isActive ? "default" : "secondary"}>
            {couponType.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline">
            {couponType.discountType === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Type Code</Label>
                  <div className="mt-1 font-mono text-lg font-bold p-2 bg-muted rounded">
                    {couponType.typeCode}
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Max Discount</Label>
                  <div className="mt-1 font-mono text-lg font-bold p-2 bg-muted rounded">
                    {couponType.discountType === "PERCENTAGE"
                      ? `${couponType.maxDiscountLimit}%`
                      : `₹${parseFloat(couponType.maxDiscountLimit).toLocaleString("en-IN")}`
                    }
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm">Description</Label>
                <p className="mt-1 text-muted-foreground">
                  {couponType.description || "No description provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Coupon Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Coupon Code Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                COUP[JyotishiCode]{couponType.typeCode}
                {couponType.discountType === "PERCENTAGE" ? "[XX]" : "[XXXX]"}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Examples from your data:
              </p>
              <div className="mt-3 space-y-2">
                {coupons.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-background border rounded">
                    <div>
                      <code className="font-mono font-bold">{c.code}</code>
                      <span className="text-xs text-muted-foreground ml-2">
                        by <strong>{c.jyotishiName}</strong>
                        {c.jyotishiCode && ` (Code: ${c.jyotishiCode})`}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {couponType.discountType === "PERCENTAGE"
                          ? `${c.discountValue}%`
                          : `₹${parseFloat(c.discountValue).toLocaleString("en-IN")}`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.currentUsageCount} uses
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Coupons */}
          {coupons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Generated Coupons ({totalCoupons})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coupons.slice(0, 5).map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={coupon.isActive ? "default" : "secondary"} className="text-xs">
                          {coupon.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div>
                          <div className="font-mono font-semibold">{coupon.code}</div>
                          <div className="text-xs text-muted-foreground">
                            {coupon.jyotishiName}
                            {coupon.jyotishiCode && ` • Code: ${coupon.jyotishiCode}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {couponType.discountType === "PERCENTAGE"
                            ? `${coupon.discountValue}%`
                            : `₹${parseFloat(coupon.discountValue).toLocaleString("en-IN")}`
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {coupon.currentUsageCount} uses
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Coupons</span>
                <span className="font-bold">{totalCoupons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="font-bold text-green-600">{activeCoupons}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start">
                <Link href={`/dashboard/admin/coupons-types/edit/${couponType.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Type
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDeactivate}
                disabled={!couponType.isActive}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deactivate Type
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(couponType.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">{formatDate(couponType.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <code className="font-mono bg-muted px-1 rounded">
                  {couponType.id.slice(0, 8)}...
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount Type</span>
                <code className="font-mono bg-muted px-1 rounded">
                  {couponType.discountType}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}