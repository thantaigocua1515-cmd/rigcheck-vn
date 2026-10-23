-- ============================================================
-- RigCheck VN — Schema Supabase (chạy 1 lần trong SQL Editor)
-- Idempotent: chạy lại nhiều lần không lỗi, không mất dữ liệu.
-- Sau file này, chạy tiếp seed.sql để nạp dữ liệu ban đầu.
-- ============================================================

-- ---------- Bảng linh kiện PC ----------
-- specs chứa thông số riêng theo category (socket, tdp, perf, kích thước...)
create table if not exists public.components (
  id          bigint generated always as identity primary key,
  category    text not null,               -- cpus | gpus | mainboards | rams | ssds | psus | cases | coolers
  slug        text not null,               -- id ổn định phía app, vd 'r5-7500f'
  name        text not null,
  brand       text,
  specs       jsonb not null default '{}'::jsonb,
  price_vnd   bigint not null default 0,
  price_source text,                       -- nguồn đối chiếu giá
  updated_at  timestamptz not null default now(),
  unique (category, slug)
);

-- ---------- Bảng laptop ----------
create table if not exists public.laptops (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  brand       text,
  cpu         text,
  cpu_score   integer,
  gpu         text,
  gpu_perf    integer,                     -- đã hiệu chỉnh theo TGP
  tgp_watts   integer,                     -- TGP thực tế của GPU trên mẫu máy này
  ram_gb      integer,
  price_vnd   bigint not null default 0,
  price_source text,
  updated_at  timestamptz not null default now()
);

-- ---------- Bảng game ----------
create table if not exists public.games (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  genre       text,
  base_fps    numeric,                     -- FPS tham chiếu 1080p High với GPU perf=100, CPU score=100
  cpu_weight  numeric,                     -- 0 = nặng GPU, 1 = nặng CPU
  updated_at  timestamptz not null default now()
);

-- ---------- Bảng benchmark FPS ----------
-- Lưu số FPS theo tổ hợp game x GPU x CPU x độ phân giải x setting.
-- Có thể để trống: app tự nội suy khi không có dòng đo/seed tương ứng.
create table if not exists public.fps_benchmarks (
  id          bigint generated always as identity primary key,
  game_slug   text not null,
  gpu_slug    text not null,
  cpu_slug    text,                          -- slug CPU, hoặc 'any' = CPU trung tính (score 100)
  resolution  text not null default '1080',  -- 1080 | 1440 | 2160
  setting     text not null default 'high',  -- low | medium | high | ultra
  fps_min     integer,
  fps_avg     integer,
  fps_max     integer,
  source      text,                          -- nguồn benchmark tham chiếu
  confidence  text not null default 'interpolated', -- measured | interpolated | estimated
  updated_at  timestamptz not null default now(),
  unique (game_slug, gpu_slug, cpu_slug, resolution, setting)
);

-- ---------- Bảng phần mềm sáng tạo (mục sắp ra mắt) ----------
create table if not exists public.software_apps (
  id            bigint generated always as identity primary key,
  slug          text not null unique,
  name          text not null,
  category      text,
  focus         text,                      -- yếu tố phần cứng quan trọng nhất
  fit_level     text,                      -- mức phù hợp (để trống khi chưa chấm)
  vram_ram_note text,
  recommended   text,                      -- cấu hình đề xuất (để trống khi chưa có)
  updated_at    timestamptz not null default now()
);

-- ---------- Bảng công cụ Local AI (mục sắp ra mắt) ----------
create table if not exists public.ai_tools (
  id            bigint generated always as identity primary key,
  slug          text not null unique,
  name          text not null,
  category      text,
  focus         text,
  fit_level     text,
  vram_ram_note text,
  recommended   text,
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- Row Level Security: BẬT RLS + policy public read-only
-- Khách (anon) và người dùng đã đăng nhập CHỈ được SELECT.
-- Ghi/sửa/xoá chỉ thực hiện qua SQL Editor / service_role ở phía quản trị.
-- ============================================================
alter table public.components     enable row level security;
alter table public.laptops        enable row level security;
alter table public.games          enable row level security;
alter table public.fps_benchmarks enable row level security;
alter table public.software_apps enable row level security;
alter table public.ai_tools       enable row level security;

drop policy if exists "public read" on public.components;
drop policy if exists "public read" on public.laptops;
drop policy if exists "public read" on public.games;
drop policy if exists "public read" on public.fps_benchmarks;
drop policy if exists "public read" on public.software_apps;
drop policy if exists "public read" on public.ai_tools;

create policy "public read" on public.components     for select to anon, authenticated using (true);
create policy "public read" on public.laptops        for select to anon, authenticated using (true);
create policy "public read" on public.games          for select to anon, authenticated using (true);
create policy "public read" on public.fps_benchmarks for select to anon, authenticated using (true);
create policy "public read" on public.software_apps for select to anon, authenticated using (true);
create policy "public read" on public.ai_tools       for select to anon, authenticated using (true);

-- Chỉ mục hỗ trợ truy vấn phía app
create index if not exists idx_components_category on public.components (category);
create index if not exists idx_fps_game_gpu on public.fps_benchmarks (game_slug, gpu_slug);
