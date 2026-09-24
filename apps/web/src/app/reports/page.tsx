"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import ReportImage from "@/components/ReportImage";
import type { Report, ReportType, ReportCategory } from "@stc-foundit/shared";

const CATEGORIES: (ReportCategory | "all")[] = [
  "all",
  "electronics",
  "documents",
  "keys",
  "bags",
  "clothing",
  "accessories",
  "other",
];

type ReportWithImages = Report & {
  report_images: { storage_path: string }[];
};

export default function ReportsFeedPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<ReportWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | "all">("all");

  useEffect(() => {
    let query = supabase
      .from("reports")
      .select("*, report_images(storage_path)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (typeFilter !== "all") query = query.eq("type", typeFilter);
    if (categoryFilter !== "all") query = query.eq("category", categoryFilter);

    setLoading(true);
    query.then(({ data }) => {
      setReports((data as ReportWithImages[] | null) ?? []);
      setLoading(false);
    });
  }, [typeFilter, categoryFilter]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Browse reports</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ReportType | "all")}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
        >
          <option value="all">Lost & found</option>
          <option value="lost">Lost only</option>
          <option value="found">Found only</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as ReportCategory | "all")
          }
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-muted">Loading...</p>}
        {!loading && reports.length === 0 && (
          <p className="text-muted">No reports match these filters yet.</p>
        )}
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: ReportWithImages }) {
  const isLost = report.type === "lost";
  const thumb = report.report_images?.[0]?.storage_path;
  return (
    <Link
      href={`/reports/${report.id}`}
      className="flex gap-3 rounded-lg border border-border bg-surface p-4 hover:border-brand"
    >
      {thumb && (
        <ReportImage
          path={thumb}
          alt={report.title}
          className="h-16 w-16 shrink-0 rounded-md object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{report.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isLost ? "bg-danger/15 text-danger" : "bg-success/15 text-success"
            }`}
          >
            {isLost ? "Lost" : "Found"}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-muted">{report.description}</p>
        <div className="mt-2 flex gap-3 text-xs text-muted">
          <span>{report.category}</span>
          {report.location && <span>{report.location}</span>}
        </div>
      </div>
    </Link>
  );
}
