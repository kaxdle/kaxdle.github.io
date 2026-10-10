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

### VRAM cần cho từng bước

| Bước | Chạy ở đâu | VRAM |
|---|---|---|
| See-through, mặc định bf16, 1280 px | GPU NVIDIA | 12–16 GB |
| See-through với `--group_offload` | GPU NVIDIA | khoảng 10 GB |
| See-through bản NF4 hoặc block swap | GPU NVIDIA | khoảng 8 GB |
| psd2live: auto-rig và xuất `.moc3` | CPU, Java đóng gói sẵn | gần như không |
| Trang `/live2d` trong trình duyệt | WebGL2 | vài trăm MB |

Chỉ bước See-through cần nhiều VRAM. Tắt các LLM đang chạy local, ComfyUI hoặc ứng dụng GPU khác trước bước đó.

### 2.0 Kiểm tra ảnh

Ảnh cho kết quả tốt nhất khi:

- Chỉ có một nhân vật, nhìn chính diện, đứng thẳng.
- Nền trong suốt hoặc sạch.
- **Miệng vẽ ở trạng thái mở.** psd2live coi layer miệng là độ mở tối đa và không thể tạo ra phần trong miệng nếu ảnh gốc khép miệng.
- Tóc không che mắt. Kích thước khoảng 1280–2048 px.

Nếu Dania đang khép miệng, hãy dùng một model chỉnh ảnh (ví dụ Qwen Image Edit trong ComfyUI) để vẽ thêm bản miệng mở và mắt nhắm. Sau đó thêm chúng vào PSD ở bước 2.2 với tên `mouth open` và `eye close`.

### 2.1 Tách layer bằng See-through (cần VRAM)

Cài một lần, trong Anaconda Prompt:

```bat
git clone https://github.com/shitagaki-lab/see-through
cd see-through
conda create -n see_through python=3.12 -y
conda activate see_through
pip install torch==2.8.0+cu128 torchvision==0.23.0+cu128 torchaudio==2.8.0+cu128 --index-url https://download.pytorch.org/whl/cu128
pip install -r requirements.txt
xcopy /E /I common\assets assets
```

Chạy, chọn một dòng theo VRAM còn trống:

```bat
:: 16 GB trở lên
python inference/scripts/inference_psd.py --srcp "D:\LLM_AREA\L2d Creator\Dania.png" --save_to_psd
:: khoảng 12 GB
python inference/scripts/inference_psd.py --srcp "D:\LLM_AREA\L2d Creator\Dania.png" --save_to_psd --group_offload
:: khoảng 8 GB (cài thêm bitsandbytes một lần)
pip install -r requirements-inference-bnb.txt
python inference/scripts/inference_psd_quantized.py --srcp "D:\LLM_AREA\L2d Creator\Dania.png" --save_to_psd
```

Kết quả nằm trong `workspace\layerdiff_output\`, gồm file PSD tối đa 23 layer. Nếu không có GPU, dùng [HF Space demo](https://huggingface.co/spaces/24yearsold/see-through-demo), mỗi ngày được 1–2 lần. Các lệnh trên lấy từ README của See-through. Chúng chưa được chạy thử trên Windows trong phiên làm việc này.

### 2.2 Sửa PSD

Mở PSD trong Photoshop, Krita hoặc Photopea. Đối chiếu tên layer với [quy ước của psd2live](https://github.com/tsunehimatoi/psd2live/blob/master/docs/zh/spec/PSD_LAYER_SPEC.md):

- **Tên layer:** dùng `back hair`, `front hair`, `face`, `eyewhite`, `irides`, `eyelash`, `eyebrow`, `mouth`, `nose`, `neck`, `topwear`… Tên tiếng Trung và tiếng Nhật cũng được nhận.
- **Mắt:** `eyelash` chỉ chứa mi trên. Thứ tự từ dưới lên là `eyewhite`, `irides`, `eyelash`. Tách trái và phải bằng `eyelash-l` và `eyelash-r`, theo phía của nhân vật chứ không theo phía màn hình.
- **Miệng:** `mouth` là miệng mở hết cỡ. Có thể tách thêm `tooth-t`, `tooth-b`, `tongue`.
- **Rác:** xoá layer thừa See-through sinh nhầm, ví dụ tai không có thật.

### 2.3 Auto-rig và xuất .moc3 bằng psd2live

1. Tải `PSD2Live-3.3.0.exe` hoặc bản portable zip từ [trang release](https://github.com/tsunehimatoi/psd2live/releases). Bản này đóng gói sẵn Java.
2. Chọn **File → Import → New project from PSD…** (`Ctrl+Shift+O`). Chọn preset **Full** để có rig đầu và mặt đầy đủ.
3. Kiểm tra bảng Layers, sửa phần nào bị nhận sai loại hoặc sai bên.
4. Chuyển sang Preview, thử chớp mắt, mở miệng, quay đầu và vật lý tóc.
5. Bấm `Ctrl+S` để lưu project `.psd2live`. Đây là file gốc để sửa tiếp về sau.
6. Bấm `Ctrl+G` để xuất Cubism. Giữ target mặc định 5.0; Core R5 đọc được tới 5.3.

### 2.4 Đưa model vào trang /live2d

```bat
xcopy /E /I "<thư mục psd2live vừa xuất>" public\assets\live2d\models\Dania
npm run live2d:check -- public/assets/live2d/models/Dania
```

Lệnh kiểm tra báo file thiếu, phiên bản `.moc3`, kích thước texture, và các nhóm Idle, LipSync, EyeBlink mà trang cần. Nếu không có lỗi ✖, mở `http://127.0.0.1:8000/live2d?model=Dania`. Tên thư mục chính là tên model trong danh sách.

`public/assets/live2d/models/` được commit vào repo, khác với thư mục mẫu. Chỉ commit model khi bạn có quyền với ảnh gốc của Dania.

## 3. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Báo "Không tải được Cubism Core" hoặc "Cubism Core quá cũ" | Chạy `npm run live2d:core -- --accept-license`, hoặc sửa `LIVE2D_CORE_URL` trong `.env` |
| Danh sách model trống | Chạy `npm run live2d:sample -- --accept-license` hoặc chép model vào `public/assets/live2d/models/` |
| Phát âm thanh mà miệng không động | Chạy `live2d:check`; model cần nhóm `LipSync` trong `model3.json` |
| Model đứng im, không có motion idle | Model cần nhóm motion tên `Idle` |
| Trang trắng, lỗi WebGL | easy-live2d cần WebGL2; thử Chrome hoặc Edge bản mới |
| Không thấy thay đổi sau khi sửa JS | Chạy lại `npm run build`, hoặc dùng `npm run dev` |
