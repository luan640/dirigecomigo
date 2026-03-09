create table if not exists platform_settings (
  key                    text primary key default 'default' check (key = 'default'),
  platform_fee_percent   numeric(5,2) not null default 8 check (platform_fee_percent >= 0 and platform_fee_percent <= 100),
  pix_fee_percent        numeric(5,2) not null default 0 check (pix_fee_percent >= 0 and pix_fee_percent <= 100),
  card_fee_percent       numeric(5,2) not null default 8 check (card_fee_percent >= 0 and card_fee_percent <= 100),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

insert into platform_settings (key)
values ('default')
on conflict (key) do nothing;
