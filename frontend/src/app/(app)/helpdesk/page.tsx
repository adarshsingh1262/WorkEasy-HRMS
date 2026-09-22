"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { HelpDeskTicket } from "@/lib/types";

export default function HelpDeskPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("helpdesk:manage");

  const [myTickets, setMyTickets] = useState<HelpDeskTicket[]>([]);
  const [allTickets, setAllTickets] = useState<HelpDeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [mine, all] = await Promise.all([
        apiFetch<HelpDeskTicket[]>("/helpdesk/me"),
        canManage ? apiFetch<HelpDeskTicket[]>("/helpdesk") : Promise.resolve([]),
      ]);
      setMyTickets(mine);
      setAllTickets(all);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  async function updateStatus(id: string, status: HelpDeskTicket["status"]) {
    await apiFetch(`/helpdesk/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Help Desk</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "New ticket"}
        </button>
      </div>

      {showForm && (
        <TicketForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-500">My tickets</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : myTickets.length === 0 ? (
          <p className="text-sm text-slate-500">No tickets yet.</p>
        ) : (
          myTickets.map((t) => <TicketCard key={t.id} ticket={t} />)
        )}
      </section>

      {canManage && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-500">All tickets</h2>
          {allTickets.length === 0 ? (
            <p className="text-sm text-slate-500">No tickets in the organization.</p>
          ) : (
            allTickets.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{t.subject}</p>
                    <p className="text-sm text-slate-500">
                      {t.employee?.firstName} {t.employee?.lastName} · {t.category}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{t.description}</p>
                  </div>
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value as HelpDeskTicket["status"])}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: HelpDeskTicket }) {
  const styles: Record<HelpDeskTicket["status"], string> = {
    OPEN: "bg-amber-100 text-amber-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
    CLOSED: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">{ticket.subject}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[ticket.status]}`}>{ticket.status}</span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{ticket.category}</p>
      <p className="mt-1 text-sm text-slate-600">{ticket.description}</p>
    </div>
  );
}

function TicketForm({ onCreated }: { onCreated: () => void }) {
  const [category, setCategory] = useState("IT");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/helpdesk", { method: "POST", body: JSON.stringify({ category, subject, description }) });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="IT">IT</option>
        <option value="HR">HR</option>
        <option value="Payroll">Payroll</option>
        <option value="Facilities">Facilities</option>
        <option value="Other">Other</option>
      </select>
      <input required placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <textarea required placeholder="Describe the issue…" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit ticket"}
      </button>
    </form>
  );
}
