"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Message } from "@stc-foundit/shared";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id ?? null;
      setUserId(currentUserId);

      const { data: convo } = await supabase
        .from("conversations")
        .select("report_id, reports(title)")
        .eq("id", id)
        .single();
      // reports(title) comes back as a joined object; cast defensively
      const joinedTitle = (convo as unknown as { reports?: { title?: string } })
        ?.reports?.title;
      setReportTitle(joinedTitle ?? "Conversation");

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      setMessages(msgs ?? []);
      setLoading(false);

      if (currentUserId) await markAsRead(currentUserId);
    }
    load();

    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          // We're actively viewing this conversation -- mark it read again
          // immediately so the incoming message never shows as unread.
          if (userId) markAsRead(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function markAsRead(currentUserId: string) {
    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", id)
      .eq("user_id", currentUserId);
    window.dispatchEvent(new Event("foundit:messages-read"));
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !userId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: userId,
      content: content.trim(),
    });
    setSending(false);
    if (!error) setContent("");
  }

  if (loading) {
    return <p className="mx-auto max-w-2xl px-4 py-10 text-muted">Loading...</p>;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-2xl flex-col px-4">
      <div className="border-b border-border py-4">
        <Link href="/messages" className="text-sm text-muted nav-link-glow">
          ← All conversations
        </Link>
        <h1 className="mt-1 text-lg font-semibold">{reportTitle}</h1>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted">
            No messages yet. Say hello and describe a detail only the real
            owner would know, such as you cutie ! 
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-brand text-black" : "bg-surface"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border py-4">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="rounded-md bg-brand px-4 py-2 font-medium text-black hover:bg-brand-hover disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
