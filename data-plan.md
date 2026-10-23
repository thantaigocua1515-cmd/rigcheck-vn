# RigCheck VN — Kế hoạch dữ liệu FPS thật

> Groundwork chuẩn bị ngày 2026-10-23 ~12:15 (+07). Prototype hiện dùng **số liệu mẫu minh họa**;
> tài liệu này là bản đồ để thay bằng dữ liệu thật khi Khang chốt đi tiếp. Chưa có quyết định nào được đưa ra.

## 1. Nguồn dữ liệu đã kiểm chứng (tìm kiếm web ngày 2026-10-23)

### fpsbench.com — database đúng hình dạng cần (PHÁT HIỆN MỚI)
- URL mẫu: `https://fpsbench.com/game/overpower/intel-core-i5-14400f-nvidia-geforce-rtx-3070-ti`
- Cấu trúc trang: CPU + GPU + game → **bảng FPS 3 độ phân giải (1080p/1440p/4K) × 4 mức setting (Low/Med/High/Ultra)**, có avg FPS, ranking combo (vd 694/1744), link chéo "same CPU other GPUs" / "same GPU other CPUs" / "other games same combo".
- Đây chính là schema RigCheck cần: `gpu × cpu × game × resolution × preset → avg_fps`.
- ⚠️ **Chưa kiểm chứng chất lượng**: số liệu trình bày như "measured" nhưng không rõ phương pháp đo (có dấu hiệu site gen hàng loạt). Dùng làm **seed + cross-check**, không tin tuyệt đối. Cần đối chiếu 1-2 combo với TechPowerUp trước khi lấy số.

### TechPowerUp (techpowerup.com) — benchmark desktop chuẩn nhất
- Mỗi review GPU có ~20 game chart riêng + bảng **relative performance** (%, cùng test rig, cùng driver) — cộng đồng Tom's Hardware/AnandTech đều coi là source đầu tiên nên xem.
- Cách dùng: lấy số FPS tuyệt đối từ review của GPU flagship mới nhất (vd RTX 5070/4090 review), rồi scale các GPU khác bằng relative performance %. Công thức: `fps_gpu = fps_ref × rel_perf_gpu / rel_perf_ref`.
- Game suite của TPU (~20 game AAA, update theo năm) — lấy làm baseline, game VN hot không có trong suite thì nội suy.

### Notebookcheck (notebookcheck.net) — laptop: GPU + TGP
- Mỗi review laptop ghi rõ **TGP thực tế** (vd RTX 3080 95W vs 150W cho FPS khác nhau rõ rệt) + benchmark game riêng từng máy.
- Có list tổng hợp "laptops featuring RTX 30xx with TGP" — dùng để tag TGP cho từng model laptop trong DB RigCheck (đây là điểm ăn tiền mà PCPartPicker không có).
- Cách dùng: với mỗi laptop mẫu, ghi TGP; FPS_laptop = FPS_desktop_cùng_GPU × hệ số TGP (Notebookcheck/Jarrod'sTech có số so sánh trực tiếp).

### Jarrod'sTech (YouTube) — so sánh laptop GPU theo TGP
- Video so sánh cùng GPU ở các mức TGP khác nhau — dùng để hiệu chỉnh hệ số TGP.

## 2. Schema dữ liệu đề xuất (Supabase)

```
gpu_baseline: gpu_id, game_id, resolution, preset, avg_fps, low1p_fps, source, confidence ('measured'|'interpolated'|'estimated'), measured_rig
gpu_relative: gpu_id, rel_perf_pct            -- từ TPU relative performance
game_resolution_scale: game_id, from_res, to_res, factor   -- vd 1440p ≈ 0.65× 1080p (tùy game)
setting_scale: preset_from, preset_to, factor -- vd Ultra→High ≈ 1.25×
laptop_models: model, gpu_id, tgp_watts, tgp_factor  -- hệ số so với desktop
cpu_bottleneck: cpu_id, gpu_tier, res, bottleneck_pct
```

Công thức ước tính khi thiếu số đo trực tiếp (đã nêu trong chat với Khang, giữ nguyên):
`FPS ≈ baseline_gpu × hệ số CPU × hệ số RAM × hệ số resolution × hệ số setting × hệ số TGP(laptop)`
Mỗi số hiển thị kèm nhãn **"Đo thực tế" / "Ước tính (độ tin cậy Cao/TB)"** + nguồn.

## 3. Lộ trình thu thập (đề xuất, chờ Khang duyệt)

1. **Seed thủ công ~50 combo hot nhất VN** (RTX 4060/4060Ti/4070 + Valorant/CS2/PUBG/Genshin/Cyberpunk/Black Myth ở 1080p/1440p): lấy từ TPU + fpsbench cross-check, nhập tay vào Supabase. Đủ để demo "bản thật".
2. **Mở rộng bằng relative performance**: scale ra 30 GPU desktop mà không cần đo từng cái.
3. **Laptop**: 40-50 model phổ biến VN (Legion, ROG Strix, Nitro, TUF...) — tag TGP từ Notebookcheck, hệ số từ Jarrod'sTech.
4. **Dài hạn**: form "báo FPS thực tế" cho cộng đồng (có mod duyệt) + crawl có phép từ TPU/fpsbench nếu họ cho phép (check robots/ToS trước; không scrape lậu ồ ạt).

## 4. Việc KHÔNG làm lúc này
- Không tự động scrape fpsbench/TPU hàng loạt (chưa rõ license/ToS, số liệu fpsbench chưa verify).
- Không hứa "số chính xác 100%" — luôn ghi ước tính khi là ước tính (Khang đã đồng ý nguyên tắc này trong chat).
