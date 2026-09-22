"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PerformanceReview } from "@/lib/types";

export default function PerformancePage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("performance:manage");

  const [myReviews, setMyReviews] = useState<PerformanceReview[]>([]);
  const [teamReviews, setTeamReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCycleForm, setShowCycleForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [mine, team] = await Promise.all([
        apiFetch<PerformanceReview[]>("/performance/reviews/me"),
        apiFetch<PerformanceReview[]>("/performance/reviews/team"),
      ]);
      setMyReviews(mine);
      setTeamReviews(team);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Performance</h1>
        {canManage && (
          <button
            onClick={() => setShowCycleForm((v) => !v)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showCycleForm ? "Cancel" : "New review cycle"}
          </button>
        )}
      </div>

      {showCycleForm && (
        <CycleForm
          onCreated={() => {
            setShowCycleForm(false);
            load();
          }}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-500">My reviews</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : myReviews.length === 0 ? (
          <p className="text-sm text-slate-500">No review cycles yet.</p>
        ) : (
          myReviews.map((r) => <MyReviewCard key={r.id} review={r} onUpdated={load} />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-500">Team reviews</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : teamReviews.length === 0 ? (
          <p className="text-sm text-slate-500">No team reviews to complete.</p>
        ) : (
          teamReviews.map((r) => <TeamReviewCard key={r.id} review={r} onUpdated={load} />)
        )}
      </section>
    </div>
  );
}

function CycleForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/performance/cycles", { method: "POST", body: JSON.stringify({ name, startDate, endDate }) });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <input required placeholder="Cycle name (e.g. H2 2026)" value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-3 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
        {submitting ? "Creating…" : "Create cycle (opens reviews for all active employees)"}
      </button>
    </form>
  );
}

function MyReviewCard({ review, onUpdated }: { review: PerformanceReview; onUpdated: () => void }) {
  const [selfAssessment, setSelfAssessment] = useState(review.selfAssessment ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await apiFetch(`/performance/reviews/me/${review.id}`, {
        method: "PATCH",
        body: JSON.stringify({ selfAssessment }),
      });
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">{review.cycle.name}</p>
        <span className="text-xs text-slate-500">{review.status}</span>
      </div>
      {review.status === "COMPLETED" ? (
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-slate-600">Self: {review.selfAssessment}</p>
          <p className="text-slate-600">Manager: {review.managerAssessment}</p>
          <p className="font-medium">Rating: {review.rating}/5</p>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <textarea
            value={selfAssessment}
            onChange={(e) => setSelfAssessment(e.target.value)}
            placeholder="Write your self-assessment…"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={submit}
            disabled={saving || !selfAssessment}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Submit self-assessment"}
          </button>
        </div>
      )}
    </div>
  );
}

function TeamReviewCard({ review, onUpdated }: { review: PerformanceReview; onUpdated: () => void }) {
  const [managerAssessment, setManagerAssessment] = useState(review.managerAssessment ?? "");
  const [rating, setRating] = useState(review.rating ?? 3);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await apiFetch(`/performance/reviews/${review.id}/manager`, {
        method: "PATCH",
        body: JSON.stringify({ managerAssessment, rating }),
      });
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">
          {review.employee?.firstName} {review.employee?.lastName} · {review.cycle.name}
        </p>
        <span className="text-xs text-slate-500">{review.status}</span>
      </div>
      {review.selfAssessment && <p className="mt-2 text-sm text-slate-600">Self: {review.selfAssessment}</p>}
      {review.status === "COMPLETED" ? (
        <p className="mt-2 text-sm font-medium">Rating given: {review.rating}/5</p>
      ) : (
        <div className="mt-2 space-y-2">
          <textarea
            value={managerAssessment}
            onChange={(e) => setManagerAssessment(e.target.value)}
            placeholder="Write your assessment…"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-md border border-slate-300 px-2 py-1 text-sm">
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              onClick={submit}
              disabled={saving || !managerAssessment}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Complete review"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
