# Live2D playground: chạy easy-live2d và đưa Dania vào

Trang `/live2d` của app Laravel hiển thị một model Cubism (`.model3.json` + `.moc3`) bằng [easy-live2d](https://github.com/Panzer-Jack/easy-live2d) 1.0.0 trên PixiJS 8. Trang có sẵn các điều khiển: chọn model, chạy motion, đổi expression, lip sync từ file âm thanh hoặc micro, kéo tham số, nhìn theo con trỏ và kéo model.

`Dania.png` chưa phải là model. Ảnh phải qua 2 công cụ chạy trên máy Windows của bạn: See-through để tách layer, rồi psd2live để auto-rig và xuất `.moc3`. Phần 2 bên dưới hướng dẫn từng bước.

## 1. Chạy trang /live2d với model mẫu

Chạy một lần ở thư mục gốc của repo:

```bash
composer install
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate
npm install
npm run live2d:core -- --accept-license     # Cubism Core R5 -> public/assets/live2d/core/
npm run live2d:sample -- --accept-license   # Hiyori, Haru -> public/assets/live2d/samples/
npm run build                               # hoặc: npm run dev
php artisan serve
```

Mở `http://127.0.0.1:8000/live2d`. Có thể chọn model qua tham số, ví dụ `?model=Haru`.

Hai lệnh có `--accept-license` tải phần mềm và dữ liệu của Live2D. Đọc license trước khi chạy:

- **Cubism Core:** [Live2D Proprietary Software License](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html). Lệnh tải gói chính thức `CubismSdkForWeb-5-r.5.zip`, kiểm tra SHA-256 rồi chỉ giải nén thư mục `Core/`.
- **Model mẫu:** [Live2D Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html).
- **Framework đi kèm easy-live2d:** [Live2D Open Software License](https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html). Doanh nghiệp có doanh thu năm trên 10 triệu yên cần thêm [Release License](https://www.live2d.com/en/sdk/license/).

Core và model mẫu nằm trong `.gitignore`, không được commit.

### Lưu ý kỹ thuật đã kiểm chứng

- **Không dùng Core do Live2D host sẵn.** Bản tại `cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js` là bản cũ, thiếu `MocVersion_53`, nên easy-live2d 1.0.0 từ chối nạp. Trang sẽ báo lỗi rõ ràng nếu gặp Core cũ.
- **Lỗi lip sync của easy-live2d 1.0.0.** Thư viện đọc cờ `_lipsync` mà Cubism Framework 5-r.5 đã bỏ, nên `playVoice()` phát tiếng nhưng miệng không động. Hàm `enableVoiceLipSync()` trong `resources/js/live2d/main.js` bật lại cờ này. Có thể bỏ hàm đó khi thư viện sửa lỗi.
- **Ghi đè tham số.** `setParameterValueById(id, v)` được easy-live2d áp lại mỗi frame, sau motion và physics. Thư viện không có hàm gỡ ghi đè; trang dùng trọng số 0 để trả tham số về cho motion.
- **Nhìn theo con trỏ do trang tự làm.** easy-live2d chỉ cho model nhìn theo khi đang giữ chuột, và khi bật kéo model thì việc kéo lại đặt hướng nhìn về 0. Trang gọi cơ chế "dragging" của model mỗi khi con trỏ di chuyển, nên model nhìn theo cả khi chỉ rê chuột. Kéo model là tuỳ chọn riêng, mặc định tắt.
- **Thư mục asset nằm ở `public/assets/live2d/`.** Không đặt ở `public/live2d/`, vì thư mục trùng tên route `/live2d` khiến PHP server, Apache và nginx trả thư mục tĩnh thay vì gọi Laravel.

## 2. Biến Dania.png thành model

Quy trình đầy đủ nằm trong [`live2d-local-runbook.md`](live2d-local-runbook.md), viết để một session Claude Code chạy trên máy Windows của bạn đọc và làm theo. Runbook gồm: VRAM cần cho từng bước, cách cài và chạy See-through, kiểm tra và sửa PSD bằng `scripts/live2d/psd_inspect.py`, auto-rig bằng psd2live, nghiệm thu trên trang, cùng các kết quả nghiên cứu đáng giá nhất.

Tóm tắt: See-through tách `Dania.png` thành PSD nhiều layer, đây là bước duy nhất cần nhiều VRAM, khoảng 8–16 GB. psd2live auto-rig và xuất `.moc3` trên CPU. Thư mục model cuối cùng được chép vào `public/assets/live2d/models/Dania/`, rồi mở `/live2d?model=Dania`.

## 3. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Báo "Không tải được Cubism Core" hoặc "Cubism Core quá cũ" | Chạy `npm run live2d:core -- --accept-license`, hoặc sửa `LIVE2D_CORE_URL` trong `.env` |
| Danh sách model trống | Chạy `npm run live2d:sample -- --accept-license` hoặc chép model vào `public/assets/live2d/models/` |
| Phát âm thanh mà miệng không động | Chạy `live2d:check`; model cần nhóm `LipSync` trong `model3.json` |
| Model đứng im, không có motion idle | Model cần một nhóm motion có tên chứa "idle" |
| Trang trắng, lỗi WebGL | easy-live2d cần WebGL2; thử Chrome hoặc Edge bản mới |
| Không thấy thay đổi sau khi sửa JS | Chạy lại `npm run build`, hoặc dùng `npm run dev` |
