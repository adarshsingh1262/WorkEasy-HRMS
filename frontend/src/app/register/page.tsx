"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    organizationSlug: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">Create your organization</h1>
          <p className="mt-1 text-sm text-slate-500">You&apos;ll be the first Admin user.</p>
        </div>

        <Field label="Organization name" value={form.organizationName} onChange={(v) => set("organizationName", v)} placeholder="Acme Inc" />
        <Field
          label="Organization slug (used to sign in)"
          value={form.organizationSlug}
          onChange={(v) => set("organizationSlug", v.toLowerCase())}
          placeholder="acme"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} />
          <Field label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} />
        </div>
        <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="you@company.com" />
        <Field label="Password" type="password" value={form.password} onChange={(v) => set("password", v)} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create organization"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        required
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
    </label>
  );
}
