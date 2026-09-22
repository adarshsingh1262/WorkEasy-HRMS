"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome{user?.employee ? `, ${user.employee.firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s going on today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="My Profile" description="View and manage your personal details." href="/my-profile" />
        <Card title="Employee Directory" description="Browse everyone in your organization." href="/people" />
        <Card title="Organization Settings" description="Manage your organization profile." href="/settings/organization" />
      </div>
    </div>
  );
}

function Card({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-400"
    >
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Link>
  );
}
