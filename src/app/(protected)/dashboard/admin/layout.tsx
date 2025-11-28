// src/app/(protected)/dashboard/admin/layout.tsx
import { auth } from "@/auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/auth/login");

  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}