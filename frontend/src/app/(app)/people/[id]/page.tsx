"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Employee } from "@/lib/types";

export default function EmployeeProfilePage(props: PageProps<"/people/[id]">) {
  const { id } = use(props.params);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Employee>(`/employees/${id}`)
      .then(setEmployee)
      .catch(() => setError("Employee not found or you don't have access."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error || !employee) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/people" className="text-sm text-indigo-600 hover:underline">
        ← Back to directory
      </Link>
      <h1 className="text-2xl font-semibold">
        {employee.firstName} {employee.lastName}
      </h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-2 gap-y-4 text-sm">
          <Field label="Employee code" value={employee.employeeCode} />
          <Field label="Status" value={employee.status} />
          <Field label="Email" value={employee.user?.email ?? "—"} />
          <Field label="Designation" value={employee.designation ?? "—"} />
          <Field label="Phone" value={employee.phone ?? "—"} />
          <Field label="Department" value={employee.department?.name ?? "—"} />
          <Field label="Manager" value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—"} />
          <Field
            label="Date of joining"
            value={employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : "—"}
          />
        </dl>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
