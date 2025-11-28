/*eslint-disable @typescript-eslint/no-unused-vars */
/*eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/admin/coupons/page.tsx
"use client";

import {
  ArrowLeft,
  Calendar,
  Copy,
  Filter,
  IndianRupee,
  Percent,
  Plus,
  Power,
  PowerOff,
  Search,
  Tag,
  Trash2,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  Edit
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  maxUsageCount?: number;
  currentUsageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  couponScope: "GENERAL" | "PERSONAL";
  description?: string;
  createdAt: string;
  typeName: string;
  typeCode: string;
  createdBy?: string;
  createdByEmail?: string;
}

export default function AllCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Fetch coupons on component mount
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/coupons");
      
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      } else {
        console.error("Failed to fetch coupons");
        await Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: 'Failed to load coupons',
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Load Failed',
        text: 'Failed to load coupons',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this coupon? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setDeleteLoading(couponId);
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCoupons(coupons.filter(coupon => coupon.id !== couponId));
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Coupon deleted successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete coupon');
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error instanceof Error ? error.message : 'Failed to delete coupon',
        confirmButtonColor: '#d33',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleStatus = async (couponId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `You want to ${action} this coupon?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#f59e0b' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setToggleLoading(couponId);
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(coupons.map(coupon =>
          coupon.id === couponId
            ? { ...coupon, isActive: !currentStatus }
            : coupon
        ));
        await Swal.fire({
          icon: 'success',
          title: 'Status Updated!',
          text: data.message || `Coupon ${action}d successfully`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} coupon`);
      }
    } catch (error) {
      console.error("Error updating coupon status:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error instanceof Error ? error.message : `Failed to ${action} coupon`,
        confirmButtonColor: '#d33',
      });
    } finally {
      setToggleLoading(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Coupon code copied to clipboard',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Copy Failed',
        text: 'Failed to copy coupon code',
        confirmButtonColor: '#d33',
      });
    }
  };

  const getStatusBadge = (isActive: boolean, validUntil: string) => {
    const now = new Date();
    const validUntilDate = new Date(validUntil);

    if (!isActive) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Inactive</span>;
    }

    if (validUntilDate < now) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Expired</span>;
    }

    return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Active</span>;
  };

  const getScopeBadge = (scope: "GENERAL" | "PERSONAL") => {
    return scope === "GENERAL" 
      ? <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">General</span>
      : <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">Personal</span>;
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    return coupon.discountType === "PERCENTAGE"
      ? `${coupon.discountValue}%`
      : `₹${coupon.discountValue}`;
  };

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.maxUsageCount) return 0;
    return (coupon.currentUsageCount / coupon.maxUsageCount) * 100;
  };

  // Filter coupons based on search and filters
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && coupon.isActive && new Date(coupon.validUntil) > new Date()) ||
                         (statusFilter === "inactive" && !coupon.isActive) ||
                         (statusFilter === "expired" && new Date(coupon.validUntil) < new Date());

    const matchesScope = scopeFilter === "all" || coupon.couponScope === scopeFilter;

    return matchesSearch && matchesStatus && matchesScope;
  });

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading Coupons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-blue-700 bg-clip-text text-transparent">
            Coupons Management
          </h2>
          <p className="text-gray-600 mt-2">
            Manage and track all coupon codes and their usage.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>

          {/* Add Coupon Button */}
          <Button
            onClick={() => router.push("/dashboard/admin/coupons/add")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg whitespace-nowrap flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Coupon
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
                Total Coupons
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600">
                Active Coupons
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.filter(c => c.isActive && new Date(c.validUntil) > new Date()).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Total Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.reduce((sum, coupon) => sum + coupon.currentUsageCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Fixed Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.filter(ct => ct.discountType === "FIXED_AMOUNT").length}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No coupons found
            </h3>
            <p className="text-gray-600 mb-6">
              {coupons.length === 0 
                ? "Get started by creating your first coupon."
                : "No coupons match your search criteria."}
            </p>
            {coupons.length === 0 && (
              <Button
                onClick={() => router.push("/dashboard/admin/coupons/add")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Create Your First Coupon
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-500 text-white border-b border-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Coupon Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Tag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <code className="font-mono font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                              {coupon.code}
                            </code>
                            <button
                              onClick={() => copyToClipboard(coupon.code)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Copy coupon code"
                            >
                              <Copy className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-600">{coupon.typeName}</span>
                           
                          </div>
                          {coupon.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {coupon.description}
                            </p>
                          )}
                          {coupon.createdBy && (
                            <p className="text-xs text-gray-400">
                              Created by: {coupon.createdBy}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                       
                        <span className="font-semibold text-gray-900">
                          {getDiscountDisplay(coupon)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Used</span>
                          <span className="font-medium">
                            {coupon.currentUsageCount}
                            {coupon.maxUsageCount && ` / ${coupon.maxUsageCount}`}
                          </span>
                        </div>
                        {coupon.maxUsageCount && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(getUsagePercentage(coupon), 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                 <td className="px-6 py-4">
  <div className="space-y-1 text-sm">
    <div className="flex items-center gap-2">
      {/* <Calendar className="h-4 w-4 text-gray-400" /> */}
      <span className="text-gray-600">
        {new Date(coupon.validFrom).toLocaleDateString("en-GB")}
      </span>
    </div>
    <div className="flex items-center gap-2">
      {/* <Calendar className="h-4 w-4 text-gray-400" /> */}
      <span className="text-gray-600">
        {new Date(coupon.validUntil).toLocaleDateString("en-GB")}
      </span>
    </div>
  </div>
</td>

                    <td className="px-6 py-4">
                      {getStatusBadge(coupon.isActive, coupon.validUntil)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-end gap-1">
                  

                  
                        {/* Activate/Deactivate */}
                        <button
                          onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                          disabled={toggleLoading === coupon.id}
                          className={`p-2 rounded-lg transition-colors ${
                            coupon.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          } disabled:opacity-50`}
                          title={coupon.isActive ? "Deactivate" : "Activate"}
                        >
                          {toggleLoading === coupon.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : coupon.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          disabled={deleteLoading === coupon.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete coupon"
                        >
                          {deleteLoading === coupon.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
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

// Button component for consistency
const Button = ({ 
  children, 
  className = "", 
  onClick, 
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  [key: string]: any;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);