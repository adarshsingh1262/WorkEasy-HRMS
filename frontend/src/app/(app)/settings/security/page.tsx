"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AuditLog } from "@/lib/types";

export default function SecurityPage() {
  const { user, hasPermission, refetchUser } = useAuth();
  const canReadAudit = hasPermission("audit:read");

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Security</h1>

      <TwoFactorSection totpEnabled={user?.totpEnabled ?? false} onChanged={refetchUser} />

      {canReadAudit && <AuditLogSection />}
    </div>
  );
}

function TwoFactorSection({ totpEnabled, onChanged }: { totpEnabled: boolean; onChanged: () => void }) {
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function startSetup() {
    setError(null);
    const data = await apiFetch<{ secret: string; otpauthUrl: string }>("/auth/2fa/setup", { method: "POST" });
    setSetup(data);
  }

  async function confirmSetup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/auth/2fa/verify", { method: "POST", body: JSON.stringify({ token: code }) });
      setSetup(null);
      setCode("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-medium text-slate-500">Two-factor authentication</h2>

      {totpEnabled ? (
        <form onSubmit={disable} className="mt-3 space-y-3">
          <p className="text-sm text-green-700">2FA is enabled on your account.</p>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Current password (to disable)</span>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {submitting ? "Disabling…" : "Disable 2FA"}
          </button>
        </form>
      ) : setup ? (
        <form onSubmit={confirmSetup} className="mt-3 space-y-3">
          <p className="text-sm text-slate-600">
            Add this key to your authenticator app (Google Authenticator, Authy, 1Password…), or paste it manually:
          </p>
          <code className="block break-all rounded bg-slate-100 px-3 py-2 text-sm">{setup.secret}</code>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Enter the 6-digit code to confirm</span>
            <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {submitting ? "Confirming…" : "Confirm and enable"}
          </button>
        </form>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-slate-500">2FA is not enabled on your account.</p>
          <button onClick={startSetup} className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Set up 2FA
          </button>
        </div>
      )}
    </section>
  );
}

function AuditLogSection() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AuditLog[]>("/audit-logs")
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-slate-500">Audit log</h2>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-slate-500">No audit events yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-2 text-slate-500">{l.actor?.email ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
