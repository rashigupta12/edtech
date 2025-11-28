/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2"
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { AlertCircle, Calendar as CalendarIcon, Copy, Filter, Plus, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { useDebouncedCallback } from "use-debounce";

const fetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
  }
}).then((res) => res.json());

type Coupon = {
  id: string;
  code: string;
  typeName: string;
  discountValue: number;
  discountType: "FIXED_AMOUNT" | "PERCENTAGE";
  usageCount: number;
  maxUsage: number | null;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  validUntil: string | null;
  createdAt: string;
};

type CouponType = {
  id: string;
  typeCode: string;
  typeName: string;
  discountType: "FIXED_AMOUNT" | "PERCENTAGE";
  maxDiscountLimit?: string;
};

const CouponRowSkeleton = () => (
  <tr className="animate-pulse">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
    ))}
  </tr>
);

export default function MyCouponsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showSidebar, setShowSidebar] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Form states
  const [selectedType, setSelectedType] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUsageCount, setMaxUsageCount] = useState("");
  const [validFrom, setValidFrom] = useState<Date | undefined>(undefined);
  const [validUntil, setValidUntil] = useState<Date | undefined>(undefined);
  const [previewCode, setPreviewCode] = useState("");
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [maxUsageError, setMaxUsageError] = useState("");

  // Get the API URL with current filters and cache busting
  const couponsApiUrl = useMemo(() => {
    const timestamp = Date.now();
    return `/api/jyotishi/coupons?page=${page}&limit=${limit}&status=${statusFilter}&_=${timestamp}`;
  }, [page, limit, statusFilter]);

  // SWR for coupons with enhanced configuration
  const { data: couponsData, isLoading, mutate } = useSWR(
    couponsApiUrl,
    fetcher,
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true,
      dedupingInterval: 0, // Disable deduping for immediate updates
      refreshInterval: 0, // No auto-refresh, we'll control it manually
    }
  );

  // SWR for coupon types (cached)
  const { data: typesData } = useSWR("/api/jyotishi/coupon-types", fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });

  const coupons: Coupon[] = useMemo(() => {
    return (couponsData?.coupons || []).map((c: any) => {
      const isExpired = c.validUntil && new Date(c.validUntil) < new Date();
      const isActive = c.isActive && !isExpired;
      return {
        id: c.id,
        code: c.code,
        typeName: c.typeName,
        discountValue: Number(c.discountValue),
        discountType: c.discountType,
        usageCount: c.currentUsageCount || 0,
        maxUsage: c.maxUsageCount,
        status: isActive ? "ACTIVE" : isExpired ? "EXPIRED" : "INACTIVE",
        validUntil: c.validUntil,
        createdAt: c.createdAt,
      };
    });
  }, [couponsData]);

  const types: CouponType[] = typesData?.couponTypes || [];

  const filteredCoupons = useMemo(() => {
    return coupons.filter(
      (c) =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.typeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [coupons, searchTerm]);

  const totalPages = Math.ceil((couponsData?.total || 0) / limit);

  // Validation function for max usage
  const validateMaxUsage = useCallback((value: string) => {
    if (value && Number(value) < 1) {
      setMaxUsageError("Max usage must be at least 1");
    } else {
      setMaxUsageError("");
    }
  }, []);

  // Stable handler for max usage changes
  const handleMaxUsageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxUsageCount(value);
    
    // Only validate if there's a value, don't validate empty/cleared field immediately
    if (value === "") {
      setMaxUsageError("");
    } else {
      validateMaxUsage(value);
    }
  }, [validateMaxUsage]);

  // Stable handler for discount value changes
  const handleDiscountValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscountValue(e.target.value);
  }, []);

  // Debounced preview with stable dependencies
  const debouncedPreview = useDebouncedCallback(
    async (type: string, value: string) => {
      if (!type || !value) {
        setPreviewCode("");
        return;
      }
      try {
        const res = await fetch("/api/jyotishi/coupons/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            couponTypeId: type, 
            discountValue: Number(value) 
          }),
        });
        const data = await res.json();
        setPreviewCode(data.couponCode || "");
      } catch {
        setPreviewCode("");
      }
    },
    500
  );

  // Stable preview effect
  useEffect(() => {
    debouncedPreview(selectedType, discountValue);
    
    return () => {
      debouncedPreview.cancel();
    };
  }, [selectedType, discountValue, debouncedPreview]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    // Clear all SWR cache for coupon endpoints
    await globalMutate(
      key => typeof key === 'string' && key.startsWith('/api/jyotishi/coupons'),
      undefined,
      { revalidate: true }
    );
    
    // Also revalidate the current view
    await mutate();
  }, [mutate]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !discountValue || !validFrom || !validUntil) return;

    // Validate max usage
    if (maxUsageCount && Number(maxUsageCount) < 1) {
      setMaxUsageError("Max usage must be at least 1");
      return;
    }

    const selectedTypeObj = types.find((t) => t.id === selectedType);
    if (selectedTypeObj?.maxDiscountLimit) {
      const max = Number(selectedTypeObj.maxDiscountLimit);
      const entered = Number(discountValue);
      if (entered > max) {
        Swal.fire({
          icon: 'warning',
          title: 'Discount Limit Exceeded',
          text: `Maximum allowed discount: ${max}${selectedTypeObj.discountType === "PERCENTAGE" ? "%" : "₹"}`,
          confirmButtonColor: '#3085d6',
        });
        return;
      }
    }

    setCreatingCoupon(true);
    try {
      const res = await fetch("/api/jyotishi/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponTypeId: selectedType,
          discountValue: Number(discountValue),
          maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null,
          validFrom: validFrom.toISOString(),
          validUntil: validUntil.toISOString(),
        }),
      });

      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Coupon Created!',
          text: 'Your coupon has been created successfully',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Close sidebar
        setShowSidebar(false);
        
        // Reset form
        setSelectedType("");
        setDiscountValue("");
        setMaxUsageCount("");
        setValidFrom(undefined);
        setValidUntil(undefined);
        setPreviewCode("");
        setMaxUsageError("");
        
        // Force refresh with multiple strategies
        await forceRefresh();
        
        // Additional forced revalidation after a short delay
        setTimeout(() => {
          forceRefresh();
        }, 100);
      } else {
        const err = await res.json();
        Swal.fire({
          icon: 'error',
          title: 'Creation Failed',
          text: err.error || 'Failed to create coupon',
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to create coupon. Please try again.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setCreatingCoupon(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      await Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: `Coupon code copied to clipboard`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Copy Failed',
        text: 'Failed to copy coupon code',
        confirmButtonColor: '#d33',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "INACTIVE": return "bg-slate-100 text-slate-700 border-slate-200";
      case "EXPIRED": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const selectedTypeObj = types.find((t) => t.id === selectedType);
  const isDiscountExceeded = selectedTypeObj?.maxDiscountLimit
    ? Number(discountValue) > Number(selectedTypeObj.maxDiscountLimit)
    : false;

  return (
    <div className="p-4 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-blue-700">My Coupons</h2>
          <p className="text-gray-600 mt-1">Create and manage discount coupons.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by code or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowSidebar(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            <Plus className="h-4 w-4" /> Create Coupon
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <table className="w-full">
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <CouponRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No coupons found. <button onClick={() => setShowSidebar(true)} className="text-blue-600 underline">Create one!</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Discount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Usage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Valid Until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-blue-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded border">
                          {coupon.code}
                        </code>
                        <Button size="icon" variant="ghost" onClick={() => copyCode(coupon.code)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{coupon.typeName}</td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${coupon.discountType === "PERCENTAGE" ? "text-amber-600" : "text-blue-600"}`}>
                        {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `₹${coupon.discountValue.toLocaleString("en-IN")}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-semibold">{coupon.usageCount}</span>
                      {coupon.maxUsage ? <span className="text-gray-500"> / {coupon.maxUsage}</span> : <span className="text-gray-400 text-xs ml-1">(unlimited)</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(coupon.status)}`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString("en-IN") : "No expiry"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-3 border-t">
            <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <Button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Create New Coupon</h2>
                  <button onClick={() => setShowSidebar(false)} className="text-white p-1 rounded-lg hover:bg-blue-800">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleCreateCoupon} className="space-y-6">
                  {/* Type */}
                  <div>
                    <Label>Coupon Type</Label>
                    <Select value={selectedType} onValueChange={setSelectedType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex justify-between w-full gap-3">
                              <span>{t.typeCode} - {t.typeName}</span>
                              <span className={`text-xs font-medium px-2 py-1 rounded ${t.discountType === "FIXED_AMOUNT" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                                {t.discountType === "FIXED_AMOUNT" ? "₹" : "%"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Discount */}
                  <div>
                    <Label>
                      Discount Value {selectedTypeObj?.discountType === "PERCENTAGE" ? <span className="text-amber-600">(%)</span> : <span className="text-blue-600">(₹)</span>}
                    </Label>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={handleDiscountValueChange}
                      placeholder={selectedTypeObj?.discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 500"}
                      className={isDiscountExceeded ? "border-rose-500" : ""}
                      required
                    />
                    {selectedTypeObj?.maxDiscountLimit && (
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500">Max: {selectedTypeObj.maxDiscountLimit}{selectedTypeObj.discountType === "PERCENTAGE" ? "%" : "₹"}</span>
                        {isDiscountExceeded && <span className="text-rose-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Exceeds limit</span>}
                      </div>
                    )}
                  </div>

                  {/* Max Usage */}
                  <div>
                    <Label>Max Usage (optional)</Label>
                    <Input 
                      type="number" 
                      value={maxUsageCount} 
                      onChange={handleMaxUsageChange}
                      placeholder="Unlimited" 
                      min="1"
                      className={maxUsageError ? "border-rose-500" : ""}
                    />
                    {maxUsageError && (
                      <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {maxUsageError}
                      </p>
                    )}
                  </div>

                  {/* Dates */}
                  <div>
                    <Label>Valid From *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validFrom ? format(validFrom, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent><Calendar mode="single" selected={validFrom} onSelect={setValidFrom} /></PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Valid Until *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validUntil ? format(validUntil, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent><Calendar mode="single" selected={validUntil} onSelect={setValidUntil} /></PopoverContent>
                    </Popover>
                  </div>

                  {/* Preview */}
                  {previewCode && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Preview Code</span>
                        <Button type="button" size="sm" variant="outline" onClick={() => copyCode(previewCode)}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <code className="text-lg font-mono font-bold text-blue-600 bg-white px-3 py-2 rounded border border-blue-200 inline-block">
                        {previewCode}
                      </code>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={creatingCoupon || isDiscountExceeded || !!maxUsageError}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg disabled:opacity-50 hover:from-blue-700 hover:to-blue-800 transition-all"
                  >
                    {creatingCoupon ? "Creating..." : "Create Coupon"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}