// components/dashboard/DashboardLayout.tsx
"use client";

import {
  Award,
  BookOpen,
  ChevronDown,
  CreditCard,
  DollarSign,
  FileText,
  Home,
  List, Plus,
  Tag,
  Ticket,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// type NavItem =
//   | {
//       title: string;
//       href: string;
//       icon: React.ComponentType<{ className?: string }>;
//       children?: never;
//     }
//   | {
//       title: string;
//       href?: never;
//       icon: React.ComponentType<{ className?: string }>;
//       children: {
//         title: string;
//         href: string;
//         icon: React.ComponentType<{ className?: string }>;
//       }[];
//     };

type Props = {
  children: React.ReactNode;
  role: "admin" | "agent" | "user";
};

const navConfigs = {
  admin: [
    { title: "Dashboard", href: "/dashboard/admin", icon: Home },
    {
      title: "Courses",
      icon: BookOpen,
      children: [
        { title: "All Courses", href: "/dashboard/admin/courses", icon: List },
        { title: "Add Course", href: "/dashboard/admin/courses/add", icon: Plus },
      ],
    },
    {
      title: "Blogs",
      icon: FileText,
      children: [
        { title: "All Blogs", href: "/dashboard/admin/blogs", icon: List },
        { title: "Add Blog", href: "/dashboard/admin/blogs/add", icon: Plus },
      ],
    },
    {
      title: "Astrologer ",
      icon: Users,
      children: [
        { title: "All Astrologer", href: "/dashboard/admin/agent", icon: List },
        { title: "Add Astrologer", href: "/dashboard/admin/agent/add", icon: Plus },
      ],
    },
    {
      title: "Coupons",
      icon: Tag,
      children: [
        { title: "Coupon Types", href: "/dashboard/admin/coupons-types", icon: List },
        { title: "Add Type", href: "/dashboard/admin/coupons-types/add", icon: Plus },
        { title: "All Coupons", href: "/dashboard/admin/coupons", icon: List },
        { title: "Add Coupon", href: "/dashboard/admin/coupons/add", icon: Plus },
      ],
    },
    {
      title: "Users",
      icon: Users,
      children: [
        { title: "All Users", href: "/dashboard/admin/users", icon: List },
        { title: "Enrollments", href: "/dashboard/admin/enrollments", icon: Users },
        { title: "Revenue", href: "/dashboard/admin/payments", icon: CreditCard },
      ],
    },
    {
      title: "Certificates",
      icon: Award,
      children: [
        { title: "Pending Requests", href: "/dashboard/admin/certificates/requests", icon: List },
        { title: "All Certificates", href: "/dashboard/admin/certificates", icon: Award },
      ],
    },
  ] as const,

  agent: [
    { title: "Dashboard", href: "/dashboard/agent", icon: Home },
    {
      title: "My Coupons",
      icon: Tag,
      children: [
        { title: "All Coupons", href: "/dashboard/agent/coupons", icon: List },
        { title: "Coupon Types", href: "/dashboard/agent/coupon-types", icon: Ticket },
      ],
    },
    {
      title: "Earnings",
      icon: TrendingUp,
      children: [
        { title: "Commission Overview", href: "/dashboard/agent/earnings", icon: DollarSign },
        { title: "Payout History", href: "/dashboard/agent/payouts", icon: Wallet },
      ],
    },
    { title: "Assign Coupons", href: "/dashboard/agent/assign-coupons", icon: Users },
  ] as const,

  user: [
    { title: "Dashboard", href: "/dashboard/user", icon: Home },
    { title: "My Courses", href: "/dashboard/user/courses", icon: BookOpen },
    { title: "Payments", href: "/dashboard/user/payments", icon: Wallet },
  ] as const,
};

export default function DashboardLayout({ children, role }: Props) {
  // const { data: session } = useSession();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const items = navConfigs[role];

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href;

  // const userName = session?.user?.name || "User";
  // const initials = userName
  //   .split(" ")
  //   .map((n) => n[0])
  //   .join("")
  //   .toUpperCase()
  //   .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r fixed inset-y-0 left-0 overflow-y-auto pt-20 pb-10">
        <div className="px-6">
   

          {/* Navigation */}
          <nav className="space-y-1">
            {items.map((item) => (
              <div key={item.title}>
                {"href" in item ? (
                  <Link href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                        isActive(item.href)
                          ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openMenus.includes(item.title) ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openMenus.includes(item.title) && item.children && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href}>
                            <div
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${
                                isActive(child.href)
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <child.icon className="h-4 w-4" />
                              {child.title}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}