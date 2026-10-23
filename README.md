# RigCheck VN — Website hỗ trợ build PC & laptop

Công cụ web (tiếng Việt, giao diện trắng hiện đại) giúp:

1. **Build PC 3D** — chọn 8 loại linh kiện, xem trước bằng mô hình 3D (Three.js), kiểm tra tương thích thời gian thực (socket, DDR4/DDR5, kích thước GPU/tản vs case, công suất PSU), cảnh báo nghẽn cổ chai, tổng giá + điện năng, sao chép cấu hình, tải báo giá `.txt`.
2. **Check FPS** — dùng build PC hoặc chọn laptop có sẵn (tính theo TGP GPU từng mẫu), chọn game + độ phân giải + setting + DLSS/FSR/Frame Gen → FPS tối thiểu / trung bình / tối đa *(ước tính nội suy từ benchmark — luôn ghi rõ trong trang)*.
3. **Gợi ý theo game** — chọn game + FPS mục tiêu + ngân sách → 3 gói Tối thiểu / Khuyên dùng / Max + laptop tương đương, áp dụng thẳng sang tab Build.
4. **Phần mềm & Local AI** *(khung sắp ra mắt)* — 8 phần mềm sáng tạo + 4 công cụ AI, cấu trúc sẵn sàng để chấm điểm sau, không dùng số liệu bịa.

## Cấu trúc thư mục

```
rigcheck-vn/
├── index.html            # Trang chính: SEO meta/OG/JSON-LD, 4 tab + nội dung SEO + FAQ
├── robots.txt            # Domain placeholder rigcheck-vn.vercel.app
├── sitemap.xml           # Thay domain khi có domain thật
├── vercel.json           # Cấu hình hosting tĩnh trên Vercel + headers
├── css/
│   └── styles.css
├── js/
│   ├── data.js           # Dữ liệu nhúng (seed/fallback): 95 linh kiện, 16 laptop, 27 game, 8 phần mềm, 4 AI
│   ├── supabase-config.js# Điền URL + anon key Supabase tại đây (để trống = dùng dữ liệu nhúng)
│   └── app.js            # Toàn bộ logic: build, tương thích, FPS, gợi ý, 3D, tải dữ liệu sống
├── supabase/
│   ├── schema.sql        # Tạo bảng + RLS public read-only (chạy 1 lần, idempotent)
│   └── seed.sql          # Dữ liệu ban đầu — TỰ SINH từ js/data.js, đừng sửa tay
├── tools/
│   └── generate-seed.mjs # node tools/generate-seed.mjs → sinh lại supabase/seed.sql
├── HUONG-DAN.md          # Checklist triển khai cho Khang (Supabase → GitHub → Vercel)
└── data-plan.md          # Kế hoạch dữ liệu FPS thật (tài liệu chuẩn bị trước)
```

## Chạy local

Không cần build step. Chỉ cần một server tĩnh đơn giản:

```bash
cd rigcheck-vn
npx serve .            # hoặc: python3 -m http.server 8080
# Mở http://localhost:8080 (hoặc cổng serve in ra)
```

> Khung 3D cần tải Three.js từ CDN nên lần mở đầu cần có mạng. Nếu CDN không tải được, trang hiện thông báo dự phòng và mọi chức năng khác vẫn chạy.

## Dữ liệu sống (Supabase)

- Để trống `js/supabase-config.js`: app chạy 100% bằng dữ liệu nhúng trong `js/data.js` và ghi rõ trạng thái này ở header.
- Điền URL + **anon key** (xem `HUONG-DAN.md`): app thử đọc dữ liệu mới nhất từ Supabase REST khi mở trang và hiển thị "Dữ liệu cập nhật lúc..."; nếu fetch lỗi sẽ tự fallback về dữ liệu nhúng.
- **Không bao giờ** đặt `service_role` key vào bất kỳ file nào phía client.
- Giá trong dữ liệu nhúng là đối chiếu niêm yết online tại các shop linh kiện VN, thời điểm 10/2026, chỉ mang tính tham khảo. Sau khi sửa giá/dữ liệu trong `js/data.js`, chạy lại `node tools/generate-seed.mjs` để đồng bộ `supabase/seed.sql`.

## SEO

Đã có sẵn: title/meta description từ khoá, Open Graph, Twitter Card, JSON-LD (WebSite + WebApplication + FAQPage), đúng 1 H1, 5 section nội dung + FAQ 5 câu index được, `robots.txt`, `sitemap.xml`, canonical. Tất cả đang trỏ domain placeholder `https://rigcheck-vn.vercel.app` — khi có domain thật, tìm-thay chuỗi này trong `index.html`, `robots.txt`, `sitemap.xml`.
