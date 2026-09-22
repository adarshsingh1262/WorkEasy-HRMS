"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Announcement } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Announcement[]>("/announcements")
      .then((data) => setAnnouncements(data.slice(0, 3)))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, []);

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
        <Card title="My Attendance" description="Check in, check out, and view your history." href="/my-attendance" />
        <Card title="My Leave" description="Request leave and track approvals." href="/my-leave" />
        <Card title="My Timesheet" description="Log hours and track approval status." href="/my-timesheet" />
        <Card title="My Tasks" description="Your onboarding checklist." href="/my-tasks" />
        <Card title="My Payslips" description="View your salary payslips." href="/my-payslips" />
        <Card title="My Goals" description="Track your goals and progress." href="/goals" />
        <Card title="Employee Directory" description="Browse everyone in your organization." href="/people" />
        <Card title="Approvals" description="Review pending leave and timesheet requests." href="/approvals" />
        <Card title="Help Desk" description="Raise or track a support ticket." href="/helpdesk" />
        <Card title="Reports" description="Headcount, attrition, leave and payroll cost." href="/reports" />
        <Card title="Organization Settings" description="Manage your organization profile." href="/settings/organization" />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-500">Recent announcements</h2>
          <Link href="/announcements" className="text-xs font-medium text-slate-500 hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-slate-500">No announcements yet.</p>
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{new Date(a.publishedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
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
