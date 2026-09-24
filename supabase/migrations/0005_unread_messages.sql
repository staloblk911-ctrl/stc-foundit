-- STC FoundIt — unread message tracking.
-- Adds a per-member "last read" timestamp and a function to count unread
-- messages across all of the current user's conversations.

alter table conversation_members add column last_read_at timestamptz not null default now();

-- A member can update only their own read marker.
create policy "members can update their own read marker"
  on conversation_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Runs as the caller (not security definer) -- it only touches rows the
-- caller can already see under the existing RLS policies on messages and
-- conversation_members, so no elevated privileges are needed.
create or replace function unread_message_count()
returns integer
language sql
stable
as $$
  select count(*)::int
  from messages m
  join conversation_members cm on cm.conversation_id = m.conversation_id
  where cm.user_id = auth.uid()
    and m.sender_id <> auth.uid()
    and m.created_at > cm.last_read_at;
$$;

grant execute on function unread_message_count() to authenticated;
