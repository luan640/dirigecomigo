-- ============================================================
-- MeuInstrutor — PostgreSQL Schema (Supabase)
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── Teardown (safe re-run) ───────────────────────────────────
drop table if exists lesson_packages          cascade;
drop table if exists favorites                cascade;
drop table if exists reviews                  cascade;
drop table if exists subscriptions            cascade;
drop table if exists payments                 cascade;
drop table if exists bookings                 cascade;
drop table if exists instructor_availability  cascade;
drop table if exists instructors              cascade;
drop table if exists students                 cascade;
drop table if exists profiles                 cascade;
drop function if exists touch_updated_at()           cascade;
drop function if exists refresh_instructor_rating()  cascade;
drop function if exists sync_slot_booking()          cascade;
drop function if exists increment_total_lessons()    cascade;
drop type if exists subscription_status  cascade;
drop type if exists payment_status       cascade;
drop type if exists booking_status       cascade;
drop type if exists vehicle_category     cascade;
drop type if exists user_role            cascade;

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- fuzzy search

-- ── Enums ───────────────────────────────────────────────────
create type user_role            as enum ('student', 'instructor', 'admin');
create type vehicle_category     as enum ('A', 'B', 'AB', 'C', 'D', 'E');
create type booking_status       as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create type payment_status       as enum ('pending', 'processing', 'paid', 'failed', 'refunded');
create type subscription_status  as enum ('active', 'expired', 'cancelled', 'trial');

-- ── profiles (extends auth.users) ───────────────────────────
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  phone         text,
  avatar_url    text,
  role          user_role not null default 'student',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── students ────────────────────────────────────────────────
create table students (
  id            uuid primary key references profiles(id) on delete cascade,
  city          text default 'Fortaleza',
  state         text default 'CE',
  created_at    timestamptz not null default now()
);

-- ── instructors ─────────────────────────────────────────────
create table instructors (
  id                  uuid primary key references profiles(id) on delete cascade,
  bio                 text,
  price_per_lesson    numeric(10,2) not null check (price_per_lesson >= 50),
  neighborhood        text not null,
  city                text not null default 'Fortaleza',
  state               text not null default 'CE',
  latitude            double precision,
  longitude           double precision,
  category            vehicle_category not null default 'B',
  categories          vehicle_category[] not null default ARRAY['B']::vehicle_category[],
  min_advance_booking_hours integer not null default 2 check (min_advance_booking_hours between 0 and 168),
  cancellation_notice_hours integer not null default 24 check (cancellation_notice_hours between 1 and 720),
  vehicle_brand       text,
  vehicle_type        text,
  is_verified         boolean not null default false,
  rating              numeric(3,2) not null default 0 check (rating between 0 and 5),
  review_count        integer not null default 0,
  total_lessons       integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index instructors_neighborhood_idx on instructors(neighborhood);
create index instructors_rating_idx on instructors(rating desc);
create index instructors_price_idx on instructors(price_per_lesson);
create index instructors_location_idx on instructors(latitude, longitude);

-- ── instructor_availability ──────────────────────────────────
create table instructor_availability (
  id              uuid primary key default uuid_generate_v4(),
  instructor_id   uuid not null references instructors(id) on delete cascade,
  date            date not null,
  start_time      time not null,
  end_time        time not null,
  is_booked       boolean not null default false,
  created_at      timestamptz not null default now(),
  constraint no_overlap unique (instructor_id, date, start_time)
);

create index availability_instructor_date_idx on instructor_availability(instructor_id, date);

-- ── bookings ────────────────────────────────────────────────
create table bookings (
  id                  uuid primary key default uuid_generate_v4(),
  student_id          uuid not null references students(id) on delete restrict,
  instructor_id       uuid not null references instructors(id) on delete restrict,
  availability_slot_id uuid references instructor_availability(id) on delete set null,
  scheduled_date      date not null,
  start_time          time not null,
  end_time            time not null,
  status              booking_status not null default 'pending',
  total_amount        numeric(10,2) not null,
  platform_fee        numeric(10,2) not null,
  instructor_net      numeric(10,2) not null,
  notes               text,
  cancelled_by        uuid references profiles(id),
  cancellation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index bookings_student_idx    on bookings(student_id, scheduled_date);
create index bookings_instructor_idx on bookings(instructor_id, scheduled_date);
create index bookings_status_idx     on bookings(status);

-- ── payments ────────────────────────────────────────────────
create table payments (
  id                  uuid primary key default uuid_generate_v4(),
  booking_id          uuid not null references bookings(id) on delete restrict,
  provider            text not null default 'mock',  -- 'mock' | 'mercadopago' | 'stripe'
  provider_payment_id text,
  amount              numeric(10,2) not null,
  currency            char(3) not null default 'BRL',
  status              payment_status not null default 'pending',
  paid_at             timestamptz,
  refunded_at         timestamptz,
  metadata            jsonb,
  created_at          timestamptz not null default now()
);

create index payments_booking_idx on payments(booking_id);

-- ── subscriptions ───────────────────────────────────────────
create table subscriptions (
  id                    uuid primary key default uuid_generate_v4(),
  instructor_id         uuid not null references instructors(id) on delete cascade,
  status                subscription_status not null default 'active',
  amount                numeric(10,2) not null default 15.00,
  current_period_start  date not null,
  current_period_end    date not null,
  cancelled_at          timestamptz,
  provider              text not null default 'mock',
  provider_sub_id       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index subscriptions_instructor_idx on subscriptions(instructor_id, status);

-- ── reviews ─────────────────────────────────────────────────
create table reviews (
  id            uuid primary key default uuid_generate_v4(),
  booking_id    uuid not null references bookings(id) on delete restrict,
  student_id    uuid not null references students(id) on delete restrict,
  instructor_id uuid not null references instructors(id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now(),
  constraint one_review_per_booking unique (booking_id)
);

create index reviews_instructor_idx on reviews(instructor_id);

-- ── favorites ───────────────────────────────────────────────
create table favorites (
  student_id    uuid not null references students(id) on delete cascade,
  instructor_id uuid not null references instructors(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (student_id, instructor_id)
);

-- ── lesson_packages ──────────────────────────────────────────
create table lesson_packages (
  id              uuid primary key default uuid_generate_v4(),
  instructor_id   uuid not null references instructors(id) on delete cascade,
  name            text not null,
  description     text,
  lessons_count   integer not null check (lessons_count >= 2),
  price           numeric(10,2) not null check (price > 0),
  category        vehicle_category not null default 'B',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index packages_instructor_idx on lesson_packages(instructor_id, is_active);

-- ── Triggers: updated_at ─────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at    before update on profiles    for each row execute procedure touch_updated_at();
create trigger instructors_updated_at before update on instructors for each row execute procedure touch_updated_at();
create trigger bookings_updated_at    before update on bookings    for each row execute procedure touch_updated_at();
create trigger subscriptions_updated_at before update on subscriptions for each row execute procedure touch_updated_at();
create trigger packages_updated_at      before update on lesson_packages for each row execute procedure touch_updated_at();

-- ── Trigger: recalculate instructor rating after review ───────
create or replace function refresh_instructor_rating()
returns trigger language plpgsql as $$
begin
  update instructors
  set rating       = (select round(avg(rating)::numeric, 2) from reviews where instructor_id = new.instructor_id),
      review_count = (select count(*) from reviews where instructor_id = new.instructor_id)
  where id = new.instructor_id;
  return new;
end;
$$;

create trigger reviews_refresh_rating
after insert or update on reviews
for each row execute procedure refresh_instructor_rating();

-- ── Trigger: mark slot as booked / free ──────────────────────
create or replace function sync_slot_booking()
returns trigger language plpgsql as $$
begin
  if new.availability_slot_id is not null then
    update instructor_availability
    set is_booked = (new.status not in ('cancelled', 'no_show'))
    where id = new.availability_slot_id;
  end if;
  return new;
end;
$$;

create trigger bookings_sync_slot
after insert or update on bookings
for each row execute procedure sync_slot_booking();

-- ── Trigger: increment total_lessons on completion ────────────
create or replace function increment_total_lessons()
returns trigger language plpgsql as $$
begin
  if new.status = 'completed' and (old is null or old.status <> 'completed') then
    update instructors set total_lessons = total_lessons + 1 where id = new.instructor_id;
  end if;
  return new;
end;
$$;

create trigger bookings_completed_lessons
after insert or update on bookings
for each row execute procedure increment_total_lessons();

-- ── Row-Level Security ───────────────────────────────────────
alter table profiles                 enable row level security;
alter table students                 enable row level security;
alter table instructors              enable row level security;
alter table instructor_availability  enable row level security;
alter table bookings                 enable row level security;
alter table payments                 enable row level security;
alter table subscriptions            enable row level security;
alter table reviews                  enable row level security;
alter table favorites                enable row level security;

-- profiles: own row or public read
create policy "profiles_public_read"  on profiles for select using (true);
create policy "profiles_own_write"    on profiles for all using (auth.uid() = id);

-- students: own row
create policy "students_own"          on students for all using (auth.uid() = id);

-- instructors: public read; own write
create policy "instructors_public_read" on instructors for select using (true);
create policy "instructors_own_write"   on instructors for all using (auth.uid() = id);

-- availability: public read; instructor writes own
create policy "avail_public_read"  on instructor_availability for select using (true);
create policy "avail_instructor"   on instructor_availability for all
  using (auth.uid() = instructor_id);

-- bookings: student or instructor of the booking
create policy "bookings_access" on bookings for all
  using (auth.uid() = student_id or auth.uid() = instructor_id);

-- payments: tied to a booking the user is part of
create policy "payments_access" on payments for select
  using (exists (
    select 1 from bookings b
    where b.id = payments.booking_id
      and (b.student_id = auth.uid() or b.instructor_id = auth.uid())
  ));

-- subscriptions: instructor own
create policy "subscriptions_own" on subscriptions for all
  using (auth.uid() = instructor_id);

-- reviews: public read; student writes own
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_own_write"   on reviews for all using (auth.uid() = student_id);

-- favorites: student own
create policy "favorites_own" on favorites for all using (auth.uid() = student_id);

-- lesson_packages: public read; instructor writes own
alter table lesson_packages enable row level security;
create policy "packages_public_read" on lesson_packages for select using (is_active = true);
create policy "packages_instructor"  on lesson_packages for all  using (auth.uid() = instructor_id);
