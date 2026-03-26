create table if not exists payment_refunds (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid not null references payments(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,
  provider text not null default 'mercadopago',
  provider_refund_id text,
  amount numeric(10,2) not null check (amount > 0),
  reason text,
  status text not null default 'approved',
  refunded_by uuid references profiles(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_refunds_payment_idx on payment_refunds(payment_id, created_at desc);
create index if not exists payment_refunds_booking_idx on payment_refunds(booking_id, created_at desc);
