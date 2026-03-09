alter table instructors
  add column if not exists min_advance_booking_hours integer not null default 2
    check (min_advance_booking_hours between 0 and 168),
  add column if not exists cancellation_notice_hours integer not null default 24
    check (cancellation_notice_hours between 1 and 720);
