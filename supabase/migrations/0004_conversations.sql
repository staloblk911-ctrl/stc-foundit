-- STC FoundIt — start (or reuse) a private conversation between the current
-- user and a report's owner. Runs as security definer because a client
-- can't legally INSERT a conversation_members row for someone else under
-- RLS -- and it shouldn't be able to. This function is the one controlled
-- path that's allowed to do that, with its own checks.

create or replace function start_conversation(target_report_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  owner uuid;
  existing_id uuid;
  new_id uuid;
begin
  if requester is null then
    raise exception 'Must be signed in';
  end if;

  select user_id into owner from reports where id = target_report_id;
  if owner is null then
    raise exception 'Report not found';
  end if;
  if owner = requester then
    raise exception 'Cannot start a conversation about your own report';
  end if;

  -- Reuse an existing conversation between these two people for this report,
  -- so clicking "Contact" twice doesn't spawn duplicate threads.
  select c.id into existing_id
  from conversations c
  where c.report_id = target_report_id
    and exists (select 1 from conversation_members m where m.conversation_id = c.id and m.user_id = requester)
    and exists (select 1 from conversation_members m where m.conversation_id = c.id and m.user_id = owner)
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into conversations (report_id) values (target_report_id) returning id into new_id;
  insert into conversation_members (conversation_id, user_id) values (new_id, requester), (new_id, owner);

  return new_id;
end;
$$;

grant execute on function start_conversation(uuid) to authenticated;

-- Turn on Supabase Realtime for messages so chat updates live without a
-- page refresh.
alter publication supabase_realtime add table messages;
