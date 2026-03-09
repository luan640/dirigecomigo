alter table instructors
  add column if not exists weekly_schedule jsonb;
