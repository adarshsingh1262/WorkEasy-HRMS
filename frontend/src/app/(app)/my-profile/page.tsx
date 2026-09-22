"use client";

import { useAuth } from "@/lib/auth-context";

export default function MyProfilePage() {
  const { user } = useAuth();
  const employee = user?.employee;

  if (!employee) {
    return <p className="text-sm text-slate-500">No employee profile linked to your account yet.</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">My Profile</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-2 gap-y-4 text-sm">
          <Field label="Employee code" value={employee.employeeCode} />
          <Field label="Status" value={employee.status} />
          <Field label="Full name" value={`${employee.firstName} ${employee.lastName}`} />
          <Field label="Email" value={user?.email ?? "—"} />
          <Field label="Designation" value={employee.designation ?? "—"} />
          <Field label="Phone" value={employee.phone ?? "—"} />
          <Field label="Department" value={employee.department?.name ?? "—"} />
          <Field
            label="Date of joining"
            value={employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : "—"}
          />
        </dl>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-500">Roles</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {user?.roles.map((role) => (
            <span key={role} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {role}
            </span>
          ))}
        </div>
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
