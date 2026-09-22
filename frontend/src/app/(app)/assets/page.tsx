"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Asset, Employee } from "@/lib/types";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [a, e] = await Promise.all([
        apiFetch<Asset[]>("/assets"),
        apiFetch<Employee[]>("/employees"),
      ]);
      setAssets(a);
      setEmployees(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function assign(assetId: string, employeeId: string) {
    if (!employeeId) return;
    await apiFetch(`/assets/${assetId}/assign`, { method: "POST", body: JSON.stringify({ employeeId }) });
    load();
  }

  async function returnAsset(assetId: string) {
    await apiFetch(`/assets/${assetId}/return`, { method: "POST" });
    load();
  }

  async function retire(assetId: string) {
    await apiFetch(`/assets/${assetId}/retire`, { method: "POST" });
    load();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assets</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "New asset"}
        </button>
      </div>

      {showForm && (
        <AssetForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Assigned to</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2">
                    {a.name} {a.serialNumber && <span className="text-slate-400">({a.serialNumber})</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{a.category}</td>
                  <td className="px-4 py-2 text-slate-500">{a.status}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {a.status === "AVAILABLE" && (
                      <select
                        defaultValue=""
                        onChange={(e) => assign(a.id, e.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="" disabled>
                          Assign…
                        </option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                      </select>
                    )}
                    {a.status === "ASSIGNED" && (
                      <button onClick={() => returnAsset(a.id)} className="text-xs font-medium text-slate-500 hover:underline">
                        Return
                      </button>
                    )}
                    {a.status !== "RETIRED" && (
                      <button onClick={() => retire(a.id)} className="ml-2 text-xs font-medium text-red-600 hover:underline">
                        Retire
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No assets yet.
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

function AssetForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Laptop");
  const [serialNumber, setSerialNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/assets", {
        method: "POST",
        body: JSON.stringify({ name, category, serialNumber: serialNumber || undefined }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <input required placeholder="Asset name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="Laptop">Laptop</option>
        <option value="Phone">Phone</option>
        <option value="ID Card">ID Card</option>
        <option value="Monitor">Monitor</option>
        <option value="Other">Other</option>
      </select>
      <input placeholder="Serial number (optional)" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-3 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
        {submitting ? "Adding…" : "Add asset"}
      </button>
    </form>
  );
}
