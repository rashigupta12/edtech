// src/app/(protected)/dashboard/agent/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "JYOTISHI") redirect("/auth/login");

  return <DashboardLayout role="agent">{children}</DashboardLayout>;
}