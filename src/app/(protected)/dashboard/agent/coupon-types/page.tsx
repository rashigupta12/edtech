/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import { Search, Tag, Percent, IndianRupee, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";
import { useDebouncedCallback } from "use-debounce";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type CouponType = {
  id: string;
  typeCode: string;
  typeName: string;
  discountType: "FIXED_AMOUNT" | "PERCENTAGE";
  description?: string;
  maxDiscountLimit?: string;
  isActive: boolean;
  createdAt: string;
};

const CouponTypeSkeleton = () => (
  <Card className="animate-pulse border border-gray-200">
    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
          <div className="h-6 w-24 bg-gray-300 rounded"></div>
        </div>
        <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
      </div>
    </CardHeader>
    <CardContent className="pt-6 space-y-3">
      <div className="h-6 w-40 bg-gray-300 rounded"></div>
      <div className="h-5 w-32 bg-gray-200 rounded-full"></div>
      <div className="h-4 w-full bg-gray-200 rounded"></div>
      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
      <div className="flex justify-between pt-2">
        <div className="h-5 w-28 bg-gray-200 rounded"></div>
        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="pt-3 border-t border-gray-100">
        <div className="h-3 w-32 bg-gray-200 rounded"></div>
      </div>
    </CardContent>
  </Card>
);

export default function CouponTypesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // SWR: Cached + auto-refresh disabled
  const { data, error, isLoading } = useSWR("/api/jyotishi/coupon-types", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 min
  });

  const types: CouponType[] = data?.couponTypes || [];

  // Debounced search (300ms)
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
  }, 300);

  const filtered = useMemo(() => {
    if (!searchTerm) return types;
    const term = searchTerm.toLowerCase();
    return types.filter((t) => {
      const name = t.typeName || "";
      const code = t.typeCode || "";
      const desc = t.description || "";
      return (
        name.toLowerCase().includes(term) ||
        code.toLowerCase().includes(term) ||
        desc.toLowerCase().includes(term)
      );
    });
  }, [types, searchTerm]);

  return (
    <div className="w-full mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-blue-700">Available Coupon Types</h2>
          <p className="text-gray-600 mt-1">
            These are admin-defined templates you can use to create coupons.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, code, or description..."
            onChange={(e) => debouncedSetSearch(e.target.value)}
            className="pl-10 w-64 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CouponTypeSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
          <p className="text-lg font-medium text-gray-900">Failed to load coupon types</p>
          <p className="text-sm text-gray-500 mt-1">Please try again later</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
          {searchTerm ? (
            <>
              <p className="text-lg font-medium">No types match your search</p>
              <p className="text-sm mt-1">Try adjusting your search term</p>
            </>
          ) : (
            <p className="text-lg">No coupon types available</p>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((type) => (
            <Card
              key={type.id}
              className="hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 bg-white overflow-hidden"
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 pb-4">
                <CardTitle className="flex items-center justify-between text-gray-900">
                  <span className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <Tag className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="font-bold text-lg">{type.typeCode}</span>
                  </span>
                  {type.discountType === "PERCENTAGE" ? (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
                      <Percent className="h-4.5 w-4.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                      <IndianRupee className="h-4.5 w-4.5 text-white" />
                    </div>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-5 space-y-3">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{type.typeName}</h3>

                <div className="flex items-center">
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                      type.discountType === "PERCENTAGE"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                    }`}
                  >
                    {type.discountType === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}
                  </span>
                </div>

                {type.description ? (
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {type.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No description</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Max Limit:{" "}
                      <span className="font-bold text-blue-600">
                        {type.maxDiscountLimit
                          ? (type.discountType === "PERCENTAGE"
                              ? `${type.maxDiscountLimit}%`
                              : `₹${Number(type.maxDiscountLimit).toLocaleString("en-IN")}`)
                          : "No limit"}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                      type.isActive
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-rose-100 text-rose-700 border-rose-200"
                    }`}
                  >
                    {type.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created on:{" "}
                    {new Date(type.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}