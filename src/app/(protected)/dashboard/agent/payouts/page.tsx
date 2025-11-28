/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  AlertCircle,
  X,
} from "lucide-react";
import Swal from "sweetalert2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import useSWR, { mutate as globalMutate } from "swr";
import { useDebouncedCallback } from "use-debounce";

const fetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
  }
}).then((res) => res.json());

type Payout = {
  id: string;
  amount: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  requestedAt: string;
  processedAt?: string;
  reason?: string;
};

const RowSkeleton = () => <Skeleton className="h-12 w-full rounded-lg" />;

export default function PayoutsPage() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Generate unique URLs with timestamps for cache busting
  const payoutsUrl = useMemo(() => {
    return `/api/jyotishi/payouts?_=${Date.now()}`;
  }, []);

  const earningsUrl = useMemo(() => {
    return `/api/jyotishi/earnings?_=${Date.now()}`;
  }, []);

  // SWR: Payouts with enhanced revalidation
  const {
    data: payoutsData,
    isLoading: loadingPayouts,
    mutate: mutatePayouts,
  } = useSWR(payoutsUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateOnMount: true,
    dedupingInterval: 0, // Disable deduping for immediate updates
  });

  // SWR: Earnings with enhanced revalidation
  const { data: earningsData, mutate: mutateEarnings } = useSWR(earningsUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });

  const payouts: Payout[] = payoutsData?.payouts || [];
  const available = Number(earningsData?.stats?.pendingEarnings ?? 0);

  // Pagination
  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return payouts.slice(start, start + limit);
  }, [payouts, page]);

  const totalPages = Math.ceil(payouts.length / limit);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    // Clear all SWR cache for payout and earnings endpoints
    await globalMutate(
      key => typeof key === 'string' && (key.startsWith('/api/jyotishi/payouts') || key.startsWith('/api/jyotishi/earnings')),
      undefined,
      { revalidate: true }
    );
    
    // Also revalidate current data
    await Promise.all([
      mutatePayouts(),
      mutateEarnings()
    ]);
  }, [mutatePayouts, mutateEarnings]);

  // Debounced amount validation
  const debouncedValidate = useDebouncedCallback((value: string) => {
    const num = Number(value);
    if (value && (isNaN(num) || num <= 0)) setError("Enter a valid amount");
    else if (num > available) setError(`Max available: ₹${available.toLocaleString()}`);
    else if (num > 500000) setError("Max ₹5,00,000 per request");
    else setError("");
  }, 300);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    debouncedValidate(val);
  }, [debouncedValidate]);

  const handleSubmit = async () => {
    if (error || !amount || Number(amount) > available) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/jyotishi/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed");
        Swal.fire({
          icon: 'error',
          title: 'Request Failed',
          text: err.error || 'Failed to submit payout request',
          confirmButtonColor: '#d33',
        });
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Payout Requested!',
        text: `₹${Number(amount).toLocaleString()} payout request submitted successfully.`,
        timer: 2000,
        showConfirmButton: false
      });

      // Close sidebar and reset form
      setShowSidebar(false);
      setAmount("");
      setError("");
      
      // Force refresh with multiple strategies
      await forceRefresh();
      
      // Additional forced revalidation after a short delay
      setTimeout(() => {
        forceRefresh();
      }, 100);
    } catch (err) {
      console.error('Error submitting payout:', err);
      setError("Network error");
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to submit payout request. Please check your connection.',
        confirmButtonColor: '#d33',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: Payout["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "APPROVED":
      case "PAID":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-rose-500" />;
    }
  };

  const getStatusColor = (status: Payout["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "APPROVED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PAID":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "REJECTED":
        return "bg-rose-100 text-rose-700 border-rose-200";
    }
  };

  const stats = useMemo(() => {
    const total = payouts.reduce((s, p) => s + Number(p.amount), 0);
    const paid = payouts
      .filter((p) => p.status === "PAID")
      .reduce((s, p) => s + Number(p.amount), 0);
    const pendingCount = payouts.filter((p) => p.status === "PENDING").length;

    return {
      totalPayouts: payouts.length,
      totalAmount: total,
      pendingPayouts: pendingCount,
      paidAmount: paid,
    };
  }, [payouts]);

  return (
    <div className="space-y-6 p-4 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Payout History</h1>
          <p className="text-gray-600 mt-1">Track your payout requests and earnings.</p>
        </div>
        <Button
          onClick={() => setShowSidebar(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Request Payout
        </Button>
      </div>

      {/* Stats Cards */}
      {loadingPayouts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Total Requests</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPayouts}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Total Requested</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">All requests</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Pending</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pendingPayouts}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Paid Out</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{stats.paidAmount.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Transferred</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payouts Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            Payout Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPayouts ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No payout requests yet. <button onClick={() => setShowSidebar(true)} className="text-blue-600 underline">Request one!</button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-blue-900">ID</TableHead>
                    <TableHead className="font-semibold text-blue-900">Amount</TableHead>
                    <TableHead className="font-semibold text-blue-900">Requested</TableHead>
                    <TableHead className="font-semibold text-blue-900">Processed</TableHead>
                    <TableHead className="font-semibold text-blue-900">Status</TableHead>
                    <TableHead className="font-semibold text-blue-900">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((p) => (
                    <TableRow key={p.id} className="hover:bg-blue-50/30 border-b border-gray-100">
                      <TableCell className="font-mono text-sm text-gray-900">#{p.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-bold text-gray-900">₹{Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-gray-700">{format(new Date(p.requestedAt), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-gray-700">
                        {p.processedAt ? format(new Date(p.processedAt), "dd MMM yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            p.status
                          )}`}
                        >
                          {getStatusIcon(p.status)}
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">{p.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Sidebar: Request Payout */}
      {showSidebar && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Request Payout</h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="text-white p-1 rounded-lg hover:bg-blue-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Available Balance */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-emerald-800">Available for Payout</span>
                    <Wallet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">₹{available.toLocaleString()}</div>
                  <p className="text-xs text-emerald-600 mt-1">Only pending commissions</p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Amount (₹)
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="15000"
                        className={`pl-3 pr-12 ${error ? "border-rose-500" : ""}`}
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {error}
                      </p>
                    )}
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Bank Transfer</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Funds will be sent to your linked bank account in{" "}
                      <a href="/dashboard/agent/profile" className="underline font-medium">
                        profile
                      </a>
                      .
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !!error || !amount}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {submitting ? "Submitting..." : "Request Payout"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}