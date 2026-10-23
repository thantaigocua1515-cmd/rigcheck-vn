# PLAN — RigCheck VN đợt tiếp theo (CHƯA LÀM — chờ Khang duyệt)

Ghi ngày 2026-10-23. Hai ý tưởng của Khang:
1. Tự động cập nhật thêm nhiều linh kiện + laptop (gồm dòng workstation) mà không phải thêm thủ công.
2. Khung 3D tương tác hai chiều: chọn linh kiện ở danh sách thì vùng đó trên 3D sáng lên; bấm thẳng vào từng vùng trên khung 3D để chọn linh kiện.

---

## Ý tưởng 2 — 3D tương tác hai chiều (đề xuất làm trước: nhỏ, hiệu quả thấy ngay)

Nền đã sẵn: model GLB đã tách 13 nhóm có tên (CASE/BOARD/GPU_STD/GPU_LONG/COOLER_AIO/COOLER_AIR/RAM_1..4/PSU) và web đã có cơ chế phát sáng đỏ theo nhóm khi lỗi tương thích.

### Chiều 1: chọn ở danh sách → 3D sáng vùng tương ứng
- Khi người dùng focus/đổi lựa chọn ở picker của một loại linh kiện, nhóm 3D tương ứng phát sáng (emissive) vừa phải + hiện nhãn tên/giá của món đang chọn.
- Đổi sang loại khác thì highlight chuyển theo; rời khỏi khu vực chọn thì mờ dần về bình thường.
- Ánh xạ: GPU → GPU_STD/GPU_LONG (nhóm đang hiện), tản → COOLER_AIO/COOLER_AIR (nhóm đang hiện), main → BOARD, RAM → RAM_1..4, case → CASE, nguồn → PSU, CPU → khối tản (phần che CPU: block AIO hoặc tháp tản).

### Chiều 2: bấm thẳng vào khung 3D → mở chọn linh kiện
- Dùng raycast theo nhóm mesh; loại trừ vật liệu kính khỏi raycast để tia không bị mặt kính chắn.
- Hover (desktop): đổi con trỏ, nhóm sáng nhẹ, tooltip hiện tên + giá linh kiện hiện tại của vùng đó.
- Click/chạm (mobile): cuộn tới đúng picker của loại linh kiện đó và mở danh sách để chọn; phân biệt "click" với "kéo xoay" bằng ngưỡng di chuyển chuột để không phá thao tác xoay/zoom hiện có.
- SSD chưa có hình riêng trong model (nằm trên mainboard): đợt này highlight chung với BOARD + tooltip ghi rõ; nếu Khang muốn SSD có vùng riêng thì dựng thêm chi tiết SSD trong Blender (việc nhỏ, làm kèm được).

### Kiểm chứng
- Chụp ảnh trình duyệt thật: highlight từng nhóm (GPU, tản, RAM), ca click vào GPU mở đúng picker GPU, ca lỗi tương thích vẫn đỏ (highlight tương tác không đè cơ chế báo lỗi).
- Phạm vi: áp cho chế độ GLB; chế độ dự phòng khối hộp giữ nguyên như cũ.

---

## Ý tưởng 1 — Tự động mở rộng dữ liệu linh kiện + laptop (việc lớn, chia 2 đợt)

### Kiến trúc pipeline 4 bước (không bao giờ ghi thẳng lên dữ liệu đang chạy)
1. **Thu thập**: job chạy tự động theo lịch (GitHub Actions, miễn phí, 1 lần/tuần) đọc các nguồn công khai dưới đây.
2. **Chuẩn hoá**: map tên/specs về đúng schema hiện tại của Supabase (components/laptops), quy đổi điểm hiệu năng về thang điểm của site, khử trùng theo tên chuẩn hoá.
3. **Hàng chờ duyệt**: dữ liệu mới/chênh lệch vào bảng staging riêng với trạng thái chờ duyệt — KHÔNG tự lên web.
4. **Xuất bản**: Khang duyệt (xem mục "Trang duyệt") → chuyển sang bảng chính → web tự cập nhật, không cần deploy.

### Nguồn dữ liệu theo loại (đã khảo sát sơ bộ)
- **Điểm hiệu năng CPU/GPU**: danh sách công khai của PassMark (CPU Mark / G3D Mark) — không có API chính thức miễn phí, đọc trang danh sách công khai ở tần suất thấp + ghi nguồn. Phương án dự phòng: Geekbench Browser.
- **Specs GPU** (VRAM, TDP...): TechPowerUp GPU Database (trang công khai). Lưu ý: chiều dài card theo hãng AIB vẫn là ước lượng theo dòng, pipeline sẽ đánh dấu rõ mục nào là ước lượng.
- **Laptop (gaming + phổ thông)**: Open Icecat — catalog sản phẩm có dữ liệu cấu trúc (JSON/XML, có tầng miễn phí), đối chiếu điểm bằng Notebookcheck.
- **Workstation**: Lenovo PSREF (dữ liệu specs cấu trúc của Lenovo, cập nhật ~3 tuần/lần, có ThinkPad P/ThinkStation) cho dòng Lenovo; Dell Precision / HP ZBook lấy qua Icecat. Bổ sung GPU workstation (RTX PRO/Ada) vào components để tab Phần mềm chấm điểm đồ hoạ/CAD chuẩn hơn cho máy trạm.
- **Thay đổi dữ liệu kèm theo**: bảng laptops thêm trường `line` (Gaming / Workstation / Phổ thông) + bộ lọc theo dòng ở nơi chọn laptop.

### Giá Việt Nam — điểm khó nhất, cần Khang chốt hướng
Không shop VN nào có API giá công khai. Hai hướng:
- **Hướng A (đề xuất cho đợt 1)**: giá vẫn là snapshot "tham khảo" do pipeline đề xuất từ giá niêm yết quốc tế/quy đổi hoặc giữ nguyên giá cũ; mỗi đợt duyệt Khang liếc qua giá trước khi xuất bản. An toàn, không phụ thuộc shop.
- **Hướng B (đợt 2, nếu Khang muốn)**: price-watch — mỗi sản phẩm gắn 1–2 link shop, job đọc giá trang công khai theo lịch. Rủi ro thật: shop có thể chặn bot/đổi giao diện → đọc sai hoặc hỏng; cơ chế bắt buộc: chỉ cập nhật khi đọc thành công, chênh lệch >15% thì vào hàng chờ duyệt chứ không tự áp dụng.

### Trang duyệt dữ liệu
- Một trang quản trị nhẹ (mật khẩu riêng, không liên kết công khai): liệt kê mục chờ duyệt theo đợt, sửa nhanh từng trường, nút Duyệt / Từ chối. Không duyệt thì không lên web.

### Rủi ro & nguyên tắc an toàn
- Nguồn ngoài đổi cấu trúc trang → job lỗi thì bỏ qua đợt đó, tuyệt đối không ghi đè dữ liệu đang tốt (fail-safe, có log đợt chạy).
- Trùng tên giữa bản laptop/desktop của cùng GPU → khoá chuẩn hoá tên + hậu tố phân biệt.
- Dữ liệu điểm benchmark là số liệu tổng hợp công khai — ghi nguồn ở chân trang dữ liệu, không sao chép nội dung bài viết của ai.

### Phạm vi đợt 1 đề xuất
- Pipeline + staging + trang duyệt + 2 nguồn (PassMark cho điểm, Icecat/PSREF cho laptop).
- Mục tiêu: +50–80 linh kiện/laptop, trong đó ~10 mẫu workstation (ThinkPad P, Precision, ZBook).
- Giá theo Hướng A. Price-watch (Hướng B) để đợt 2 nếu Khang chốt.

---

## Thứ tự triển khai đề xuất
1. Ý tưởng 2 (3D tương tác) — 1 đợt, xong là thấy ngay trên web.
2. Ý tưởng 1 đợt 1 (pipeline + duyệt + laptop/workstation) — sau khi chốt hướng giá.
3. Ý tưởng 1 đợt 2 (price-watch) — chỉ khi Khang muốn và Hướng B được duyệt riêng.

## Điểm cần Khang chốt
1. Thứ tự: làm Ý tưởng 2 trước như đề xuất, hay ưu tiên Ý tưởng 1?
2. Giá: Hướng A (snapshot qua duyệt) hay tính luôn Hướng B (price-watch đọc trang shop)?
3. Trang duyệt dữ liệu: làm luôn trong đợt 1 của Ý tưởng 1 (đề xuất: có)?
4. SSD trong 3D: highlight chung với mainboard, hay dựng thêm chi tiết SSD riêng trong Blender?
