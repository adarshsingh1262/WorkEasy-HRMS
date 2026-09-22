"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Asset } from "@/lib/types";

export default function MyAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Asset[]>("/assets/me")
      .then(setAssets)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">My Assets</h1>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-slate-500">No assets assigned to you.</p>
      ) : (
        <div className="space-y-2">
          {assets.map((a) => (
            <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-medium">{a.name}</p>
              <p className="text-sm text-slate-500">
                {a.category} {a.serialNumber && `· ${a.serialNumber}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
