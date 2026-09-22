"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV_GROUPS: { title?: string; items: { href: string; label: string }[] }[] = [
  { items: [{ href: "/dashboard", label: "Home" }] },
  {
    title: "My Workspace",
    items: [
      { href: "/my-profile", label: "My Profile" },
      { href: "/my-attendance", label: "My Attendance" },
      { href: "/my-leave", label: "My Leave" },
      { href: "/my-timesheet", label: "My Timesheet" },
      { href: "/my-tasks", label: "My Tasks" },
      { href: "/goals", label: "My Goals" },
      { href: "/my-payslips", label: "My Payslips" },
    ],
  },
  {
    items: [
      { href: "/people", label: "People" },
      { href: "/approvals", label: "Approvals" },
    ],
  },
  {
    title: "Time & Attendance",
    items: [{ href: "/shifts", label: "Shifts" }],
  },
  {
    title: "Talent",
    items: [
      { href: "/onboarding", label: "Onboarding" },
      { href: "/performance", label: "Performance" },
    ],
  },
  {
    title: "HR Services",
    items: [
      { href: "/helpdesk", label: "Help Desk" },
      { href: "/announcements", label: "Announcements" },
      { href: "/hr-guide", label: "HR Guide" },
    ],
  },
  {
    title: "Payroll",
    items: [{ href: "/payroll", label: "Payroll" }],
  },
  { items: [{ href: "/reports", label: "Reports" }] },
  { items: [{ href: "/automation", label: "Automation" }] },
  {
    title: "Settings",
    items: [
      { href: "/settings/organization", label: "Organization" },
      { href: "/settings/security", label: "Security" },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="flex flex-1">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 px-2 text-lg font-semibold">WorkEasy360</div>
        <nav className="space-y-4">
          {NAV_GROUPS.map((group, i) => (
            <div key={i} className="space-y-1">
              {group.title && (
                <div className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm font-medium ${
                    pathname.startsWith(item.href)
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-sm text-slate-500">
            {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email}
          </span>
          <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            Sign out
          </button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
