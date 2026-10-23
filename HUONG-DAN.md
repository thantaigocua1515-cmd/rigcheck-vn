# Hướng dẫn triển khai RigCheck VN — Checklist cho Khang

Làm theo thứ tự, đánh dấu từng bước khi xong. Toàn bộ kiến trúc: **web tĩnh trên Vercel + dữ liệu trên Supabase, không cần VPS**.

## Bước 1 — Tạo Supabase project mới

1. Vào https://supabase.com → đăng nhập → **New project**.
2. Đặt tên gợi ý: `rigcheck-vn`. Chọn region gần Việt Nam nhất: **Singapore (Southeast Asia)**.
3. Đặt mật khẩu database mạnh và lưu lại ở nơi an toàn (chỉ cần khi quản trị, không đưa vào code).
4. Chờ project khởi tạo xong (khoảng 1–2 phút).

## Bước 2 — Chạy SQL (schema trước, seed sau)

5. Trong project vừa tạo, mở **SQL Editor** → **New query**.
6. Mở file `supabase/schema.sql` trong thư mục này, copy toàn bộ → dán vào → **Run**. Thấy báo thành công là được (file này chạy lại nhiều lần vẫn an toàn).
7. Tạo query mới, làm tương tự với file `supabase/seed.sql` → **Run**.
8. Kiểm tra nhanh: mở **Table Editor** → bảng `components` phải có **95 dòng**, `laptops` **16 dòng**, `games` **27 dòng**, `fps_benchmarks` **567 dòng**.

## Bước 3 — Lấy URL + anon key

9. Vào **Project Settings → API**.
10. Copy 2 giá trị: **Project URL** và **anon public key** (khoá có chữ `anon`).
    ⚠️ **Không copy `service_role` key** — khoá đó là khoá quản trị toàn quyền, tuyệt đối không đưa vào web, không gửi qua chat thường.
11. Điền 2 giá trị vào file `js/supabase-config.js` (2 dòng `url` và `anonKey`), **hoặc** gửi URL + anon key cho Muse ở lượt chat thường để Muse điền và đẩy code giúp.

## Bước 4 — Tạo repo GitHub và deploy Vercel

12. Tạo repo GitHub mới (gợi ý tên: `rigcheck-vn`), đẩy toàn bộ thư mục này lên nhánh `main`.
13. Vào https://vercel.com → **Add New → Project** → Import repo `rigcheck-vn`.
14. Framework Preset chọn **Other** (web tĩnh thuần, không build command, output = thư mục gốc) → **Deploy**.
15. Chờ deploy xong, mở thử domain `*.vercel.app` được cấp.

## Bước 5 — Tắt SSO Protection (RẤT QUAN TRỌNG)

16. Trong project Vercel: **Settings → Deployment Protection** → tắt **Vercel Authentication / SSO Protection** (đặt `ssoProtection` = tắt cho Production).
    > Bài học từ các dự án trước: nếu quên bước này, chỉ mình bạn (đang đăng nhập Vercel) mới vào được web, khách sẽ bị chuyển sang trang đăng nhập Vercel.

## Bước 6 — Kiểm tra live sau deploy

17. Mở web bằng **trình duyệt ẩn danh / điện thoại không đăng nhập Vercel**: trang phải mở ngay, không hỏi đăng nhập.
18. Thử đủ 4 tab: Build PC (xoay được khung 3D, đổi linh kiện thấy cảnh báo tương thích), Check FPS (đổi game/độ phân giải thấy FPS đổi), Gợi ý (tạo được 3 gói), Phần mềm & Local AI (hiện khung "Sắp ra mắt").
19. Kiểm tra header trang: nếu đã điền Supabase config ở Bước 3, dòng trạng thái phải ghi **"Dữ liệu sống từ Supabase · Cập nhật lúc..."**. Nếu ghi "dữ liệu đóng gói" thì kiểm tra lại URL/anon key.
20. (Có domain riêng thì làm thêm) Gắn domain vào Vercel → tìm-thay `rigcheck-vn.vercel.app` bằng domain thật trong `index.html`, `robots.txt`, `sitemap.xml` → deploy lại → gửi sitemap lên Google Search Console.

## Khi cần cập nhật dữ liệu sau này

- **Sửa nhanh 1–2 món**: sửa trực tiếp trong Table Editor của Supabase (web tự lấy dữ liệu mới, không cần deploy lại).
- **Sửa hàng loạt**: sửa `js/data.js` → chạy `node tools/generate-seed.mjs` → chạy lại `seed.sql` trong SQL Editor (chỉ thêm dòng mới; dòng cũ đã có sẽ giữ nguyên nhờ `ON CONFLICT DO NOTHING` — muốn sửa giá dòng cũ thì sửa trong Table Editor hoặc xoá dòng rồi chạy lại seed).
- **Thêm benchmark FPS đo thật**: thêm dòng vào bảng `fps_benchmarks` với `confidence = 'measured'` và ghi `source` rõ ràng.
