-- STC FoundIt — auto-create a profile row the moment a user signs up.
-- Fixes: client-side insert into profiles fails RLS because there's no
-- active session yet when email confirmation is required. A trigger with
-- security definer runs as postgres, bypassing that timing problem.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, university)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'New user'),
    new.raw_user_meta_data->>'university'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
