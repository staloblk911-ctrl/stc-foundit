-- Sample data for local dev only. Run after 0001_init.sql and after creating
-- at least one real auth user (Supabase auth.users), then swap the uuids below.

-- insert into profiles (id, display_name, university)
-- values ('00000000-0000-0000-0000-000000000001', 'Test Student', 'Kasdi Merbah University');

-- insert into reports (user_id, type, category, title, description, location, incident_date)
-- values (
--   '00000000-0000-0000-0000-000000000001',
--   'lost',
--   'electronics',
--   'Black wired earphones',
--   'Lost near the main library entrance, JBL brand, small scuff on the left case.',
--   'Main Library',
--   current_date
-- );

-- Example campus location tree (run once per university, via service role —
-- there is no client-side insert policy on campus_locations by design).
-- insert into campus_locations (id, university, name, parent_id) values
--   ('10000000-0000-0000-0000-000000000001', 'Kasdi Merbah University', 'Faculty of Science', null),
--   ('10000000-0000-0000-0000-000000000002', 'Kasdi Merbah University', 'Main Library', null),
--   ('10000000-0000-0000-0000-000000000003', 'Kasdi Merbah University', 'Building 1', '10000000-0000-0000-0000-000000000001');

-- After inserting a new report, call this to (re)generate its candidate matches:
-- select generate_matches_for_report('<new report id>');
