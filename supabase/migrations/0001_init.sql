-- STC FoundIt — initial schema
-- Run with: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ---------- Tables ----------

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  university text,
  created_at timestamptz default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('lost', 'found')),
  category text not null check (category in (
    'electronics','documents','keys','bags','clothing','accessories','other'
  )),
  title text not null,
  description text not null,
  location text,
  incident_date date,
  status text not null default 'active' check (status in ('active','matched','returned','closed')),
  created_at timestamptz default now()
);

create table report_images (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  storage_path text not null
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  created_at timestamptz default now()
);

-- Explicit membership table — needed so RLS can check "is this user allowed
-- to see this conversation" without trusting the client.
create table conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz default now()
);

create index reports_type_status_idx on reports(type, status);
create index reports_category_idx on reports(category);
create index messages_conversation_idx on messages(conversation_id);

-- ---------- RLS ----------

alter table profiles enable row level security;
alter table reports enable row level security;
alter table report_images enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;

-- profiles: anyone signed in can read display names (needed to show who's
-- messaging you); a user can only edit their own row.
create policy "profiles are readable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- reports: active reports are public (that's the point of the product);
-- only the owner can create/update/delete their own.
create policy "active reports are readable by authenticated users"
  on reports for select
  to authenticated
  using (true);

create policy "users can create their own reports"
  on reports for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own reports"
  on reports for update
  to authenticated
  using (auth.uid() = user_id);

create policy "users can delete their own reports"
  on reports for delete
  to authenticated
  using (auth.uid() = user_id);

-- report_images: follow the parent report's visibility/ownership.
create policy "report images readable by authenticated users"
  on report_images for select
  to authenticated
  using (true);

create policy "users can attach images to their own reports"
  on report_images for insert
  to authenticated
  with check (
    exists (
      select 1 from reports
      where reports.id = report_images.report_id
      and reports.user_id = auth.uid()
    )
  );

-- conversations / conversation_members / messages: private to members only.
create policy "members can read their conversations"
  on conversations for select
  to authenticated
  using (
    exists (
      select 1 from conversation_members
      where conversation_members.conversation_id = conversations.id
      and conversation_members.user_id = auth.uid()
    )
  );

create policy "members can read their membership rows"
  on conversation_members for select
  to authenticated
  using (user_id = auth.uid());

create policy "members can read messages in their conversations"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from conversation_members
      where conversation_members.conversation_id = messages.conversation_id
      and conversation_members.user_id = auth.uid()
    )
  );

create policy "members can send messages in their conversations"
  on messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversation_members
      where conversation_members.conversation_id = messages.conversation_id
      and conversation_members.user_id = auth.uid()
    )
  );

-- ---------- Storage ----------
-- Create a private report-images bucket in the Supabase dashboard before uploads.
