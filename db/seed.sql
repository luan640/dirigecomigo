-- ============================================================
-- MeuInstrutor — Seed Data (demo / development)
-- Run AFTER schema.sql
-- NOTE: UUIDs here are fixed so they match the mock data IDs
--       used by the front-end (id '1'..'10' mapped to uuid v5)
-- ============================================================

-- ── 10 Fortaleza instructors (profiles + instructors) ────────
-- We use deterministic UUIDs so foreign keys are consistent.

do $$
declare
  -- instructor UUIDs (deterministic, safe for dev)
  u1  uuid := '00000000-0000-0000-0000-000000000001';
  u2  uuid := '00000000-0000-0000-0000-000000000002';
  u3  uuid := '00000000-0000-0000-0000-000000000003';
  u4  uuid := '00000000-0000-0000-0000-000000000004';
  u5  uuid := '00000000-0000-0000-0000-000000000005';
  u6  uuid := '00000000-0000-0000-0000-000000000006';
  u7  uuid := '00000000-0000-0000-0000-000000000007';
  u8  uuid := '00000000-0000-0000-0000-000000000008';
  u9  uuid := '00000000-0000-0000-0000-000000000009';
  u10 uuid := '00000000-0000-0000-0000-000000000010';
  -- student UUID
  s1  uuid := '00000000-0000-0000-0000-000000000100';
begin

  -- ── auth.users (must exist before profiles due to FK) ───────────
  -- Password for all demo accounts: Demo@12345
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  values
    ('00000000-0000-0000-0000-000000000000', u1,  'authenticated', 'authenticated', 'carlos@demo.com',   crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', u2,  'authenticated', 'authenticated', 'mariana@demo.com',  crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', u3,  'authenticated', 'authenticated', 'roberto@demo.com',  crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', u4,  'authenticated', 'authenticated', 'ana@demo.com',      crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', u5,  'authenticated', 'authenticated', 'jose@demo.com',     crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', u6,  'authenticated', 'authenticated', 'fernanda@demo.com', crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', u7,  'authenticated', 'authenticated', 'paulo@demo.com',    crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', u8,  'authenticated', 'authenticated', 'juliana@demo.com',  crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', u9,  'authenticated', 'authenticated', 'andre@demo.com',    crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', u10, 'authenticated', 'authenticated', 'beatriz@demo.com',  crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', s1,  'authenticated', 'authenticated', 'aluno@demo.com',    crypt('Demo@12345', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
  on conflict (id) do nothing;

  -- also insert into auth.identities so login works correctly
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
  values
    (gen_random_uuid(), u1,  'carlos@demo.com',   'email', jsonb_build_object('sub', u1::text,  'email', 'carlos@demo.com'),   now(), now(), now()),
    (gen_random_uuid(), u2,  'mariana@demo.com',  'email', jsonb_build_object('sub', u2::text,  'email', 'mariana@demo.com'),  now(), now(), now()),
    (gen_random_uuid(), u3,  'roberto@demo.com',  'email', jsonb_build_object('sub', u3::text,  'email', 'roberto@demo.com'),  now(), now(), now()),
    (gen_random_uuid(), u4,  'ana@demo.com',      'email', jsonb_build_object('sub', u4::text,  'email', 'ana@demo.com'),      now(), now(), now()),
    (gen_random_uuid(), u5,  'jose@demo.com',     'email', jsonb_build_object('sub', u5::text,  'email', 'jose@demo.com'),     now(), now(), now()),
    (gen_random_uuid(), u6,  'fernanda@demo.com', 'email', jsonb_build_object('sub', u6::text,  'email', 'fernanda@demo.com'), now(), now(), now()),
    (gen_random_uuid(), u7,  'paulo@demo.com',    'email', jsonb_build_object('sub', u7::text,  'email', 'paulo@demo.com'),    now(), now(), now()),
    (gen_random_uuid(), u8,  'juliana@demo.com',  'email', jsonb_build_object('sub', u8::text,  'email', 'juliana@demo.com'),  now(), now(), now()),
    (gen_random_uuid(), u9,  'andre@demo.com',    'email', jsonb_build_object('sub', u9::text,  'email', 'andre@demo.com'),    now(), now(), now()),
    (gen_random_uuid(), u10, 'beatriz@demo.com',  'email', jsonb_build_object('sub', u10::text, 'email', 'beatriz@demo.com'),  now(), now(), now()),
    (gen_random_uuid(), s1,  'aluno@demo.com',    'email', jsonb_build_object('sub', s1::text,  'email', 'aluno@demo.com'),    now(), now(), now())
  on conflict do nothing;

  -- profiles
  insert into profiles (id, full_name, email, phone, avatar_url, role) values
    (u1,  'Carlos Eduardo Santos',   'carlos@demo.com',   '(85) 98001-0001', 'https://randomuser.me/api/portraits/men/32.jpg',   'instructor'),
    (u2,  'Mariana Costa Lima',      'mariana@demo.com',  '(85) 98001-0002', 'https://randomuser.me/api/portraits/women/44.jpg', 'instructor'),
    (u3,  'Roberto Ferreira',        'roberto@demo.com',  '(85) 98001-0003', 'https://randomuser.me/api/portraits/men/56.jpg',   'instructor'),
    (u4,  'Ana Paula Oliveira',      'ana@demo.com',      '(85) 98001-0004', 'https://randomuser.me/api/portraits/women/18.jpg', 'instructor'),
    (u5,  'José Antônio Sousa',      'jose@demo.com',     '(85) 98001-0005', 'https://randomuser.me/api/portraits/men/71.jpg',   'instructor'),
    (u6,  'Fernanda Rocha',          'fernanda@demo.com', '(85) 98001-0006', 'https://randomuser.me/api/portraits/women/63.jpg', 'instructor'),
    (u7,  'Paulo Henrique Melo',     'paulo@demo.com',    '(85) 98001-0007', 'https://randomuser.me/api/portraits/men/12.jpg',   'instructor'),
    (u8,  'Juliana Medeiros',        'juliana@demo.com',  '(85) 98001-0008', 'https://randomuser.me/api/portraits/women/8.jpg',  'instructor'),
    (u9,  'André Luis Moura',        'andre@demo.com',    '(85) 98001-0009', 'https://randomuser.me/api/portraits/men/88.jpg',   'instructor'),
    (u10, 'Beatriz Nascimento',      'beatriz@demo.com',  '(85) 98001-0010', 'https://randomuser.me/api/portraits/women/29.jpg', 'instructor'),
    (s1,  'Aluno Demonstração',      'aluno@demo.com',    '(85) 99999-0000', null,                                               'student')
  on conflict (id) do nothing;

  -- instructors
  insert into instructors (id, bio, price_per_lesson, neighborhood, city, state, latitude, longitude, category, vehicle_brand, vehicle_type, is_verified, rating, review_count, total_lessons) values
    (u1,  'Instrutor com mais de 10 anos de experiência em Fortaleza. Especialista em primeiros habilitandos e reciclagem. Paciência e didática são meu diferencial.',     120, 'Aldeota',              'Fortaleza', 'CE', -3.7319, -38.5094, 'B', 'Honda Civic',    'Sedã',    true,  4.9, 47, 312),
    (u2,  'Formada em Ed. Física e instrutora de direção há 7 anos. Atendo em todo o setor leste. Horários flexíveis, inclusive aos finais de semana.',                    110, 'Meireles',             'Fortaleza', 'CE', -3.7248, -38.5001, 'B', 'Toyota Corolla', 'Sedã',    true,  4.8, 38, 224),
    (u3,  'Instrutor dedicado, atendo no bairro Benfica e proximidades. Ótimo para quem tem medo de dirigir — método gradual e reforço positivo.',                         95, 'Benfica',              'Fortaleza', 'CE', -3.7430, -38.5497, 'AB','Honda CG 160',   'Moto',    false, 4.7, 29, 178),
    (u4,  'Instrutora top — 100% de aprovação na primeira tentativa em 2025! Atendo no Cocó e Água Fria. Cat. B e AB.',                                                    130, 'Cocó',                 'Fortaleza', 'CE', -3.7482, -38.4810, 'AB','VW Polo',         'Hatch',   true,  5.0, 62, 401),
    (u5,  'Atendo na zona sul de Fortaleza. Preço justo e aulas de qualidade. Instrutor parceiro do DETRAN-CE. Acesso fácil pela Washington Soares.',                       85, 'Messejana',            'Fortaleza', 'CE', -3.8192, -38.5001, 'B', 'Chevy Onix',     'Hatch',   false, 4.6, 21, 145),
    (u6,  'Especializada em manobras de baliza e paralela. Ótimos resultados no exame de habilitação. Horários de manhã, tarde e noite.',                                   115, 'Dionísio Torres',      'Fortaleza', 'CE', -3.7419, -38.5149, 'B', 'Renault Kwid',   'Hatch',   true,  4.8, 33, 198),
    (u7,  'Instrutor tranquilo, sem pressão. Levo você do zero à aprovação na via pública. Também ofereço reciclagem para motoristas veteranos.',                          100, 'Parangaba',            'Fortaleza', 'CE', -3.7813, -38.5622, 'B', 'Fiat Uno',       'Hatch',   false, 4.7, 25, 166),
    (u8,  'Minhas aulas são dinâmicas e personalizadas. Atendo no Fátima e Bairro de Fátima. Aprovação garantida ou ressarcimento da última aula.',                        125, 'Fátima',               'Fortaleza', 'CE', -3.7534, -38.5271, 'B', 'Hyundai HB20',   'Hatch',   true,  4.9, 55, 337),
    (u9,  'Centro e adjacências. Aulas práticas focadas em trânsito urbano intenso. Aluno aprende a lidar com o caos do dia-a-dia fortalezense.',                           90, 'Centro',               'Fortaleza', 'CE', -3.7207, -38.5431, 'B', 'VW Gol',         'Hatch',   false, 4.5, 18, 134),
    (u10, 'Premium: veículo automático e manual disponíveis. Atendo Cidade dos Funcionários, Cambeba e Edson Queiroz. Parcelamento em até 3x.',                            140, 'Cidade dos Funcionários','Fortaleza','CE', -3.7937, -38.4855, 'B', 'Toyota Yaris',   'Sedã',    true,  4.8, 41, 267)
  on conflict (id) do nothing;

  -- update categories for multi-service instructors
  update instructors set categories = ARRAY['A','B']::vehicle_category[] where id in (u1, u3);
  update instructors set categories = ARRAY['B','C']::vehicle_category[] where id = u6;

  -- lesson packages
  insert into lesson_packages (instructor_id, name, description, lessons_count, price, category) values
    (u1, 'Pacote Iniciante',          '5 aulas para quem está aprendendo do zero. Acompanhamento próximo e método progressivo.',          5,  550,  'B'),
    (u1, 'Aprovação Express',         '10 aulas intensivas voltadas para a prova do DETRAN. Foco em manobras e percurso.',               10, 1050,  'B'),
    (u1, 'Habilitação Moto (Cat. A)', '5 aulas de 60 min com moto Honda CG 160. Ideal para quem quer a categoria A.',                    5,  480,  'A'),
    (u3, 'Dupla Habilitação',         '4 aulas de moto (Cat. A) + 4 de carro (Cat. B). Economize 15% em relação às aulas avulsas.',      8,  680,  'B'),
    (u3, 'Pacote Moto Completo',      '6 aulas de categoria A para quem quer a habilitação de moto do zero.',                            6,  510,  'A'),
    (u4, '5 Aulas Premium',           'Pacote com 5 aulas e relatório de desempenho individualizado após cada aula.',                     5,  600,  'B'),
    (u4, 'Aprovação Garantida',       '10 aulas + 2 simulados de prova + revisão teórica. O mais completo da região.',                  12, 1400,  'B'),
    (u6, 'Pacote Caminhão (Cat. C)',  '6 aulas para habilitação de caminhão. Treinamento em veículo próprio, categoria C.',              6,  780,  'C'),
    (u6, 'Pacote Carro 5 Aulas',      '5 aulas de categoria B com horário estendido de segunda a sábado.',                               5,  530,  'B'),
    (u8, 'Anti-Reprovação',           '6 aulas focadas em quem foi reprovado no DETRAN. Técnicas para superar nervosismo.',              6,  700,  'B'),
    (u8, 'Pacote Completo',           '8 aulas progressivas do zero até a aprovação. Feedback em vídeo após cada aula.',                 8,  900,  'B')
  on conflict do nothing;

  -- student
  insert into students (id) values (s1) on conflict (id) do nothing;

  -- subscriptions (all active, renew next month)
  insert into subscriptions (instructor_id, status, amount, current_period_start, current_period_end) values
    (u1,  'active', 15, current_date - 15, current_date + 15),
    (u2,  'active', 15, current_date - 10, current_date + 20),
    (u3,  'active', 15, current_date -  5, current_date + 25),
    (u4,  'active', 15, current_date -  1, current_date + 29),
    (u5,  'active', 15, current_date - 20, current_date + 10),
    (u6,  'active', 15, current_date - 12, current_date + 18),
    (u7,  'active', 15, current_date -  8, current_date + 22),
    (u8,  'active', 15, current_date -  3, current_date + 27),
    (u9,  'active', 15, current_date - 25, current_date +  5),
    (u10, 'active', 15, current_date - 18, current_date + 12)
  on conflict do nothing;

  -- availability for instructor 1 — next 7 days, multiple slots per day
  insert into instructor_availability (instructor_id, date, start_time, end_time) values
    (u1, current_date + 1, '08:00', '09:00'),
    (u1, current_date + 1, '10:00', '11:00'),
    (u1, current_date + 1, '14:00', '15:00'),
    (u1, current_date + 2, '09:00', '10:00'),
    (u1, current_date + 2, '11:00', '12:00'),
    (u1, current_date + 3, '08:00', '09:00'),
    (u1, current_date + 3, '16:00', '17:00'),
    (u1, current_date + 5, '09:00', '10:00'),
    (u1, current_date + 5, '13:00', '14:00'),
    (u1, current_date + 7, '10:00', '11:00'),
    -- instructor 4
    (u4, current_date + 1, '07:00', '08:00'),
    (u4, current_date + 1, '15:00', '16:00'),
    (u4, current_date + 2, '08:00', '09:00'),
    (u4, current_date + 3, '17:00', '18:00'),
    (u4, current_date + 4, '09:00', '10:00'),
    -- instructor 8
    (u8, current_date + 1, '08:00', '09:00'),
    (u8, current_date + 2, '14:00', '15:00'),
    (u8, current_date + 4, '09:00', '10:00'),
    (u8, current_date + 6, '10:00', '11:00')
  on conflict do nothing;

  -- sample bookings
  insert into bookings (id, student_id, instructor_id, scheduled_date, start_time, end_time, status, total_amount, platform_fee, instructor_net) values
    (uuid_generate_v4(), s1, u1, current_date + 1, '10:00', '11:00', 'confirmed', 120, 9.60,  110.40),
    (uuid_generate_v4(), s1, u4, current_date + 3, '09:00', '10:00', 'pending',   130, 10.40, 119.60),
    (uuid_generate_v4(), s1, u2, current_date - 7, '14:00', '15:00', 'completed', 110, 8.80,  101.20),
    (uuid_generate_v4(), s1, u8, current_date - 14,'09:00', '10:00', 'completed', 125, 10.00, 115.00),
    (uuid_generate_v4(), s1, u1, current_date - 21,'11:00', '12:00', 'completed', 120, 9.60,  110.40)
  on conflict do nothing;

  -- reviews for completed bookings (simplified — no booking_id FK for brevity)
  -- In production you'd link review.booking_id <-> booking.id
  insert into reviews (booking_id, student_id, instructor_id, rating, comment)
  select b.id, b.student_id, b.instructor_id,
    case b.instructor_id when u2 then 5 when u8 then 5 else 5 end,
    case b.instructor_id
      when u2 then 'Ótima instrutora, muito paciente e didática!'
      when u8 then 'Aprovei na primeira tentativa. Super recomendo!'
      else 'Excelente aula, profissional de alto nível.'
    end
  from bookings b
  where b.status = 'completed' and b.student_id = s1
  on conflict do nothing;

end $$;
