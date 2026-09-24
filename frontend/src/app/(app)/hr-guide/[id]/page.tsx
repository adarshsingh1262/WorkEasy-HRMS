"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { HrGuideArticle } from "@/lib/types";

export default function HrGuideArticlePage(props: PageProps<"/hr-guide/[id]">) {
  const { id } = use(props.params);
  const [article, setArticle] = useState<HrGuideArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<HrGuideArticle>(`/hr-guide/${id}`)
      .then(setArticle)
      .catch(() => setError("Article not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error || !article) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/hr-guide" className="text-sm text-blue-600 hover:underline">
        ← Back to HR Guide
      </Link>
      <h1 className="text-2xl font-semibold">{article.title}</h1>
      {article.category && <p className="text-sm text-slate-500">{article.category}</p>}
      <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-6 text-sm shadow-sm">{article.body}</div>
      <p className="text-xs text-slate-400">
        By {article.author.firstName} {article.author.lastName} · {new Date(article.updatedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
