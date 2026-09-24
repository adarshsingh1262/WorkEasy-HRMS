"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Employee } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export default function PeoplePage() {
  const { hasPermission } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  async function load(q?: string) {
    setLoading(true);
    try {
      const query = q ? `?search=${encodeURIComponent(q)}` : "";
      const data = await apiFetch<Employee[]>(`/employees${query}`);
      setEmployees(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    load(search);
  }

  const canManage = hasPermission("employee:write");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employee Directory</h1>
          <p className="mt-1 text-sm text-slate-500">{employees.length} employee(s)</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {showAddForm ? "Cancel" : "Add employee"}
          </button>
        )}
      </div>

      {showAddForm && <AddEmployeeForm onCreated={() => load(search)} />}

      <form onSubmit={onSearch} className="max-w-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or employee code…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium">Designation</th>
                <th className="px-4 py-2 font-medium">Department</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/people/${emp.id}`} className="font-medium text-slate-900 hover:underline">
                      {emp.firstName} {emp.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{emp.employeeCode}</td>
                  <td className="px-4 py-2 text-slate-500">{emp.designation ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{emp.department?.name ?? "—"}</td>
                  <td className="px-4 py-2"><StatusBadge status={emp.status} /></td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddEmployeeForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", designation: "" });
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiFetch<{ tempPassword: string }>("/employees", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTempPassword(result.tempPassword);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
      <input required placeholder="First name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      <input required placeholder="Last name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      <input required type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      <input placeholder="Designation" value={form.designation} onChange={(e) => set("designation", e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      {tempPassword && (
        <p className="col-span-2 text-sm text-green-700">
          Employee created. Temporary password: <code className="rounded bg-slate-100 px-1">{tempPassword}</code>
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="col-span-2 w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create employee"}
      </button>
    </form>
  );
}
