"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Report } from "@stc-foundit/shared";

interface AdminReport extends Report {
  profiles?: { display_name: string } | null;
}

interface AdminProfile {
  id: string;
  display_name: string;
  university: string | null;
  is_admin: boolean;
  is_banned: boolean;
}

export default function AdminPage() {
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [tab, setTab] = useState<"reports" | "users">("reports");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setChecking(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userData.user.id)
        .single();

      const admin = profile?.is_admin ?? false;
      setIsAdmin(admin);
      setChecking(false);

      if (admin) {
        loadReports();
        loadUsers();
      }
    }
    load();
  }, []);

  async function loadReports() {
    const { data } = await supabase
      .from("reports")
      .select("*, profiles(display_name)")
      .order("created_at", { ascending: false });
    setReports((data as AdminReport[] | null) ?? []);
  }

  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, university, is_admin, is_banned")
      .order("display_name");
    setUsers((data as AdminProfile[] | null) ?? []);
  }

  async function deleteReport(id: string) {
    if (!confirm("Delete this report permanently? This can't be undone.")) return;
    await supabase.from("reports").delete().eq("id", id);
    loadReports();
  }

  async function toggleBan(userId: string, currentlyBanned: boolean) {
    const label = currentlyBanned ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${label} this user?`)) return;
    await supabase
      .from("profiles")
      .update({ is_banned: !currentlyBanned })
      .eq("id", userId);
    loadUsers();
  }

  if (checking) {
    return <p className="mx-auto max-w-4xl px-4 py-10 text-muted">Loading...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted">You don&apos;t have access to this page.</p>
        <Link href="/" className="text-brand">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <div className="mt-4 flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("reports")}
          className={`px-3 py-2 text-sm font-medium ${
            tab === "reports"
              ? "border-b-2 border-brand text-foreground"
              : "text-muted"
          }`}
        >
          Reports ({reports.length})
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-3 py-2 text-sm font-medium ${
            tab === "users" ? "border-b-2 border-brand text-foreground" : "text-muted"
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      {tab === "reports" && (
        <div className="mt-6 space-y-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/reports/${r.id}`} className="font-medium hover:text-brand">
                    {r.title}
                  </Link>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                    {r.type}
                  </span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted">
                  by {r.profiles?.display_name ?? "Unknown"} · {r.category}
                </p>
              </div>
              <button
                onClick={() => deleteReport(r.id)}
                className="shrink-0 rounded-md border border-danger px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
              >
                Delete
              </button>
            </div>
          ))}
          {reports.length === 0 && <p className="text-muted">No reports yet.</p>}
        </div>
      )}

      {tab === "users" && (
        <div className="mt-6 space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
            >
              <div>
                <div className="flex items-center gap-2 font-medium">
                  {u.display_name}
                  {u.is_admin && (
                    <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">
                      admin
                    </span>
                  )}
                  {u.is_banned && (
                    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs text-danger">
                      banned
                    </span>
                  )}
                </div>
                {u.university && (
                  <p className="text-xs text-muted">{u.university}</p>
                )}
              </div>
              {!u.is_admin && (
                <button
                  onClick={() => toggleBan(u.id, u.is_banned)}
                  className={`shrink-0 rounded-md border px-3 py-1.5 text-sm ${
                    u.is_banned
                      ? "border-border hover:bg-background"
                      : "border-danger text-danger hover:bg-danger/10"
                  }`}
                >
                  {u.is_banned ? "Unban" : "Ban"}
                </button>
              )}
            </div>
          ))}
          {users.length === 0 && <p className="text-muted">No users yet.</p>}
        </div>
      )}
    </div>
  );
}