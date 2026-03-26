do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'manual_lesson_status'
  ) then
    create type manual_lesson_status as enum ('completed', 'cancelled');
  end if;
end $$;

create table if not exists manual_lessons (
  id uuid primary key default uuid_generate_v4(),
  instructor_id uuid not null references instructors(id) on delete cascade,
  student_name text not null,
  student_phone text,
  category vehicle_category not null default 'B',
  lesson_date date not null,
  start_time time not null,
  end_time time not null,
  amount numeric(10,2) not null check (amount > 0),
  status manual_lesson_status not null default 'completed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manual_lessons_time_order check (end_time > start_time)
);

create index if not exists manual_lessons_instructor_idx on manual_lessons(instructor_id, lesson_date desc);
create index if not exists manual_lessons_status_idx on manual_lessons(status);

drop trigger if exists manual_lessons_updated_at on manual_lessons;

create trigger manual_lessons_updated_at
before update on manual_lessons
for each row execute procedure touch_updated_at();

alter table manual_lessons enable row level security;

create policy "manual_lessons_instructor" on manual_lessons for all
  using (auth.uid() = instructor_id);
