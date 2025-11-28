"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { DollarSign, Filter, IndianRupee, Users, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Commission = {
  id: string;
  courseName: string;
  studentName: string;
  saleAmount: string;
  commissionAmount: string;
  couponCode: string;
  status: "PENDING" | "PAID";
  createdAt: string;
  paidAt: string | null;
};

type Stats = {
  totalSales: string; // Total course sale amount
  totalCommission: string; // Total commission earned
  paidEarnings: string; // Already paid out
  pendingEarnings: string; // Pending payout
  salesCount: number; // Number of sales
  ytdSales: string;
  ytdCommission: string;
  mtdSales: string;
  mtdCommission: string;
  ytdSalesCount: number;
  mtdSalesCount: number;
};

type TimeFilter = 'ytd' | 'mtd';

export default function EarningsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mtd');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/jyotishi/earnings?filter=${timeFilter}`);
        const data = await res.json();

        setStats(data.stats);
        setCommissions(data.recentCommissions);
      } catch (err) {
        console.error("Error fetching earnings:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchData();
  }, [session, timeFilter]);

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${numAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const getSalesAmount = () => {
    if (!stats) return "0";
    return timeFilter === 'mtd' ? stats.mtdSales : stats.ytdSales;
  };

  const getCommissionAmount = () => {
    if (!stats) return "0";
    return timeFilter === 'mtd' ? stats.mtdCommission : stats.ytdCommission;
  };

  const getSalesCount = () => {
    if (!stats) return 0;
    return timeFilter === 'mtd' ? stats.mtdSalesCount : stats.ytdSalesCount;
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    gradient,
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
  }) => (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <div className={`w-10 h-10 rounded-lg ${gradient} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">Earnings Overview</h1>
            <p className="text-gray-600 mt-1">
              Track your sales performance and commission earnings
            </p>
          </div>
          
          {/* Time Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="mtd">Month to Date</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
        </div>

        {stats && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
              <span className="font-semibold">Viewing:</span>
              <span>{timeFilter === 'mtd' ? 'Month to Date' : 'Year to Date'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ---- Summary Cards ---- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sales - Course Sale Amount */}
          <StatCard
            title="Total Sales"
            value={formatCurrency(getSalesAmount())}
            subtitle={`${getSalesCount()} ${timeFilter === 'mtd' ? 'this month' : 'this year'}`}
            icon={IndianRupee}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          
          {/* Total Commission */}
          <StatCard
            title="Total Commission"
            value={formatCurrency(getCommissionAmount())}
            subtitle="Your earnings"
            icon={DollarSign}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          
          {/* Paid Earnings */}
          <StatCard
            title="Paid Earnings"
            value={formatCurrency(stats?.paidEarnings ?? "0")}
            subtitle="Already transferred"
            icon={Wallet}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          
          {/* Number of Sales */}
          <StatCard
            title="Number of Sales"
            value={getSalesCount().toString()}
            subtitle="Successful enrollments"
            icon={Users}
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
          />
        </div>
      )}

 
      {/* ---- Commission Table ---- */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            Recent Commission Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-blue-900 py-4">Course</TableHead>
                  <TableHead className="font-semibold text-blue-900 py-4">Student</TableHead>
                  <TableHead className="font-semibold text-blue-900 py-4">Coupon Code</TableHead>
                  <TableHead className="font-semibold text-blue-900 py-4 text-right">Sale Amount</TableHead>
                  <TableHead className="font-semibold text-blue-900 py-4 text-right">Commission</TableHead>
                  <TableHead className="font-semibold text-blue-900 py-4">Status</TableHead>
                  <TableHead className="font-semibold text-blue-900 py-4">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No commissions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((c) => (
                    <TableRow key={c.id} className="hover:bg-blue-50/30 transition-colors border-b border-gray-100">
                      <TableCell className="font-medium text-gray-900 py-4">
                        {c.courseName}
                      </TableCell>
                      <TableCell className="text-gray-700 py-4">
                        {c.studentName}
                      </TableCell>
                      <TableCell className="py-4">
                        <code className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          {c.couponCode}
                        </code>
                      </TableCell>
                      <TableCell className="text-right text-gray-900 font-medium py-4">
                        {formatCurrency(c.saleAmount)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600 py-4">
                        {formatCurrency(c.commissionAmount)}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          c.status === "PAID" 
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}>
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 py-4">
                        {format(new Date(c.createdAt), "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}