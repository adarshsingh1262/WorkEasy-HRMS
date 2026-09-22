"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { OnboardingTask } from "@/lib/types";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<OnboardingTask[]>("/onboarding/me");
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function toggle(task: OnboardingTask) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    await apiFetch(`/onboarding/me/${task.id}`, { method: "PATCH", body: JSON.stringify({ done: !task.done }) });
  }

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          {loading ? "Loading…" : `${doneCount} of ${tasks.length} onboarding tasks complete`}
        </p>
      </div>

      {!loading && (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {tasks.map((task) => (
            <label key={task.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50">
              <input type="checkbox" checked={task.done} onChange={() => toggle(task)} className="h-4 w-4 rounded border-slate-300" />
              <span className={task.done ? "text-slate-400 line-through" : "text-slate-900"}>{task.title}</span>
            </label>
          ))}
          {tasks.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-500">No tasks assigned.</p>}
        </div>
      )}
    </div>
  );
}
