/*
 * RigCheck VN — Cấu hình Supabase (dữ liệu sống)
 * ------------------------------------------------
 * Để BỐC dữ liệu mới nhất từ Supabase thay cho dữ liệu nhúng:
 *   1. Tạo project Supabase mới, chạy supabase/schema.sql rồi supabase/seed.sql (xem HUONG-DAN.md).
 *   2. Vào Project Settings → API, copy "Project URL" và "anon public key" điền vào dưới đây.
 *
 * ⚠️ CHỈ điền anon key (khoá công khai, an toàn để lộ ở phía trình duyệt vì đã có RLS
 *    public read-only bảo vệ). TUYỆT ĐỐI KHÔNG điền service_role key vào file này hay
 *    bất kỳ file nào phía client — khoá đó bỏ qua toàn bộ bảo mật.
 *
 * Để trống (mặc định) thì app tự chạy bằng dữ liệu nhúng trong js/data.js.
 */
window.RIGCHECK_SUPABASE = {
  url: 'https://rxfhoimmbsguqazupbql.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmhvaW1tYnNndXFhenVwYnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MjU5MzIsImV4cCI6MjEwODMwMTkzMn0.aZkgr8YBGwh5l1T9hv-MWsaEl2uoAT4y7eKFM1xt8Ok',
};
