const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  DRAFT: "bg-slate-100 text-slate-600",
  APPLIED: "bg-slate-100 text-slate-600",
  SCREENING: "bg-blue-100 text-blue-800",
  INTERVIEW: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  OFFER: "bg-violet-100 text-violet-800",
  APPROVED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  AVAILABLE: "bg-green-100 text-green-800",
  OPEN: "bg-green-100 text-green-800",
  ONBOARDING: "bg-green-100 text-green-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  HIRED: "bg-green-100 text-green-800",
  RESOLVED: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  PROCESSED: "bg-green-100 text-green-800",
  REIMBURSED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-600",
  CLOSED: "bg-slate-100 text-slate-600",
  RETIRED: "bg-slate-100 text-slate-600",
  INACTIVE: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
