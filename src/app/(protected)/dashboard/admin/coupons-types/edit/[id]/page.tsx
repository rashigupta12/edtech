// src/app/(protected)/dashboard/admin/coupons-types/edit/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CouponType = {
  id: string;
  typeCode: string;
  typeName: string;
  description: string;
  discountType: string;
  maxDiscountLimit: string;
};

export default function EditCouponTypePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [couponType, setCouponType] = useState<CouponType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCouponType = useCallback(async () => {
    try {
      setLoading(true);
      // Add cache busting
      const cacheBuster = `?_=${new Date().getTime()}`;
      const res = await fetch(`/api/admin/coupon-types/${id}${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!res.ok) {
        throw new Error("Coupon type not found");
      }
      
      const data = await res.json();
      setCouponType(data.couponType);
    } catch (error) {
      console.error("Failed to fetch coupon type:", error);
      Swal.fire({
        icon: 'error',
        title: 'Not Found',
        text: 'Coupon type not found',
      });
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      fetchCouponType();
    }
  }, [id, fetchCouponType]);

  const handleSave = async () => {
    if (!couponType) return;
    
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/coupon-types/${couponType.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(couponType),
      });

      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Coupon type updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Force router refresh before navigation
        router.refresh();
        router.push("/dashboard/admin/coupons-types");
      } else {
        const error = await res.json();
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: error.error || 'Failed to update coupon type',
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Error updating coupon type',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!couponType) {
    return (
      <div className="p-4 text-center">
        <p>Coupon type not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Coupon Type</h1>
          <p className="text-muted-foreground">Editing: {couponType.typeName}</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="typeCode">Type Code (2 digits)</Label>
                <Input
                  id="typeCode"
                  value={couponType.typeCode}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Type code cannot be changed after creation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeName">Type Name *</Label>
                <Input
                  id="typeName"
                  value={couponType.typeName}
                  onChange={(e) =>
                    setCouponType({ ...couponType, typeName: e.target.value })
                  }
                  placeholder="e.g., EARLYBIRD, FESTIVE, STUDENT"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={couponType.description}
                onChange={(e) =>
                  setCouponType({ ...couponType, description: e.target.value })
                }
                placeholder="Brief description of this coupon type..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discount Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Discount Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type *</Label>
                <Select
                  value={couponType.discountType}
                  onValueChange={(value) =>
                    setCouponType({ ...couponType, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_AMOUNT">Fixed Amount (₹)</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {couponType.discountType === "PERCENTAGE"
                    ? "Jyotishis can set percentage discounts"
                    : "Jyotishis can set fixed amount discounts"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDiscountLimit">
                  Max Discount Limit *
                  {couponType.discountType === "PERCENTAGE" ? " (%)" : " (₹)"}
                </Label>
                <Input
                  id="maxDiscountLimit"
                  type="number"
                  value={couponType.maxDiscountLimit}
                  onChange={(e) =>
                    setCouponType({ ...couponType, maxDiscountLimit: e.target.value })
                  }
                  placeholder={
                    couponType.discountType === "PERCENTAGE"
                      ? "e.g., 20 (for max 20%)"
                      : "e.g., 1000 (for max ₹1000)"
                  }
                  min="0"
                  max={couponType.discountType === "PERCENTAGE" ? "100" : undefined}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum {couponType.discountType === "PERCENTAGE" ? "percentage" : "amount"} Jyotishis can offer
                </p>
              </div>
            </div>

            {/* Example Preview */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Coupon Code Format:</p>
              <code className="text-sm font-mono">
                COUP[JyotishiCode]{couponType.typeCode}
                {couponType.discountType === "PERCENTAGE" ? "[PercentValue]" : "[AmountValue]"}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                e.g., <span className="font-mono">COUPJD001{couponType.typeCode}500</span> - 
                John Doe&apos;s coupon with type {couponType.typeCode}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 pt-4">
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
  );
}