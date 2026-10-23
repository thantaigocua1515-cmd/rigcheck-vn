/*
 * RigCheck VN — Sinh supabase/seed.sql từ js/data.js
 * Chạy:  node tools/generate-seed.mjs
 * Mục đích: seed và dữ liệu nhúng trong app dùng CHUNG một nguồn sự thật (js/data.js),
 * tránh lệch dữ liệu khi sửa ở một nơi mà quên nơi còn lại.
 * Seed idempotent: mọi câu INSERT đều có ON CONFLICT ... DO NOTHING.
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = require(join(root, 'js', 'data.js'));

const esc = (s) => String(s ?? '').replace(/'/g, "''");
const q = (s) => `'${esc(s)}'`;
const json = (obj) => `${q(JSON.stringify(obj))}::jsonb`;
const SRC = DATA.priceSource;
const TS = DATA.updatedAt;

const lines = [];
lines.push('-- ============================================================');
lines.push('-- RigCheck VN — Seed dữ liệu (TỰ SINH từ js/data.js bằng');
lines.push('-- tools/generate-seed.mjs — KHÔNG sửa tay file này).');
lines.push(`-- Giá: ${SRC}. Mốc thời gian: ${TS}.`);
lines.push('-- Idempotent: chạy lại được, ON CONFLICT DO NOTHING.');
lines.push('-- ============================================================');
lines.push('');

// ---- components ----
const CATS = ['cpus', 'gpus', 'mainboards', 'rams', 'ssds', 'psus', 'cases', 'coolers'];
let compCount = 0;
for (const cat of CATS) {
  for (const item of DATA[cat]) {
    const { id, name, brand, price, ...specs } = item;
    lines.push(
      `insert into public.components (category, slug, name, brand, specs, price_vnd, price_source, updated_at) values (` +
      `${q(cat)}, ${q(id)}, ${q(name)}, ${q(brand || '')}, ${json(specs)}, ${price}, ${q(SRC)}, ${q(TS)}` +
      `) on conflict (category, slug) do nothing;`
    );
    compCount++;
  }
}
lines.push('');

// ---- laptops ----
for (const l of DATA.laptops) {
  lines.push(
    `insert into public.laptops (slug, name, brand, cpu, cpu_score, gpu, gpu_perf, tgp_watts, ram_gb, price_vnd, price_source, updated_at) values (` +
    `${q(l.id)}, ${q(l.name)}, ${q(l.brand)}, ${q(l.cpu)}, ${l.cpuScore}, ${q(l.gpu)}, ${l.gpuPerf}, ${l.tgp}, ${l.ram}, ${l.price}, ${q(SRC)}, ${q(TS)}` +
    `) on conflict (slug) do nothing;`
  );
}
lines.push('');

// ---- games ----
for (const g of DATA.games) {
  lines.push(
    `insert into public.games (slug, name, genre, base_fps, cpu_weight, updated_at) values (` +
    `${q(g.id)}, ${q(g.name)}, ${q(g.genre)}, ${g.baseFps}, ${g.cpuWeight}, ${q(TS)}` +
    `) on conflict (slug) do nothing;`
  );
}
lines.push('');

// ---- fps_benchmarks: nội suy từ cùng công thức phía app (1080p High, CPU trung tính score=100) ----
lines.push('-- Benchmark FPS nội suy (confidence = interpolated) cho mọi cặp game x GPU ở 1080p High.');
let benchCount = 0;
for (const g of DATA.games) {
  for (const gpu of DATA.gpus) {
    const avg = Math.max(5, Math.round(g.baseFps * Math.pow(gpu.perf / 100, 0.92)));
    const min = Math.max(3, Math.round(avg * 0.72));
    const max = Math.round(avg * 1.28);
    lines.push(
      `insert into public.fps_benchmarks (game_slug, gpu_slug, cpu_slug, resolution, setting, fps_min, fps_avg, fps_max, source, confidence, updated_at) values (` +
      `${q(g.id)}, ${q(gpu.id)}, 'any', '1080', 'high', ${min}, ${avg}, ${max}, 'Nội suy từ điểm hiệu năng tương đối (RigCheck)', 'interpolated', ${q(TS)}` +
      `) on conflict (game_slug, gpu_slug, cpu_slug, resolution, setting) do nothing;`
    );
    benchCount++;
  }
}
lines.push('');

// ---- software_apps / ai_tools: chỉ nạp khung, trường chấm điểm để trống ----
for (const s of DATA.software) {
  lines.push(
    `insert into public.software_apps (slug, name, category, focus, updated_at) values (` +
    `${q(s.id)}, ${q(s.name)}, ${q(s.category)}, ${q(s.focus)}, ${q(TS)}) on conflict (slug) do nothing;`
  );
}
lines.push('');
for (const s of DATA.aiTools) {
  lines.push(
    `insert into public.ai_tools (slug, name, category, focus, updated_at) values (` +
    `${q(s.id)}, ${q(s.name)}, ${q(s.category)}, ${q(s.focus)}, ${q(TS)}) on conflict (slug) do nothing;`
  );
}
lines.push('');

const out = join(root, 'supabase', 'seed.sql');
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`Đã sinh ${out}`);
console.log(`components=${compCount} laptops=${DATA.laptops.length} games=${DATA.games.length} fps_benchmarks=${benchCount} software=${DATA.software.length} ai_tools=${DATA.aiTools.length}`);
