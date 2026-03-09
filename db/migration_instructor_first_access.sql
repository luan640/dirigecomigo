alter table profiles
  add column if not exists onboarding_completed boolean not null default false;

alter table instructors
  add column if not exists price_per_lesson_a numeric(10,2) check (price_per_lesson_a is null or price_per_lesson_a >= 50),
  add column if not exists price_per_lesson_b numeric(10,2) check (price_per_lesson_b is null or price_per_lesson_b >= 50);

update instructors
set categories = case
  when category = 'AB' then ARRAY['A','B']::vehicle_category[]
  else ARRAY[category]::vehicle_category[]
end
where categories is null or cardinality(categories) = 0;

update instructors
set price_per_lesson_a = case when category in ('A', 'AB') and price_per_lesson_a is null then price_per_lesson else price_per_lesson_a end,
    price_per_lesson_b = case when category in ('B', 'AB') and price_per_lesson_b is null then price_per_lesson else price_per_lesson_b end;

update profiles
set onboarding_completed = true
where role = 'student';
