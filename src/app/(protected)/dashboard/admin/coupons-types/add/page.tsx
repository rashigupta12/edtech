// src/app/(protected)/dashboard/admin/coupons-types/add/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/auth";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import React, { useEffect, useState } from "react";

export default function AddCouponTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCode, setLoadingCode] = useState(true);

  const [typeCode, setTypeCode] = useState("");
  const [typeName, setTypeName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("FIXED_AMOUNT");
  const [maxDiscountLimit, setMaxDiscountLimit] = useState("");
  const user = useCurrentUser();
  const adminId = user?.id;

  // Auto-fetch next available code on component mount
  useEffect(() => {
    fetchNextCode();
  }, []);

  const fetchNextCode = async () => {
    setLoadingCode(true);
    try {
      const res = await fetch("/api/admin/coupon-types/next-code");
      if (res.ok) {
        const data = await res.json();
        setTypeCode(data.nextCode || "");
      } else {
        const error = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.error || "Failed to generate type code",
        });
      }
    } catch (err) {
      console.error("Failed to fetch next code:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to generate type code. Please refresh the page.",
      });
    } finally {
      setLoadingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!typeCode) {
      Swal.fire({
        icon: "error",
        title: "Missing Code",
        text: "Type code is required. Please refresh the page if it didn't generate.",
      });
      return;
    }

    if (!typeName || !discountType || !maxDiscountLimit) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Please fill in all required fields.",
      });
      return;
    }

    setLoading(true);

    const payload = {
      typeCode,
      typeName: typeName.trim().toUpperCase(),
      description: description.trim() || null,
      discountType,
      maxDiscountLimit: parseFloat(maxDiscountLimit),
      adminId,
    };

    try {
      const res = await fetch("/api/admin/coupon-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Coupon type created successfully!",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/coupons-types");
      } else {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.error || "Failed to create coupon type",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/dashboard/admin/coupons-types"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Coupon Types
      </Link>

      <h1 className="text-2xl font-bold mb-2">Add New Coupon Type</h1>
      <p className="text-muted-foreground mb-6">
        Create a new coupon type template that agents can use to generate
        individual coupons.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="typeCode">Type Code * (Auto-generated)</Label>
                <div className="relative">
                  <Input
                    id="typeCode"
                    value={typeCode}
                    readOnly
                    placeholder={
                      loadingCode ? "Generating..." : "Auto-generated code"
                    }
                    className="bg-gray-50 font-mono text-lg font-bold pr-10"
                  />
                  {loadingCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {typeCode
                    ? `Next available code: ${typeCode}`
                    : "Code will be generated automatically"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeName">Type Name *</Label>
                <Input
                  id="typeName"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value.toUpperCase())}
                  placeholder="e.g., EARLYBIRD, FESTIVE, STUDENT"
                  required
                  className="uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_AMOUNT">
                      Fixed Amount (₹)
                    </SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {discountType === "PERCENTAGE"
                    ? "Agents can set percentage discounts (e.g., 10%, 20%)"
                    : "Agents can set fixed amount discounts (e.g., ₹500, ₹1000)"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDiscountLimit">
                  Max Discount Limit *
                  {discountType === "PERCENTAGE" ? " (%)" : " (₹)"}
                </Label>
                <Input
                  id="maxDiscountLimit"
                  type="number"
                  value={maxDiscountLimit}
                  onChange={(e) => setMaxDiscountLimit(e.target.value)}
                  placeholder={
                    discountType === "PERCENTAGE"
                      ? "e.g., 20 (for max 20%)"
                      : "e.g., 1000 (for max ₹1000)"
                  }
                  min="0"
                  max={discountType === "PERCENTAGE" ? "100" : undefined}
                  step={discountType === "PERCENTAGE" ? "1" : "0.01"}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {discountType === "PERCENTAGE"
                    ? "Maximum percentage agents can offer"
                    : "Maximum amount agents can discount"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading || loadingCode || !typeCode}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Coupon Type
              </>
            )}
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link href="/dashboard/admin/coupons-types">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
