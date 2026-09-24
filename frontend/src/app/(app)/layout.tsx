"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Bell,
  Building2,
  Briefcase,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Clock,
  CreditCard,
  Home,
  Landmark,
  Laptop,
  LifeBuoy,
  ListChecks,
  LogOut,
  Megaphone,
  Package,
  Receipt,
  Search,
  ShieldCheck,
  Target,
  Timer,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { title?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Home", icon: Home }] },
  {
    title: "My Workspace",
    items: [
      { href: "/my-profile", label: "My Profile", icon: User },
      { href: "/my-attendance", label: "My Attendance", icon: Clock },
      { href: "/my-leave", label: "My Leave", icon: CalendarDays },
      { href: "/my-timesheet", label: "My Timesheet", icon: Timer },
      { href: "/my-tasks", label: "My Tasks", icon: ListChecks },
      { href: "/goals", label: "My Goals", icon: Target },
      { href: "/my-payslips", label: "My Payslips", icon: Receipt },
      { href: "/my-expenses", label: "My Expenses", icon: Wallet },
      { href: "/my-loans", label: "My Loans", icon: Landmark },
      { href: "/my-assets", label: "My Assets", icon: Laptop },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/people", label: "Directory", icon: Users },
      { href: "/approvals", label: "Approvals", icon: CheckSquare },
      { href: "/shifts", label: "Shifts", icon: CalendarClock },
    ],
  },
  {
    title: "Talent",
    items: [
      { href: "/onboarding", label: "Onboarding", icon: UserPlus },
      { href: "/performance", label: "Performance", icon: TrendingUp },
      { href: "/recruitment", label: "Recruitment", icon: Briefcase },
    ],
  },
  {
    title: "HR Services",
    items: [
      { href: "/helpdesk", label: "Help Desk", icon: LifeBuoy },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
      { href: "/hr-guide", label: "HR Guide", icon: BookOpen },
      { href: "/assets", label: "Assets", icon: Package },
    ],
  },
  {
    title: "Payroll & Insights",
    items: [
      { href: "/payroll", label: "Payroll", icon: CreditCard },
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/automation", label: "Automation", icon: Zap },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/settings/organization", label: "Organization", icon: Building2 },
      { href: "/settings/security", label: "Security", icon: ShieldCheck },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Loading…</div>;
  }

  function toggleGroup(title: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }

  const activeItem = [...ALL_ITEMS].sort((a, b) => b.href.length - a.href.length).find((i) => pathname.startsWith(i.href));
  const activeGroup = NAV_GROUPS.find((g) => g.title && g.items.includes(activeItem!));
  const displayName = user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email;
  const initials = (user.employee ? `${user.employee.firstName[0]}${user.employee.lastName[0]}` : user.email[0]).toUpperCase();

  return (
    <div className="flex flex-1 bg-slate-50">
      <aside className="flex w-60 shrink-0 flex-col overflow-y-auto bg-[#0b1220] p-3">
        <div className="mb-4 flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">W</div>
          <span className="text-base font-semibold text-white">WorkEasy360</span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_GROUPS.map((group, i) => {
            if (!group.title) {
              return (
                <div key={i} className="space-y-0.5 pb-2">
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
                  ))}
                </div>
              );
            }

            const isActiveGroup = group.items.some((item) => pathname.startsWith(item.href));
            const isOpen = isActiveGroup || openGroups.has(group.title);

            return (
              <div key={i}>
                <button
                  onClick={() => toggleGroup(group.title!)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  {group.title}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                </button>
                {isOpen && (
                  <div className="space-y-0.5 pb-2">
                    {group.items.map((item) => (
                      <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            {activeItem && (
              <>
                <activeItem.icon className="h-4 w-4 text-slate-400" strokeWidth={2} />
                {activeGroup && <span>{activeGroup.title}</span>}
                {activeGroup && <span className="text-slate-300">/</span>}
                <span className="text-slate-900">{activeItem.label}</span>
              </>
            )}
          </div>
          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="relative hidden max-w-xs flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search…"
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button className="relative text-slate-500 hover:text-blue-600" aria-label="Notifications">
              <Bell className="h-5 w-5" strokeWidth={2} />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                  {initials}
                </div>
                <span className="hidden text-sm font-medium text-slate-700 sm:inline">{displayName}</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 text-slate-900">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} strokeWidth={2} />
      {item.label}
    </Link>
  );
}
