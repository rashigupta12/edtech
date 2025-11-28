/*eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/dashboard/admin/coupons-types/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Edit,
  Eye,
  Filter,
  Percent,
  Plus,
  Search,
  Tag,
  ToggleLeft,
  ToggleRight,
  Users
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

type CouponType = {
  id: string;
  typeCode: string;
  typeName: string;
  description: string;
  discountType: string;
  maxDiscountLimit: number;
  isActive: boolean;
  createdAt: string;
  stats?: {
    totalCoupons: string;
    activeCoupons: string;
    totalUsage: string;
  };
};

export default function CouponTypesPage() {
  const [couponTypes, setCouponTypes] = useState<CouponType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState("ALL");

  // Use useCallback to memoize the fetch function
  const fetchCouponTypes = useCallback(async () => {
    try {
      setLoading(true);
      const baseUrl =
        discountTypeFilter === "ALL"
          ? "/api/admin/coupon-types"
          : `/api/admin/coupon-types?discountType=${discountTypeFilter}`;

      // Add cache busting parameter
      const cacheBuster = `${
        baseUrl.includes("?") ? "&" : "?"
      }_=${new Date().getTime()}`;
      const url = `${baseUrl}${cacheBuster}`;

      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const data = await res.json();

      const mapped: CouponType[] = (data.couponTypes || []).map((ct: any) => ({
        id: ct.id,
        typeCode: ct.typeCode,
        typeName: ct.typeName,
        description: ct.description || "",
        discountType: ct.discountType,
        maxDiscountLimit: Number(ct.maxDiscountLimit || 0),
        isActive: ct.isActive ?? true,
        createdAt: ct.createdAt,
        stats: ct.stats || {
          totalCoupons: "0",
          activeCoupons: "0",
          totalUsage: "0",
        },
      }));

      setCouponTypes(mapped);
    } catch (err) {
      console.error("Failed to fetch coupon types:", err);
      Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: "Failed to load coupon types. Please refresh the page.",
      });
    } finally {
      setLoading(false);
    }
  }, [discountTypeFilter]);

  // Fetch coupon types when component mounts or filter changes
  useEffect(() => {
    fetchCouponTypes();
  }, [fetchCouponTypes]);

  // Filter by search
  const filteredCouponTypes = couponTypes.filter(
    (ct) =>
      ct.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ct.typeCode.includes(searchTerm) ||
      ct.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const discountTypeOptions = ["ALL", "PERCENTAGE", "FIXED_AMOUNT"];



  // Toggle Active Status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const couponTypeToUpdate = couponTypes.find((ct) => ct.id === id);
    const action = currentStatus ? "deactivate" : "activate";

    const result = await Swal.fire({
      title: `Are you sure?`,
      html: `You are about to ${action} <strong>"${couponTypeToUpdate?.typeName}"</strong> coupon type.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: currentStatus ? "#d33" : "#3085d6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/coupon-types/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setCouponTypes((prev) =>
          prev.map((ct) =>
            ct.id === id ? { ...ct, isActive: !currentStatus } : ct
          )
        );
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Coupon type ${
            !currentStatus ? "activated" : "deactivated"
          } successfully`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Failed to update coupon type status",
        });
      }
    } catch (err) {
      console.error("Toggle error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while updating the status",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-blue-700 bg-clip-text text-transparent">
            Coupon Types Management
          </h2>
          <p className="text-gray-600 mt-2">
            Manage coupon type templates that agents can use to create
            individual coupons.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search coupon types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Discount Type Filter */}
          <Select
            value={discountTypeFilter}
            onValueChange={setDiscountTypeFilter}
          >
            <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {discountTypeOptions.map((dt) => (
                <SelectItem key={dt} value={dt} className="focus:bg-blue-50">
                  {dt === "ALL" ? "All Discount Types" : dt.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add Coupon Type Button */}
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg whitespace-nowrap"
          >
            <Link
              href="/dashboard/admin/coupons-types/add"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Coupon Type
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview - All cards in single row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Coupon Types
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {couponTypes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Percent className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600">
                Percentage Types
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  couponTypes.filter((ct) => ct.discountType === "PERCENTAGE")
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">
                Fixed Amount Types
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  couponTypes.filter((ct) => ct.discountType === "FIXED_AMOUNT")
                    .length
                }
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
              <p className="text-sm font-medium text-gray-600">Active Types</p>
              <p className="text-2xl font-bold text-gray-900">
                {couponTypes.filter((ct) => ct.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading Coupon Types...</p>
          </div>
        ) : filteredCouponTypes.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Coupon Types found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || discountTypeFilter !== "ALL"
                ? "Try adjusting your search or filter criteria"
                : "Add your first coupon type to get started!"}
            </p>
            {searchTerm || discountTypeFilter !== "ALL" ? (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setDiscountTypeFilter("ALL");
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                <Link
                  href="/dashboard/admin/coupons-types/add"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Coupon Type
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-500 text-white border-b border-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Coupon Type Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Discount Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Max Limit
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Coupons
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCouponTypes.map((couponType) => (
                  <tr
                    key={couponType.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {couponType.typeName}
                      </div>
                      <div className="text-sm font-mono text-gray-600">
                        {couponType.typeCode}
                      </div>
                      {couponType.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {couponType.description}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                          couponType.discountType === "PERCENTAGE"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-green-100 text-green-800 border-green-200"
                        }`}
                      >
                        {couponType.discountType.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {couponType.discountType === "PERCENTAGE"
                            ? `${couponType.maxDiscountLimit}%`
                            : `₹${couponType.maxDiscountLimit.toLocaleString(
                                "en-IN"
                              )}`}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {couponType.stats?.totalCoupons || "0"}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {couponType.stats?.activeCoupons || "0"} active
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {couponType.stats?.totalUsage || "0"} times
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                          couponType.isActive
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {couponType.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {
                          new Date(couponType.createdAt).toLocaleDateString(
                            "en-GB"
                          ) /* en-GB gives dd/mm/yyyy */
                        }
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-end">
                        {/* View */}
                        <Link
                          href={`/dashboard/admin/coupons-types/${couponType.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 rounded-lg hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Edit */}
                        <Link
                          href={`/dashboard/admin/coupons-types/edit/${couponType.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 rounded-lg hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Activate / Deactivate */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start gap-2 rounded-lg ${
                            couponType.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          onClick={() =>
                            handleToggleActive(
                              couponType.id,
                              couponType.isActive
                            )
                          }
                        >
                          {couponType.isActive ? (
                            <ToggleLeft className="h-5 w-5" />
                          ) : (
                            <ToggleRight className="h-5 w-5" />
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
