"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Organization } from "@/lib/types";

export default function OrganizationSettingsPage() {
  const { hasPermission } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canManage = hasPermission("org:manage");

  useEffect(() => {
    apiFetch<Organization>("/organizations/current")
      .then((data) => {
        setOrg(data);
        setName(data.name);
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const updated = await apiFetch<Organization>("/organizations/current", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setOrg(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Organization</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Organization slug</span>
          <input disabled value={org?.slug ?? ""} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Organization name</span>
          <input
            required
            disabled={!canManage}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-700">Saved.</p>}

        {canManage && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        )}
      </form>
    </div>
  );
}
