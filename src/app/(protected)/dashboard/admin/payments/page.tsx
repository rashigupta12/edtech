/*eslint-disable  @typescript-eslint/no-explicit-any*/
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
import { CreditCard, DollarSign, Filter, Search, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type Payment = {
  id: string;
  invoiceNumber: string;
  userId: string;
  user: { name: string; email: string };
  amount: string;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchPaymentsWithUsers = async () => {
      try {
        setLoading(true);

        // Fetch both payments and users
        const [paymentsRes, usersRes] = await Promise.all([
          fetch("/api/admin/payments"),
          fetch("/api/admin/users"),
        ]);

        const [paymentsData, usersData] = await Promise.all([
          paymentsRes.json(),
          usersRes.json(),
        ]);

        const allPayments = paymentsData.payments || [];
        const allUsers = usersData.users || [];

        // Create a user map for quick lookup
        const userMap = new Map<string, User>();
        allUsers.forEach((u: User) => {
          userMap.set(u.id, { id: u.id, name: u.name, email: u.email });
        });

        // Map payments and attach user details
        const mappedPayments = allPayments
          .map((p: any) => {
            const user = userMap.get(p.userId) || {
              name: "Unknown User",
              email: "N/A",
            };

            return {
              id: p.id,
              invoiceNumber: p.invoiceNumber,
              userId: p.userId,
              user: {
                name: user.name,
                email: user.email,
              },
              amount: p.finalAmount || p.amount || "0",
              paymentMethod: p.paymentMethod,
              status: p.status,
              createdAt: p.createdAt,
            };
          });

        setPayments(mappedPayments);
      } catch (error) {
        console.error("Failed to load payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsWithUsers();
  }, []);

  const filtered = payments.filter((p) => {
    const invoice = p.invoiceNumber || "";
    const userName = p.user?.name || "";
    const userEmail = p.user?.email || "";
    
    // Search filter
    const searchMatch = 
      invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter - map "PENDING" to "FAILED" for filtering
    let statusToFilter = p.status;
    if (p.status === "PENDING") {
      statusToFilter = "FAILED";
    }
    
    const statusMatch = statusFilter === "all" || statusToFilter === statusFilter;
    
    return searchMatch && statusMatch;
  });

  // Helper function to get display status and badge style
  const getDisplayStatus = (status: string) => {
    if (status === "PENDING") {
      return {
        displayText: "FAILED",
        variant: "destructive" as const
      };
    }
    return {
      displayText: status,
      variant: status === "COMPLETED" ? "default" as const : "destructive" as const
    };
  };

  // Calculate stats
  const totalRevenue = payments
    .filter(p => p.status === "COMPLETED")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  const completedPayments = payments.filter(p => p.status === "COMPLETED").length;
  const failedPayments = payments.filter(p => p.status === "PENDING" || p.status === "FAILED").length;

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-blue-700 bg-clip-text text-transparent">
            Payments Management
          </h2>
          <p className="text-gray-600 mt-2">
            Manage and view all payment transactions ({filtered.length} payments)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="focus:bg-blue-50">All Status</SelectItem>
              <SelectItem value="COMPLETED" className="focus:bg-blue-50">Completed</SelectItem>
              <SelectItem value="FAILED" className="focus:bg-blue-50">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview - All cards in single row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Payments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {payments.length}
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
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedPayments}
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
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">
                {failedPayments}
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
            <p className="text-gray-600 mt-4">Loading Payments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No payments found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No payment transactions found"}
            </p>
            {searchTerm || statusFilter !== "all" ? (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Clear Filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-500 text-white border-b border-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Invoice Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Date
                  </th>
         
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const statusInfo = getDisplayStatus(p.status);
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Invoice */}
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {p.invoiceNumber}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/admin/users/${p.userId}`}
                          className="block hover:underline"
                        >
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {p.user.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {p.user.email}
                          </div>
                        </Link>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                       
                          <span className="text-sm font-semibold text-gray-900">
                            ₹{Number(p.amount).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {p.paymentMethod || "Online"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-left">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            statusInfo.displayText === "COMPLETED"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }`}
                        >
                          {statusInfo.displayText}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {/* <Calendar className="h-4 w-4 text-gray-400" /> */}
                          {new Date(p.createdAt).toLocaleDateString("en-GB")}
                        </div>
                      </td>

      
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}