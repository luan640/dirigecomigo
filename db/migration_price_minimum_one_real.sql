alter table instructors
  drop constraint if exists instructors_price_per_lesson_check,
  drop constraint if exists instructors_price_per_lesson_a_check,
  drop constraint if exists instructors_price_per_lesson_b_check;

alter table instructors
  add constraint instructors_price_per_lesson_check check (price_per_lesson >= 1),
  add constraint instructors_price_per_lesson_a_check check (price_per_lesson_a is null or price_per_lesson_a >= 1),
  add constraint instructors_price_per_lesson_b_check check (price_per_lesson_b is null or price_per_lesson_b >= 1);
