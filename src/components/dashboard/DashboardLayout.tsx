// components/dashboard/DashboardLayout.tsx
"use client";

import {
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navConfigs } from "../navConfigs";

type Props = {
  children: React.ReactNode;
  role: "admin" | "college" | "faculty" | "student";
};

export default function DashboardLayout({ children, role }: Props) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const items = navConfigs[role];

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r fixed inset-y-0 left-0 overflow-y-auto pt-24 pb-10">
        <div className="px-6">
          {/* Role Badge */}
          {/* <div className="mb-6 px-4 py-2 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
              {role === "college" ? "College Dashboard" : `${role} Dashboard`}
            </p>
          </div> */}

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