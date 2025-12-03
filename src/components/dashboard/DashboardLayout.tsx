
/*eslint-disable @typescript-eslint/no-unused-vars */
// components/dashboard/DashboardLayout.tsx
"use client";

import {
  BookOpen,
  ChevronDown,
  DollarSign,
  FileText,
  Home,
  LayoutDashboard,
  List,
  MessageCircle,
  Plus,
  Quote,
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
        {
          title: "Add Course",
          href: "/dashboard/admin/courses/create",
          icon: Plus,
        },
      ],
    },

    { title: "Categories", href: "/dashboard/admin/categories", icon: List },

     {
      title: "Bootcamp",
      icon: BookOpen,
      children: [
        { title: "All Bootcamps", href: "/dashboard/admin/bootcamps", icon: List },
        {
          title: "Add Bootcamp",
          href: "/dashboard/admin/bootcamps/create",
          icon: Plus,
        },
      ],
    },

    {
      title: "College",
      icon: BookOpen,
      children: [
        { title: "List of Colleges", href: "/dashboard/admin/colleges", icon: List },
        { title: "Add College", href: "/dashboard/admin/colleges/add", icon: Plus },
      ],
    },
    {
      title: "Assignment",
      icon: FileText,
      children: [
        { title: "All Assignments", href: "/dashboard/admin/assignments", icon: List },
        { title: "Add Assignment", href: "/dashboard/admin/assignments/create", icon: Plus },
      ],
    },

        { title: "CMS", href: "/dashboard/admin/cms", icon: LayoutDashboard },
        { title: "Testimonals", href: "/dashboard/admin/testimonials", icon:MessageCircle },


    // {
    //   title: "Astrologer ",
    //   icon: Users,
    //   children: [
    //     { title: "All Astrologer", href: "/dashboard/admin/agent", icon: List },
    //     {
    //       title: "Add Astrologer",
    //       href: "/dashboard/admin/agent/add",
    //       icon: Plus,
    //     },
    //   ],
    // },
    // {
    //   title: "Coupons",
    //   icon: Tag,
    //   children: [
    //     {
    //       title: "Coupon Types",
    //       href: "/dashboard/admin/coupons-types",
    //       icon: List,
    //     },
    //     {
    //       title: "Add Type",
    //       href: "/dashboard/admin/coupons-types/add",
    //       icon: Plus,
    //     },
    //     { title: "All Coupons", href: "/dashboard/admin/coupons", icon: List },
    //     {
    //       title: "Add Coupon",
    //       href: "/dashboard/admin/coupons/add",
    //       icon: Plus,
    //     },
    //   ],
    // },
    // {
    //   title: "Users",
    //   icon: Users,
    //   children: [
    //     { title: "All Users", href: "/dashboard/admin/users", icon: List },
    //     {
    //       title: "Enrollments",
    //       href: "/dashboard/admin/enrollments",
    //       icon: Users,
    //     },
    //     {
    //       title: "Revenue",
    //       href: "/dashboard/admin/payments",
    //       icon: CreditCard,
    //     },
    //   ],
    // },
    // {
    //   title: "Certificates",
    //   icon: Award,
    //   children: [
    //     {
    //       title: "Pending Requests",
    //       href: "/dashboard/admin/certificates/requests",
    //       icon: List,
    //     },
    //     {
    //       title: "All Certificates",
    //       href: "/dashboard/admin/certificates",
    //       icon: Award,
    //     },
    //   ],
    // },
  ] as const,

  agent: [
    { title: "Dashboard", href: "/dashboard/college", icon: Home },
      {
      title: "Profile",
      href: "/dashboard/college/profile",
      icon: Users,
    },
    {
      title: " Courses",
      icon: Tag,
      children: [
        { title: "All Courses", href: "/dashboard/college/courses", icon: List },
        {
          title: "Add course",
          href: "/dashboard/college/courses/create",
          icon: Ticket,
        },
      ],
    },

     {
      title: " Departments",
      icon: Tag,
      children: [
        { title: "All Departments", href: "/dashboard/college/departments", icon: List },
      ],
    },
      {
      title: "Faculty",
      href: "/dashboard/college/faculty",
      icon: Users,
    },

    
    // {
    //   title: "Earnings",
    //   icon: TrendingUp,
    //   children: [
    //     {
    //       title: "Commission Overview",
    //       href: "/dashboard/agent/earnings",
    //       icon: DollarSign,
    //     },
    //     {
    //       title: "Payout History",
    //       href: "/dashboard/agent/payouts",
    //       icon: Wallet,
    //     },
    //   ],
    // },
  
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
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
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
