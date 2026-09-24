-- STC FoundIt — campus locations + matching
-- Depends on 0001_init.sql

-- ---------- Campus locations (hierarchical) ----------

create table campus_locations (
  id uuid primary key default gen_random_uuid(),
  university text not null,
  name text not null,
  parent_id uuid references campus_locations(id) on delete cascade,
  created_at timestamptz default now()
);

create index campus_locations_parent_idx on campus_locations(parent_id);
create index campus_locations_university_idx on campus_locations(university);

alter table campus_locations enable row level security;

create policy "campus locations are readable by authenticated users"
  on campus_locations for select
  to authenticated
  using (true);

-- Only admins should be able to manage the location tree. Simplest v1 approach:
-- manage it from the Supabase dashboard / service role, not from client apps.
-- (No insert/update/delete policy = no client-side writes under RLS.)

-- Point reports at a real location row, but keep the free-text field as a
-- fallback for campuses that haven't been mapped yet.
alter table reports add column location_id uuid references campus_locations(id);

-- ---------- Matching ----------

create table matches (
  id uuid primary key default gen_random_uuid(),
  lost_report_id uuid not null references reports(id) on delete cascade,
  found_report_id uuid not null references reports(id) on delete cascade,
  confidence numeric(4,1) not null check (confidence between 0 and 100),
  status text not null default 'suggested' check (status in ('suggested','confirmed','dismissed')),
  created_at timestamptz default now(),
  unique (lost_report_id, found_report_id)
);

create index matches_lost_idx on matches(lost_report_id);
create index matches_found_idx on matches(found_report_id);

alter table matches enable row level security;

-- A match is visible only to the two reporters involved — not public.
create policy "match visible to the two involved reporters"
  on matches for select
  to authenticated
  using (
    exists (select 1 from reports r where r.id = matches.lost_report_id and r.user_id = auth.uid())
    or
    exists (select 1 from reports r where r.id = matches.found_report_id and r.user_id = auth.uid())
  );

-- v1 scoring: same category (60), same location (25), within 3 days (15).
-- No AI needed yet — this is intentionally simple and explainable.
create or replace function compute_match_confidence(lost_id uuid, found_id uuid)
returns numeric
language plpgsql
as $$
declare
  l reports%rowtype;
  f reports%rowtype;
  score numeric := 0;
begin
  select * into l from reports where id = lost_id;
  select * into f from reports where id = found_id;

  if l.category = f.category then
    score := score + 60;
  end if;

  if l.location_id is not null and l.location_id = f.location_id then
    score := score + 25;
  end if;

  if l.incident_date is not null and f.incident_date is not null
     and abs(l.incident_date - f.incident_date) <= 3 then
    score := score + 15;
  end if;

  return score;
end;
$$;

-- Call this after inserting a new 'lost' or 'found' report to (re)generate
-- candidate matches against the opposite type. Kept as a plain function
-- (not a trigger) so the app can call it explicitly and control rate/cost.
create or replace function generate_matches_for_report(new_report_id uuid)
returns void
language plpgsql
as $$
declare
  r reports%rowtype;
  candidate reports%rowtype;
  opposite_type text;
  score numeric;
begin
  select * into r from reports where id = new_report_id;
  opposite_type := case when r.type = 'lost' then 'found' else 'lost' end;

  for candidate in
    select * from reports
    where type = opposite_type
      and status = 'active'
      and category = r.category
  loop
    score := compute_match_confidence(
      case when r.type = 'lost' then r.id else candidate.id end,
      case when r.type = 'lost' then candidate.id else r.id end
    );

    if score >= 40 then
      insert into matches (lost_report_id, found_report_id, confidence)
      values (
        case when r.type = 'lost' then r.id else candidate.id end,
        case when r.type = 'lost' then candidate.id else r.id end,
        score
      )
      on conflict (lost_report_id, found_report_id) do update
        set confidence = excluded.confidence;
    end if;
  end loop;
end;
$$;
