-- ============================================================
-- RigCheck VN — Cập nhật tab "Phần mềm & Model AI" (chạy 1 lần trong SQL Editor)
-- Idempotent: chạy lại nhiều lần an toàn, không mất dữ liệu.
-- Gồm: thêm cột req cho software_apps + nạp req cho 8 phần mềm,
-- tạo bảng ai_models (13 model AI chạy local) + RLS public read + nạp dữ liệu.
-- File này được sinh từ js/data.js — nguồn sự thật duy nhất của dự án.
-- ============================================================

-- 1) Cột req cho software_apps
alter table public.software_apps add column if not exists req jsonb;

-- 2) Nạp hồ sơ yêu cầu (req) cho 8 phần mềm
update public.software_apps set req = '{"cpuW":0.45,"gpuW":0.3,"ramW":0.25,"minCpu":85,"recCpu":105,"minGpu":82,"recGpu":120,"minVram":4,"recVram":8,"minRam":16,"recRam":32}'::jsonb, updated_at = now() where slug = 'premiere';
update public.software_apps set req = '{"cpuW":0.25,"gpuW":0.5,"ramW":0.25,"minCpu":85,"recCpu":100,"minGpu":100,"recGpu":150,"minVram":8,"recVram":16,"minRam":16,"recRam":32}'::jsonb, updated_at = now() where slug = 'davinci';
update public.software_apps set req = '{"cpuW":0.5,"gpuW":0.2,"ramW":0.3,"minCpu":84,"recCpu":104,"minGpu":45,"recGpu":82,"minVram":2,"recVram":4,"minRam":16,"recRam":32}'::jsonb, updated_at = now() where slug = 'photoshop';
update public.software_apps set req = '{"cpuW":0.6,"gpuW":0.15,"ramW":0.25,"minCpu":84,"recCpu":108,"minGpu":45,"recGpu":75,"minVram":2,"recVram":4,"minRam":16,"recRam":32}'::jsonb, updated_at = now() where slug = 'illustrator';
update public.software_apps set req = '{"cpuW":0.35,"gpuW":0.15,"ramW":0.5,"minCpu":90,"recCpu":110,"minGpu":75,"recGpu":105,"minVram":4,"recVram":8,"minRam":32,"recRam":64}'::jsonb, updated_at = now() where slug = 'afterfx';
update public.software_apps set req = '{"cpuW":0.2,"gpuW":0.6,"ramW":0.2,"minCpu":80,"recCpu":100,"minGpu":90,"recGpu":175,"minVram":8,"recVram":16,"minRam":16,"recRam":32}'::jsonb, updated_at = now() where slug = 'blender';
update public.software_apps set req = '{"cpuW":0.6,"gpuW":0.2,"ramW":0.2,"minCpu":84,"recCpu":100,"minGpu":45,"recGpu":82,"minVram":2,"recVram":4,"minRam":16,"recRam":32}'::jsonb, updated_at = now() where slug = 'autocad';
update public.software_apps set req = '{"cpuW":0.3,"gpuW":0.4,"ramW":0.3,"minCpu":72,"recCpu":90,"minGpu":45,"recGpu":82,"minVram":4,"recVram":6,"minRam":16,"recRam":16}'::jsonb, updated_at = now() where slug = 'obs';

-- 3) Bảng model AI chạy local
create table if not exists public.ai_models (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  kind        text,
  params      text,
  vram        jsonb not null default '{}'::jsonb,
  runner      text,
  note        text,
  updated_at  timestamptz not null default now()
);
alter table public.ai_models enable row level security;
drop policy if exists "public read" on public.ai_models;
create policy "public read" on public.ai_models for select to anon, authenticated using (true);

-- 4) Nạp 13 model (chạy lại thì cập nhật theo dữ liệu mới nhất)
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('phi-3.5-mini', 'Phi-3.5 Mini', 'LLM', '3.8B', '{"fp16":9,"q8":5,"q4":3.5}'::jsonb, 'Ollama / LM Studio', 'Model nhỏ của Microsoft, nhanh, hợp máy yếu và tác vụ phụ trợ.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('mistral-7b', 'Mistral 7B', 'LLM', '7B', '{"fp16":15.5,"q8":8.5,"q4":5.5}'::jsonb, 'Ollama / LM Studio', 'Gọn, phản hồi nhanh, tiếng Anh tốt; bản Instruct hợp chat phổ thông.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('qwen2.5-7b', 'Qwen2.5 7B', 'LLM', '7B', '{"fp16":15.5,"q8":8.5,"q4":5.5}'::jsonb, 'Ollama / LM Studio', 'Đa ngôn ngữ tốt (có tiếng Việt), cân bằng tốc độ / chất lượng ở cỡ 7B.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('llama-3.1-8b', 'Llama 3.1 8B', 'LLM', '8B', '{"fp16":17.5,"q8":9.5,"q4":6.5}'::jsonb, 'Ollama / LM Studio', 'Model phổ thông nhất của Meta, hệ sinh thái fine-tune / GGUF rất lớn.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('gemma-2-9b', 'Gemma 2 9B', 'LLM', '9B', '{"fp16":19.5,"q8":10.5,"q4":6.5}'::jsonb, 'Ollama / LM Studio', 'Của Google, chất lượng trả lời cao so với kích thước 9B.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('qwen2.5-14b', 'Qwen2.5 14B', 'LLM', '14B', '{"fp16":29.5,"q8":16,"q4":10}'::jsonb, 'Ollama / LM Studio', 'Bước nhảy chất lượng rõ rệt so với 7B, vẫn vừa GPU 12GB ở Q4.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('gemma-2-27b', 'Gemma 2 27B', 'LLM', '27B', '{"fp16":55.5,"q8":29.5,"q4":17.5}'::jsonb, 'Ollama / LM Studio', '27B của Google, mạnh về suy luận và viết lách, cần VRAM khá.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('qwen2.5-32b', 'Qwen2.5 32B', 'LLM', '32B', '{"fp16":65.5,"q8":35,"q4":21}'::jsonb, 'Ollama / LM Studio', 'Cỡ 32B đa ngôn ngữ mạnh, Q4 là lựa chọn thực tế cho GPU 24GB.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('qwen2.5-coder-32b', 'Qwen2.5-Coder 32B', 'LLM', '32B', '{"fp16":65.5,"q8":35,"q4":21}'::jsonb, 'Ollama / LM Studio', 'Chuyên lập trình, thuộc nhóm code model chạy local tốt nhất hiện nay.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('llama-3.1-70b', 'Llama 3.1 70B', 'LLM', '70B', '{"fp16":141.5,"q8":75,"q4":43.5}'::jsonb, 'Ollama / LM Studio', 'Cỡ lớn tiệm cận model đám mây; Q4 vẫn cần ~43GB — vượt mọi GPU đơn lẻ phổ thông.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('sd-1.5', 'Stable Diffusion 1.5', 'Ảnh', '0.9B', '{"fp16":6,"q8":4,"q4":null}'::jsonb, 'ComfyUI / A1111', 'Nhẹ và nhanh, kho LoRA / checkpoint khổng lồ, chạy được trên GPU 4–6GB.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('sdxl', 'SDXL', 'Ảnh', '2.6B', '{"fp16":12,"q8":8,"q4":null}'::jsonb, 'ComfyUI / A1111', 'Chuẩn tạo ảnh phổ biến hiện nay, ảnh gốc 1024px, cần ~8–12GB VRAM.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
insert into public.ai_models (slug, name, kind, params, vram, runner, note, updated_at) values ('flux.1-dev', 'FLUX.1 dev', 'Ảnh', '12B', '{"fp16":24,"q8":16,"q4":12}'::jsonb, 'ComfyUI / A1111', 'Chất lượng ảnh rất cao (văn bản trong ảnh tốt); bản FP8 ~16GB, bản GGUF Q4 ~12GB.', now()) on conflict (slug) do update set name = excluded.name, kind = excluded.kind, params = excluded.params, vram = excluded.vram, runner = excluded.runner, note = excluded.note, updated_at = now();
