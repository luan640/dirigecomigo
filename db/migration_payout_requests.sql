do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'payout_request_status'
  ) then
    create type payout_request_status as enum ('pending', 'processing', 'paid', 'rejected', 'cancelled');
  end if;
end $$;

create table if not exists payout_requests (
  id uuid primary key default uuid_generate_v4(),
  instructor_id uuid not null references instructors(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  status payout_request_status not null default 'pending',
  notes text,
  admin_notes text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payout_requests_instructor_idx on payout_requests(instructor_id, requested_at desc);
create index if not exists payout_requests_status_idx on payout_requests(status, requested_at desc);

drop trigger if exists payout_requests_updated_at on payout_requests;

create trigger payout_requests_updated_at
before update on payout_requests
for each row execute procedure touch_updated_at();

alter table payout_requests enable row level security;

drop policy if exists "payout_requests_instructor_select" on payout_requests;
drop policy if exists "payout_requests_instructor_insert" on payout_requests;

create policy "payout_requests_instructor_select" on payout_requests for select
  using (auth.uid() = instructor_id);

create policy "payout_requests_instructor_insert" on payout_requests for insert
  with check (auth.uid() = instructor_id);
