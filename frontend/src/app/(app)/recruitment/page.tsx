"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Candidate, Department, Employee, JobPosting } from "@/lib/types";

const STAGES: Candidate["stage"][] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

export default function RecruitmentPage() {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPostingId, setSelectedPostingId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostingForm, setShowPostingForm] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);

  // Refreshes postings/employees in place — never toggles `loading`, so it
  // doesn't unmount the candidates panel (and any open form's local state)
  // when called as a background refresh after an action.
  async function loadPostings() {
    const [p, e] = await Promise.all([
      apiFetch<JobPosting[]>("/recruitment/postings"),
      apiFetch<Employee[]>("/employees"),
    ]);
    setPostings(p);
    setEmployees(e);
  }

  async function loadCandidates(postingId: string) {
    setCandidates(await apiFetch<Candidate[]>(`/recruitment/candidates?jobPostingId=${postingId}`));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadPostings().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPostingId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on selection change
      loadCandidates(selectedPostingId);
    }
  }, [selectedPostingId]);

  async function toggleStatus(posting: JobPosting) {
    await apiFetch(`/recruitment/postings/${posting.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: posting.status === "OPEN" ? "CLOSED" : "OPEN" }),
    });
    loadPostings();
  }

  const selectedPosting = postings.find((p) => p.id === selectedPostingId);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recruitment</h1>
        <button
          onClick={() => setShowPostingForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showPostingForm ? "Cancel" : "New job posting"}
        </button>
      </div>

      {showPostingForm && (
        <PostingForm
          onCreated={() => {
            setShowPostingForm(false);
            loadPostings();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-slate-500">Job postings</h2>
            {postings.length === 0 ? (
              <p className="text-sm text-slate-500">No job postings yet.</p>
            ) : (
              postings.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPostingId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedPostingId(p.id);
                  }}
                  className={`block w-full cursor-pointer rounded-lg border p-4 text-left shadow-sm transition ${
                    selectedPostingId === p.id ? "border-slate-900" : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{p.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "OPEN" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{p._count?.candidates ?? 0} candidate(s)</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(p);
                    }}
                    className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Mark {p.status === "OPEN" ? "closed" : "open"}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-500">
                {selectedPosting ? `Candidates — ${selectedPosting.title}` : "Candidates"}
              </h2>
              {selectedPosting && (
                <button onClick={() => setShowCandidateForm((v) => !v)} className="text-xs font-medium text-indigo-600 hover:underline">
                  {showCandidateForm ? "Cancel" : "+ Add candidate"}
                </button>
              )}
            </div>

            {!selectedPosting ? (
              <p className="text-sm text-slate-500">Select a posting to see its candidates.</p>
            ) : (
              <>
                {showCandidateForm && (
                  <CandidateForm
                    jobPostingId={selectedPosting.id}
                    onCreated={() => {
                      setShowCandidateForm(false);
                      loadCandidates(selectedPosting.id);
                    }}
                  />
                )}
                {candidates.length === 0 ? (
                  <p className="text-sm text-slate-500">No candidates yet.</p>
                ) : (
                  candidates.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      employees={employees}
                      onChanged={() => {
                        loadCandidates(selectedPosting.id);
                        loadPostings();
                      }}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PostingForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Department[]>("/departments").then(setDepartments).catch(() => setDepartments([]));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/recruitment/postings", {
        method: "POST",
        body: JSON.stringify({ title, description, departmentId: departmentId || undefined }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <input required placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      {departments.length > 0 && (
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      )}
      <textarea required placeholder="Job description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {submitting ? "Posting…" : "Post job"}
      </button>
    </form>
  );
}

function CandidateForm({ jobPostingId, onCreated }: { jobPostingId: string; onCreated: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/recruitment/candidates", {
        method: "POST",
        body: JSON.stringify({ jobPostingId, firstName, lastName, email, source: source || undefined }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <input required placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input required placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      <input placeholder="Source (optional)" value={source} onChange={(e) => setSource(e.target.value)} className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      {error && <p className="col-span-2 text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-2 w-fit rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {submitting ? "Adding…" : "Add candidate"}
      </button>
    </form>
  );
}

function CandidateCard({
  candidate,
  employees,
  onChanged,
}: {
  candidate: Candidate;
  employees: Employee[];
  onChanged: () => void;
}) {
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showHireForm, setShowHireForm] = useState(false);

  async function setStage(stage: Candidate["stage"]) {
    await apiFetch(`/recruitment/candidates/${candidate.id}`, { method: "PATCH", body: JSON.stringify({ stage }) });
    onChanged();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-xs text-slate-500">
            {candidate.email} {candidate.source && `· ${candidate.source}`}
          </p>
        </div>
        <select
          value={candidate.stage}
          disabled={candidate.stage === "HIRED"}
          onChange={(e) => setStage(e.target.value as Candidate["stage"])}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {candidate.interviews && candidate.interviews.length > 0 && (
        <div className="mt-2 space-y-1 text-xs text-slate-500">
          {candidate.interviews.map((iv) => (
            <p key={iv.id}>
              Interview {new Date(iv.scheduledAt).toLocaleString()}
              {iv.rating ? ` · rated ${iv.rating}/5` : " · pending feedback"}
            </p>
          ))}
        </div>
      )}

      {candidate.stage !== "HIRED" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setShowInterviewForm((v) => !v)} className="text-xs font-medium text-indigo-600 hover:underline">
            Schedule interview
          </button>
          {candidate.stage === "OFFER" && (
            <button onClick={() => setShowHireForm((v) => !v)} className="text-xs font-medium text-slate-900 hover:underline">
              Hire
            </button>
          )}
        </div>
      )}

      {showInterviewForm && (
        <InterviewForm
          candidateId={candidate.id}
          employees={employees}
          onScheduled={() => {
            setShowInterviewForm(false);
            onChanged();
          }}
        />
      )}
      {showHireForm && (
        <HireForm candidateId={candidate.id} onHired={onChanged} />
      )}
    </div>
  );
}

function InterviewForm({
  candidateId,
  employees,
  onScheduled,
}: {
  candidateId: string;
  employees: Employee[];
  onScheduled: () => void;
}) {
  const [interviewerId, setInterviewerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch(`/recruitment/candidates/${candidateId}/interviews`, {
        method: "POST",
        body: JSON.stringify({ interviewerId, scheduledAt: new Date(scheduledAt).toISOString() }),
      });
      onScheduled();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-2 text-xs">
      <select required value={interviewerId} onChange={(e) => setInterviewerId(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1">
        <option value="">Interviewer…</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.firstName} {emp.lastName}
          </option>
        ))}
      </select>
      <input required type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1" />
      {error && <p className="col-span-2 text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-2 w-fit rounded-md bg-indigo-600 px-3 py-1 font-medium text-white disabled:opacity-50">
        {submitting ? "Scheduling…" : "Schedule"}
      </button>
    </form>
  );
}

function HireForm({ candidateId, onHired }: { candidateId: string; onHired: () => void }) {
  const [designation, setDesignation] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiFetch<{ tempPassword: string }>(`/recruitment/candidates/${candidateId}/hire`, {
        method: "POST",
        body: JSON.stringify({ designation: designation || undefined }),
      });
      setTempPassword(result.tempPassword);
      onHired();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-md bg-slate-50 p-2 text-xs">
      <input placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-1" />
      {error && <p className="text-red-600">{error}</p>}
      {tempPassword && (
        <p className="text-green-700">
          Hired! Temporary password: <code className="rounded bg-white px-1">{tempPassword}</code>
        </p>
      )}
      <button type="submit" disabled={submitting} className="w-fit rounded-md bg-indigo-600 px-3 py-1 font-medium text-white disabled:opacity-50">
        {submitting ? "Hiring…" : "Confirm hire"}
      </button>
    </form>
  );
}
