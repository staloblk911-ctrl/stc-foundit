"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface ConversationRow {
  id: string;
  report_title: string;
}

export default function MessagesInboxPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }

      // conversation_members is scoped to the current user by RLS, so this
      // only ever returns conversations they're actually part of.
      const { data } = await supabase
        .from("conversation_members")
        .select("conversation_id, conversations(id, reports(title))")
        .eq("user_id", userData.user.id);

      const rows: ConversationRow[] = (data ?? []).map((row) => {
        const convo = row as unknown as {
          conversations?: { id: string; reports?: { title?: string } };
        };
        return {
          id: convo.conversations?.id ?? "",
          report_title: convo.conversations?.reports?.title ?? "Conversation",
        };
      });
      setConversations(rows.filter((r) => r.id));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Messages</h1>
      <div className="mt-6 space-y-2">
        {loading && <p className="text-muted">Loading...</p>}
        {!loading && conversations.length === 0 && (
          <p className="text-muted">
            No conversations yet. Contact someone from a report to start one
          </p>
        )}
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className="block rounded-lg border border-border bg-surface p-4 hover:border-brand"
          >
            {c.report_title}
          </Link>
        ))}
      </div>
    </div>
  );
}
