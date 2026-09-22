"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { AutomationRule } from "@/lib/types";

const TRIGGER_LABELS: Record<AutomationRule["trigger"], string> = {
  LEAVE_APPROVED: "Leave approved",
  EMPLOYEE_ONBOARDED: "Employee onboarded",
  TIMESHEET_APPROVED: "Timesheet approved",
};

const ACTION_LABELS: Record<AutomationRule["actionType"], string> = {
  CREATE_ANNOUNCEMENT: "Create announcement",
  ASSIGN_ONBOARDING_TASK: "Assign onboarding task",
};

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRules(await apiFetch<AutomationRule[]>("/automation-rules"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function toggle(rule: AutomationRule) {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)));
    await apiFetch(`/automation-rules/${rule.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !rule.enabled }) });
  }

  async function remove(id: string) {
    await apiFetch(`/automation-rules/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Automation</h1>
          <p className="mt-1 text-sm text-slate-500">Trigger an action automatically when something happens.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "New rule"}
        </button>
      </div>

      {showForm && (
        <RuleForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : rules.length === 0 ? (
        <p className="text-sm text-slate-500">No automation rules yet.</p>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-slate-500">
                  When <strong>{TRIGGER_LABELS[r.trigger]}</strong> → <strong>{ACTION_LABELS[r.actionType]}</strong>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <input type="checkbox" checked={r.enabled} onChange={() => toggle(r)} className="h-4 w-4 rounded border-slate-300" />
                  Enabled
                </label>
                <button onClick={() => remove(r.id)} className="text-xs font-medium text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RuleForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<AutomationRule["trigger"]>("EMPLOYEE_ONBOARDED");
  const [actionType, setActionType] = useState<AutomationRule["actionType"]>("ASSIGN_ONBOARDING_TASK");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const actionConfig = actionType === "CREATE_ANNOUNCEMENT" ? { title, body } : { title };
      await apiFetch("/automation-rules", {
        method: "POST",
        body: JSON.stringify({ name, trigger, actionType, actionConfig }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
      <input required placeholder="Rule name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <label className="text-sm">
        <span className="mb-1 block font-medium text-slate-700">When</span>
        <select value={trigger} onChange={(e) => setTrigger(e.target.value as AutomationRule["trigger"])} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-slate-700">Then</span>
        <select value={actionType} onChange={(e) => setActionType(e.target.value as AutomationRule["actionType"])} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {actionType === "ASSIGN_ONBOARDING_TASK" && (
        <input required placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      )}
      {actionType === "CREATE_ANNOUNCEMENT" && (
        <>
          <input required placeholder="Announcement title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
          <textarea required placeholder="Announcement body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        </>
      )}

      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-2 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
        {submitting ? "Creating…" : "Create rule"}
      </button>
    </form>
  );
}
