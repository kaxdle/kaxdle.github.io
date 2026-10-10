# Runbook cho session local: biến Dania.png thành model Live2D chạy trên trang /live2d

Tài liệu này viết cho **một session Claude Code chạy trên máy Windows của người dùng**, máy có GPU NVIDIA và ổ `D:`. Session cloud đã nghiên cứu và dựng sẵn trang web, nhưng không chạm được vào máy này. Phần việc còn lại cần GPU và file trên ổ `D:`, nên được giao cho session local.

Đọc hết tài liệu trước khi chạy lệnh đầu tiên. Mục 2 tóm tắt những gì đã được kiểm chứng; đừng tốn công kiểm tra lại các điểm đó.

- **Ảnh đầu vào:** `D:\LLM_AREA\L2d Creator\Dania.png`
- **Đầu ra:** thư mục `public/assets/live2d/models/Dania/` trong repo này, mở được tại `http://127.0.0.1:8000/live2d?model=Dania`
- **Code liên quan:** nhánh `ccr-c90b053c-avh88w`, PR #1 của `kaxdle/kaxdle.github.io`

## 0. Tiêu chí hoàn thành

Session local coi là xong khi đủ các điều sau:

1. `npm run live2d:check -- public/assets/live2d/models/Dania` không có dòng ✖.
2. Trang `/live2d?model=Dania` báo "Sẵn sàng" và model hiện đúng hình Dania.
3. Model tự chớp mắt, chạy motion idle, nhìn theo con trỏ, và mở miệng khi phát một file âm thanh.
4. Người dùng đã nhận báo cáo theo mẫu ở mục 11.

Không commit hay push trừ khi người dùng yêu cầu.

## 1. Quy tắc bắt buộc

1. **VRAM: hỏi trước.** Người dùng đã dặn rõ việc này. Trước mọi lệnh dùng GPU, gồm See-through, model chỉnh ảnh và `--upscale` của psd2live, phải làm đủ ba việc:
   - Chạy `nvidia-smi` và báo VRAM đang dùng, VRAM còn trống, và tiến trình nào đang giữ VRAM.
   - Nói sẽ chạy chế độ nào và cần khoảng bao nhiêu VRAM.
   - Chờ người dùng đồng ý. Không tự tắt tiến trình của người dùng, ví dụ các LLM local trong `D:\LLM_AREA`.
2. **License: hỏi trước.** Không tự thêm `--accept-license` và không tự tải trọng số model. Đưa link license ở mục 12 cho người dùng và chờ họ đồng ý.
3. **Tải nặng: báo trước.** Môi trường và trọng số của See-through tốn khoảng 20 GB. Báo dung lượng và nơi lưu trước khi tải. Khuyến nghị lưu trên ổ `D:`.
4. **Không commit** các thứ sau: `public/assets/live2d/core/`, `public/assets/live2d/samples/`, `.env`, `vendor/`, `node_modules/`, `public/build/`, thư mục làm việc của See-through, trọng số model. Thư mục model Dania chỉ được commit khi người dùng xác nhận có quyền với ảnh gốc và muốn commit.
5. **Không sửa `Dania.png` gốc.** Chép sang thư mục làm việc `D:\LLM_AREA\L2d Creator\work\` rồi làm trên bản sao.
6. **Dừng lại và hỏi** khi gặp một trong các tình huống sau:
   - Ảnh không đạt tiêu chí ở mục 5 và cần vẽ thêm biến thể.
   - See-through lỗi hai lần liên tiếp.
   - psd2live không chạy được ở cả chế độ dòng lệnh lẫn GUI.
   - Kết quả đủ kỹ thuật nhưng xấu tới mức cần người dùng quyết định có làm tiếp không.

Lệnh trong tài liệu viết cho Git Bash, shell mặc định của Claude Code trên Windows. Nếu shell là PowerShell, đổi `export X=...` thành `$env:X="..."` và `cp -r` thành `Copy-Item -Recurse`. Đường dẫn dùng dấu `/` vì Python, Node và PHP đều hiểu.

## 2. Những điều đã kiểm chứng

### 2.1 Vì sao chọn pipeline này

Pipeline: **ảnh PNG → See-through tách layer → sửa tên layer → psd2live auto-rig và ghi `.moc3` → easy-live2d hiển thị trên web**. Lý do chọn:

- **See-through** là công cụ mã nguồn mở duy nhất tách một ảnh anime thành tối đa 23 layer, có vẽ bù vùng bị che. Layer được đặt tên theo bộ phận: `front hair`, `back hair`, `face`, `eyewhite`, `irides`, `eyelash`, `eyebrow`, `mouth`… psd2live nhận đúng bộ tên này. See-through là bài báo SIGGRAPH 2026, code Apache-2.0.
- **psd2live** là công cụ mở duy nhất vừa auto-rig từ PSD vừa ghi được file `.moc3` thật mà không cần Cubism Editor. Nó cũng xuất `.cmo3` để sửa tay về sau.
- **easy-live2d** là lớp bọc mỏng nhất cho web, chạy trên PixiJS 8 với SDK chính thức Cubism 5 R5. Thư viện dùng license MIT.
- **Đã có người chạy trọn chuỗi này.** Ít nhất ba dự án công khai đã đi từ ảnh tới `.moc3`: whalegirl-pet, jpg-to-live2d-workflow và Live2D Agent Kit.
- **Giữ định dạng `.moc3`** nghĩa là giữ được cả hệ sinh thái: VTube Studio, nizima LIVE, MotionSync và mọi web runtime.
- **Model sinh ảnh thông thường không dùng để tách part được.** Chỉ dùng nó để vẽ thêm biến thể như mắt nhắm, miệng mở.
- **Chưa có dịch vụ tự động hoàn toàn.** Tính tới 2026-10-09, chưa có dịch vụ nào nhận 1 PNG và trả về `.moc3` mà không cần người làm.

### 2.2 Trang web /live2d (đã test trên Chromium headless, 2026-10-10)

- **Core do Live2D host sẵn không dùng được.** Bản tại `cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js` thiếu `MocVersion_53`, nên easy-live2d 1.0.0 từ chối nạp. Lệnh `npm run live2d:core` tải gói `CubismSdkForWeb-5-r.5.zip`, kiểm tra SHA-256 rồi chỉ giải nén `Core/`. Core này tự báo phiên bản 6.0.1 và đọc được `.moc3` tới bản 5.3.
- **easy-live2d 1.0.0 có lỗi lip sync.** Thư viện đọc cờ `_lipsync` mà Cubism Framework 5-r.5 đã bỏ, nên `playVoice()` phát tiếng mà miệng không động. Hàm `enableVoiceLipSync()` trong `resources/js/live2d/main.js` vá lỗi này. Lỗi chưa được báo cho tác giả thư viện.
- **Nhìn theo con trỏ do trang tự làm.** easy-live2d chỉ cho model nhìn theo khi đang giữ chuột, và kéo model sẽ đặt hướng nhìn về 0. Trang gọi `setDragging` của model mỗi khi con trỏ di chuyển. Kéo model là tuỳ chọn riêng, mặc định tắt.
- **Ghi đè tham số giữ qua mọi frame.** `setParameterValueById` được áp lại sau motion và physics. Muốn trả tham số về cho motion thì đặt trọng số 0.
- **Không gọi `releaseExpressions()`.** Hàm này xoá hẳn các expression đã nạp.
- **Model cần hai nhóm trong `model3.json`.** Nhóm `LipSync` để miệng chạy theo âm thanh. Một nhóm motion có tên chứa "idle" để model tự cử động khi rảnh.
- **Bắt buộc WebGL2.** Kiểm tra tính toàn vẹn của `.moc3` được bật sẵn để phòng lỗi bảo mật kiểu CVE-2023-27566. Giữ nguyên, nhất là với model không rõ nguồn gốc.
- **Asset phải nằm trong `public/assets/live2d/`.** Nếu đặt ở `public/live2d/`, thư mục trùng tên route `/live2d` sẽ khiến PHP server, Apache và nginx trả thư mục tĩnh thay vì gọi Laravel.

### 2.3 See-through

- **VRAM ở độ phân giải 1280:**

  | Chế độ | VRAM |
  |---|---|
  | Mặc định bf16 | 12–16 GB |
  | `--group_offload`, chậm hơn khoảng 1,5 lần | khoảng 10 GB |
  | Bản NF4 hoặc block swap | khoảng 8 GB |

- **Môi trường:** Python 3.12, torch 2.8.0 bản CUDA 12.8. Driver NVIDIA phải hỗ trợ CUDA 12.8; `nvidia-smi` sẽ báo phiên bản CUDA tối đa.
- **Đầu ra:** chạy với `--save_dir X` và ảnh `Dania.png` sẽ cho `X/Dania.psd`, `X/Dania_depth.psd`, `X/Dania.psd.json` và thư mục `X/Dania/`.
- **Tách trái/phải:** cờ `--tblr_split` tách mắt, lông mày, tai và tay thành hai layer `<tag>-l` và `<tag>-r`. Cần cờ này vì psd2live không tự tách một layer chứa cả hai mắt.
- **Hạn chế đã ghi nhận:**
  - Không tự vẽ mắt nhắm, răng hay lưỡi.
  - Đôi khi layer lòng trắng mắt nằm đè lên tròng đen.
  - Đôi khi sinh ra tai không có thật.
  - Một bài thử của GMO chỉ tách đủ khoảng 72% bộ phận ở ảnh khó.
- **Nếu không có GPU:** dùng [HF Space demo](https://huggingface.co/spaces/24yearsold/see-through-demo), mỗi ngày 1–2 lần, hoặc [bản trên ModelScope](https://modelscope.cn/studios/ljsabc/See-Through). Hai bản này cần người dùng tự tải ảnh lên.
- **Bản ComfyUI** ([ComfyUI-See-through](https://github.com/jtydhr88/ComfyUI-See-through)) dựng PSD trong trình duyệt, nên session local khó tự chạy. Chỉ dùng bản này khi người dùng tự thao tác.

### 2.4 psd2live

- **Có chế độ dòng lệnh không cần GUI:**
  ```
  --input <psd> [--output <dir>] [--atlas 4096] [--mesh-spacing 64]
  [--head-strength 1.0] [--body-strength 1.0] [--no-physics] [--no-motions]
  [--no-cmo3] [--upscale 1|2|4] [--lang en]
  ```
  Chế độ này sinh thẳng file xuất. Nó không tạo project `.psd2live` để sửa tiếp và không có lựa chọn preset.
- **Quy trình GUI:**
  1. **File → Import → New project from PSD…** (`Ctrl+Shift+O`).
  2. Chọn preset Minimal, Default hoặc Full. Full cho rig đầu và mặt đầy đủ nhất.
  3. Kiểm tra bảng Layers.
  4. Xem thử trong Preview.
  5. `Ctrl+S` để lưu project `.psd2live`.
  6. `Ctrl+G` để xuất `.moc3` và `.cmo3`, target 3.0–5.3, mặc định 5.0.
- **Quy ước layer:**
  - `mouth` là miệng **mở hết cỡ**. Miệng khép trong ảnh gốc không thể biến dạng thành miệng mở.
  - `eyelash` chỉ chứa mi trên.
  - Trái/phải tính theo nhân vật, nên `-l` thường nằm bên phải màn hình.
  - Layer có tên lạ không bị bỏ, nhưng sẽ được gán bộ phận theo cách dự phòng.
- **Bản Windows:** có `.exe` và bản portable zip, kèm sẵn Java. Bản 3.3.0 phát hành ngày 2026-10-10.
- **Dự án đổi rất nhanh.** Từ 1.2 lên 3.3 chỉ trong khoảng hai tuần, và đã có lỗi hồi quy. Hãy ghi lại phiên bản đã dùng.
- **License:** app và phần xuất Cubism là GPL-3, runtime là MIT. Model xuất ra thuộc về người dùng.
- **Luôn kiểm tra kết quả.** Tác giả nói rõ: xuất thành công không có nghĩa là model chạy giống nhau trên mọi runtime. Mỗi lần xuất có kèm báo cáo những gì bị mất trong file `.json`.

### 2.5 Công cụ sửa tay

- **Cubism Editor FREE** có các giới hạn sau, và **vượt giới hạn thì không lưu được file**:
  - 1 texture, tối đa 2048 px.
  - Tối đa 100 ArtMesh, 50 deformer, 30 tham số motion, 30 part.
- **Cubism Editor PRO Indie** dành cho doanh thu dưới 10 triệu yên: ¥2,080 mỗi tháng hoặc ¥14,280 năm đầu. Có bản dùng thử 42 ngày.
- **Không dùng Cubism 5.4 alpha.** Bản alpha2 hết hạn ngày 2026-10-18 và cấm phân phối sản phẩm làm bằng nó.
- **Umamo** là editor mã mở, license GPL-3, đọc và ghi được `.moc3` lẫn `.cmo3`. Nó không có giới hạn như bản FREE, nhưng còn ở bản alpha và chưa làm được animation.
- **moc2cmo** là công cụ MIT, chuyển `.moc3` thành project `.cmo3` để sửa.
- **Plugin tách part chính chủ cho Photoshop** của Live2D cần license PRO và chỉ bán tự động.

### 2.6 Chất lượng nên kỳ vọng

Mọi báo cáo công khai đều mô tả kết quả là "chạy được nhưng chưa chuyên nghiệp". Thường gặp:

- Mắt trống hoặc sai thứ tự layer.
- Viền môi mờ.
- Quay đầu chỉ là giả 3D.
- Không có tay hay ngón tay riêng.

Nên dự trù 1–2 giờ sửa tay cho mỗi nhân vật. Model VTuber thương mại vẫn cần một người rig chuyên nghiệp. Ảnh nhỏ làm mặt thiếu pixel: ở canvas 768 px, mặt chỉ còn khoảng 100 px. Vì vậy nên dùng ảnh 1280–2048 px.

## 3. Bước 1: khảo sát máy

Bước này không tốn VRAM.

```bash
nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,driver_version --format=csv
nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv
nvidia-smi | head -4            # dòng "CUDA Version" phải >= 12.8
git --version; node -v; npm -v; php -v; composer -V
conda --version; python --version; java -version
df -h /c /d                      # PowerShell: Get-PSDrive C,D
ls -la "D:/LLM_AREA/L2d Creator/Dania.png"
```

Yêu cầu tối thiểu:
- Node 18 trở lên. Đã test với Node 22.
- PHP 8.0.2 trở lên, cùng Composer. Đã test với PHP 8.3.
- Conda, hoặc Python 3.12.
- Khoảng 25 GB trống trên ổ `D:`.

Báo cho người dùng một bảng ngắn: GPU, VRAM trống, tiến trình đang chiếm VRAM, công cụ còn thiếu. Nếu thiếu công cụ, hỏi người dùng trước khi cài.

## 4. Bước 2: chạy trang /live2d với model mẫu

```bash
cd <thư mục repo kaxdle.github.io>
git fetch origin
git checkout ccr-c90b053c-avh88w   # hoặc main nếu PR #1 đã merge
git pull
composer install
[ -f .env ] || cp .env.example .env
php artisan key:generate           # chỉ chạy khi .env vừa được tạo
npm install
```

Hỏi người dùng có đồng ý license Cubism Core và Free Material License không. Link ở mục 12. Khi họ đồng ý thì chạy:

```bash
npm run live2d:core -- --accept-license
npm run live2d:sample -- --accept-license
npm run build
php artisan serve                   # chạy nền
```

Kiểm tra:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/live2d                                         # 200
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/assets/live2d/core/live2dcubismcore.min.js     # 200
npm run live2d:check -- public/assets/live2d/samples/Hiyori                                                   # không có ✖
```

Nhờ người dùng mở `http://127.0.0.1:8000/live2d?model=Hiyori` và xác nhận ba điều: model hiện ra, báo "Sẵn sàng", và nhìn theo con trỏ.

Nếu Composer báo thiếu extension PHP, bật trong `php.ini` các extension `fileinfo`, `mbstring`, `openssl`, `pdo_mysql`, `curl`. Route `/live2d` không cần database.

## 5. Bước 3: kiểm tra ảnh Dania.png

```bash
mkdir -p "D:/LLM_AREA/L2d Creator/work"
cp "D:/LLM_AREA/L2d Creator/Dania.png" "D:/LLM_AREA/L2d Creator/work/Dania.png"
python -c "from PIL import Image; im=Image.open('D:/LLM_AREA/L2d Creator/work/Dania.png'); print(im.size, im.mode)"
```

Mở ảnh bằng công cụ Read để xem tận mắt, rồi đối chiếu:

| Tiêu chí | Vì sao |
|---|---|
| Chỉ một nhân vật, nhìn chính diện, đứng thẳng | See-through và psd2live giả định như vậy |
| Nền trong suốt hoặc sạch | Nền rối làm sai phần tách |
| **Miệng đang mở** | psd2live coi `mouth` là độ mở tối đa |
| Mắt mở, tóc không che mắt | Mắt bị che sẽ thiếu layer |
| Cạnh dài 1280–2048 px | Mặt đủ pixel; See-through chạy ở 1280 |
| Tay không che mặt hay thân | Vùng bị che phải vẽ bù, dễ lỗi |

Nếu nền rối, có thể tách nền trước bằng [anime-segmentation](https://github.com/SkyTNT/anime-segmentation). Công cụ này chạy được trên CPU.

**Nếu miệng đang khép,** báo người dùng và đề xuất hai lựa chọn:

- **Phương án A, khuyến nghị.** Dùng một model chỉnh ảnh để sửa ảnh gốc thành miệng hơi mở, giữ nguyên mọi thứ khác, rồi đưa ảnh đã sửa qua See-through. Ví dụ dùng Qwen Image Edit trong ComfyUI, như cách PNGAL làm. Bước này cần VRAM, nên áp dụng quy tắc 1.
- **Phương án B.** Giữ miệng khép, chấp nhận lip sync gần như không thấy.

Mắt nhắm làm theo cách tương tự nếu muốn chớp mắt đẹp hơn. Tạo ảnh mắt nhắm cùng kích thước, cắt vùng mắt, rồi thêm vào PSD thành layer `eye close-l` và `eye close-r`. Nếu không làm, psd2live vẫn chớp mắt bằng cách biến dạng mi.

## 6. Bước 4: tách layer bằng See-through

Bước này cần VRAM. Áp dụng quy tắc 1 trước khi chạy bất kỳ lệnh nào dưới đây.

Cài một lần. Báo trước rằng sẽ tốn khoảng 20 GB trên ổ `D:`.

```bash
cd D:/LLM_AREA
git clone https://github.com/shitagaki-lab/see-through
cd see-through
conda create -n see_through python=3.12 -y
conda env config vars set -n see_through HF_HOME=D:/LLM_AREA/hf-cache   # trọng số tải về ổ D:
conda run -n see_through pip install torch==2.8.0+cu128 torchvision==0.23.0+cu128 torchaudio==2.8.0+cu128 --index-url https://download.pytorch.org/whl/cu128
conda run -n see_through pip install -r requirements.txt
cp -r common/assets assets          # README dùng ln -sf; trên Windows chép thư mục là đủ
```

`requirements.txt` có vài gói cài trực tiếp từ GitHub, nên cần `git` trong `PATH`. Trọng số model được tải tự động ở lần chạy đầu. LayerDiff3D và Marigold dùng license OpenRAIL++, nên hỏi người dùng đồng ý trước.

Chọn **một** lệnh theo VRAM còn trống mà người dùng đã đồng ý cấp. Luôn chạy từ thư mục gốc `see-through`.

```bash
cd D:/LLM_AREA/see-through
OUT="D:/LLM_AREA/L2d Creator/work/seethrough"
IMG="D:/LLM_AREA/L2d Creator/work/Dania.png"

# >= 16 GB trống
conda run -n see_through --no-capture-output python inference/scripts/inference_psd.py --srcp "$IMG" --save_dir "$OUT" --save_to_psd --tblr_split
# khoảng 12 GB trống
conda run -n see_through --no-capture-output python inference/scripts/inference_psd.py --srcp "$IMG" --save_dir "$OUT" --save_to_psd --tblr_split --group_offload
# khoảng 8 GB trống: cài bitsandbytes một lần, rồi chạy bản NF4 (group offload bật sẵn)
conda run -n see_through pip install -r requirements-inference-bnb.txt
conda run -n see_through --no-capture-output python inference/scripts/inference_psd_quantized.py --srcp "$IMG" --save_dir "$OUT" --save_to_psd --tblr_split
```

Kết quả nằm ở `"$OUT/Dania.psd"`. Ghi lại thời gian chạy và VRAM cao nhất.

Nếu lỗi:

| Lỗi | Cách xử lý |
|---|---|
| Hết VRAM | Xuống một bậc chế độ, hoặc thêm `--resolution 1024` |
| Lỗi phiên bản diffusers | `conda run -n see_through pip install diffusers==0.37.0` |
| Lỗi bitsandbytes | Chỉ chế độ NF4 cần gói này; thử `--group_offload` thay thế |
| Kết quả xấu | Chạy lại với `--seed 7` hoặc `--seed 123`, mỗi seed một thư mục `--save_dir` riêng, rồi so sánh ở bước 5 |

## 7. Bước 5: kiểm tra và sửa PSD

Script `scripts/live2d/psd_inspect.py` của repo đối chiếu tên layer với quy ước psd2live và báo các vấn đề sau:
- Bộ phận còn thiếu.
- Mắt hoặc lông mày chưa tách trái/phải.
- Thứ tự `eyewhite → irides → eyelash` bị sai.
- `-l` và `-r` có vẻ bị đảo phía.
- Layer rỗng và tên không nhận ra.

Script dùng psd-tools, gói này đã có trong môi trường `see_through`.

```bash
cd <thư mục repo>
PSD="D:/LLM_AREA/L2d Creator/work/seethrough/Dania.psd"
conda run -n see_through python scripts/live2d/psd_inspect.py "$PSD" --json "D:/LLM_AREA/L2d Creator/work/psd_report.json"
```

Sửa bằng các cờ dưới đây. Lệnh luôn ghi ra file mới, không ghi đè PSD gốc. Ví dụ này chỉ minh hoạ cú pháp: chỉ dùng những cờ mà báo cáo của bước trên thực sự yêu cầu, và nếu script in ra dòng gợi ý đổi tên thì dùng đúng dòng đó.

```bash
conda run -n see_through python scripts/live2d/psd_inspect.py "$PSD" \
  --rename "hairf=front hair" --rename "hairb=back hair" \
  --rename "eyebrow-l=eyebrow-r" --rename "eyebrow-r=eyebrow-l" \
  --drop "ears-l" \
  --move-above "eyelash-r=irides-r" \
  --out "D:/LLM_AREA/L2d Creator/work/Dania.fixed.psd"
```

Các cờ:
- `--rename CŨ=MỚI` đổi tên theo tên gốc, nên đổi chéo hai tên cho nhau trong cùng một lệnh vẫn đúng.
- `--drop TÊN` xoá layer.
- `--move-above TÊN=ĐÍCH` đưa layer lên ngay trên layer đích. Hai layer phải cùng một group.

Xem tận mắt trước khi sang bước sau. Xuất ảnh ghép và từng layer ra PNG, rồi mở bằng Read:

```bash
conda run -n see_through python -c "
from psd_tools import PSDImage; import os
p=PSDImage.open(r'D:/LLM_AREA/L2d Creator/work/Dania.fixed.psd'); d=r'D:/LLM_AREA/L2d Creator/work/layers'; os.makedirs(d, exist_ok=True)
p.composite().save(d+'/_composite.png')
[l.topil().save(f'{d}/{i:02d}_{l.name}.png') for i,l in enumerate(p) if not l.is_group() and l.bbox[2]>l.bbox[0]]"
```

PSD đạt khi:
- Không còn cảnh báo thiếu FACE, EYEWHITE, IRIDES, EYELASH, EYEBROW, MOUTH, FRONT_HAIR hay BACK_HAIR.
- Không còn cảnh báo thứ tự hay đảo phía.
- Ảnh ghép trông giống ảnh gốc.

Mi dưới bị dính vào `eyelash` thì script không sửa được. Có thể chấp nhận, hoặc nhờ người dùng xoá phần đó bằng Photoshop hoặc Photopea.

## 8. Bước 6: auto-rig và xuất .moc3 bằng psd2live

1. **Tải bản portable.** Hỏi người dùng trước. Tải `PSD2Live-<phiên bản>-windows-x86_64-portable.zip` từ [trang release](https://github.com/tsunehimatoi/psd2live/releases) và giải nén vào `D:/LLM_AREA/tools/psd2live/`. Windows SmartScreen có thể hỏi xác nhận vì file chưa ký; người dùng phải tự bấm cho phép.
2. **Thử chế độ dòng lệnh.** Tìm file `.exe` trong thư mục vừa giải nén và chạy `--help`:
   ```bash
   find D:/LLM_AREA/tools/psd2live -iname "*.exe" | head
   "<đường dẫn PSD2Live.exe>" --help
   ```
   - **Nếu in ra trợ giúp CLI,** dùng lệnh ở bước 3.
   - **Nếu mở cửa sổ GUI hoặc không in gì,** đóng cửa sổ đó. Chuyển sang chạy từ mã nguồn: cài JDK 21 (ví dụ Temurin, hỏi người dùng trước), `git clone https://github.com/tsunehimatoi/psd2live`, checkout tag của bản đang dùng, rồi gọi `run-gui.bat` với các tham số như bên dưới. Có tham số thì file này chạy chế độ CLI; lần đầu nó sẽ build bằng Gradle.
3. **Sinh model.** Bước này chạy trên CPU, không cần hỏi về VRAM.
   ```bash
   "<PSD2Live.exe hoặc run-gui.bat>" --input "D:/LLM_AREA/L2d Creator/work/Dania.fixed.psd" \
     --output "D:/LLM_AREA/L2d Creator/work/psd2live-out" --atlas 2048 --lang en
   ```
   - Dùng `--atlas 2048` vì máy di động khó nạp texture 4096, và Cubism Editor FREE chỉ mở được texture tối đa 2048.
   - Nếu mặt hoặc thân biến dạng quá mạnh, thêm `--head-strength 0.7` hoặc `--body-strength 0.7`.
   - Đọc file `.json` báo cáo trong thư mục xuất và ghi lại các mục bị mất hoặc cảnh báo.
4. **Khi cần chất lượng tốt hơn, dùng GUI.** Đường này cần người dùng thao tác.
   1. Mở psd2live và chọn **File → Import → New project from PSD…** để mở `Dania.fixed.psd`.
   2. Chọn preset **Full** và kiểm tra bảng Layers.
   3. Xem thử trong Preview.
   4. `Ctrl+S` để lưu `Dania.psd2live`.
   5. `Ctrl+G` để xuất, giữ target 5.0.

   Session local hướng dẫn từng bước và chờ người dùng báo xong. File `.psd2live` là nguồn để sửa tiếp về sau, hãy giữ lại.

## 9. Bước 7: đưa vào trang web và nghiệm thu

```bash
cd <thư mục repo>
ls "D:/LLM_AREA/L2d Creator/work/psd2live-out"     # tìm thư mục chứa *.model3.json
mkdir -p public/assets/live2d/models/Dania
cp -r "<thư mục chứa model3.json>"/. public/assets/live2d/models/Dania/
npm run live2d:check -- public/assets/live2d/models/Dania
```

Yêu cầu và cách xử lý:
- **Đúng một file `.model3.json`** trong thư mục. Tên thư mục là tên model trên trang.
- **Lỗi ✖ do thiếu file:** kiểm tra lại bước chép.
- **Lỗi ✖ do phiên bản `.moc3` lớn hơn 5.3:** xuất lại với target 5.0.
- **Cảnh báo thiếu nhóm idle hoặc LipSync:** xem trong `model3.json` psd2live đặt tên nhóm là gì. Trang tự nhận mọi nhóm motion có tên chứa "idle". Nếu không có nhóm `LipSync` thì thêm vào `"Groups"`:
  ```json
  { "Target": "Parameter", "Name": "LipSync", "Ids": ["ParamMouthOpenY"] }
  ```
  Chỉ thêm khi model thật sự có tham số `ParamMouthOpenY`. Tham số này hiện trong danh sách thanh trượt trên trang.

Mở `http://127.0.0.1:8000/live2d?model=Dania` và nghiệm thu từng mục. Tự kiểm tra được thì tự làm; mục nào cần mắt người thì nhờ người dùng.

| Kiểm tra | Cách làm | Đạt khi |
|---|---|---|
| Nạp model | Mở trang | Báo "Sẵn sàng", bảng Thông tin ghi Cubism Core 6.0.1 |
| Hình đúng | Nhìn | Giống Dania, không lộ nền, không thừa bộ phận |
| Chớp mắt và idle | Đợi 10 giây | Mắt chớp, model cử động nhẹ |
| Nhìn theo con trỏ | Rê chuột quanh model | Đầu và mắt quay theo |
| Quay đầu | Kéo thanh `ParamAngleX` | Đầu quay, không rách tóc hay mặt |
| Miệng | Kéo thanh `ParamMouthOpenY` | Miệng mở rõ |
| Lip sync | Chọn một file `.wav` hoặc `.mp3` có tiếng nói | Miệng động theo tiếng |
| Bật micro | Bấm "Bật micro" rồi nói | Miệng động theo giọng |

## 10. Cải thiện chất lượng

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Mắt trống, tròng đen bị che | Thứ tự layer mắt sai | Dùng `--move-above` ở bước 5 rồi xuất lại |
| Có tai hay vật lạ | See-through sinh nhầm | Dùng `--drop` để xoá layer đó |
| Miệng gần như không mở | Ảnh gốc khép miệng | Phương án A ở mục 5 |
| Lộ nền hoặc rách tóc khi quay đầu | Phần vẽ bù sau tóc thiếu | Thêm `--head-strength 0.6` đến `0.8`; chạy See-through với seed khác; sửa tay |
| Lưới thô, góc cạnh | Lưới thưa | Thêm `--mesh-spacing 48` |
| Texture mờ | Atlas nhỏ | Dùng `--atlas 4096` nếu chỉ cần máy tính để bàn |
| Biến dạng lạ ở một bộ phận | Layer bị nhận sai loại | Sửa tên layer, hoặc sửa loại trong bảng Layers của GUI |

Khi cần sửa tay sâu hơn, mở file `.cmo3` hoặc `.moc3` bằng Umamo hoặc Cubism Editor. Nhớ giới hạn của bản FREE ở mục 2.5.

## 11. Mẫu báo cáo cho người dùng

```
Kết quả: <xong / dừng ở bước X vì Y>
Máy: <GPU>, VRAM trống <N> GB. See-through chạy chế độ <...>, mất <phút>, VRAM cao nhất <GB>.
Phiên bản: See-through <commit>, psd2live <phiên bản>, easy-live2d 1.0.0, Cubism Core 6.0.1.
PSD: <số layer>; đã sửa: <đổi tên / xoá / chuyển thứ tự>; còn lại: <cảnh báo>.
Model: <số tham số, motion, expression>; live2d:check: <✔ / ⚠>.
Nghiệm thu: <bảng mục 9, đạt / chưa đạt>.
Ảnh chụp: <đường dẫn>.
Việc cần người dùng quyết: <...>.
```

## 12. License và pháp lý

| Thành phần | License | Hệ quả |
|---|---|---|
| Cubism Core | [Live2D Proprietary Software License](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html); file ghi là "Redistributable Code" | Được phân phối kèm sản phẩm; repo vẫn không commit cho chắc |
| Cubism Framework, nằm trong easy-live2d | [Live2D Open Software License](https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html) | Đọc §2.2–2.3 trước khi đưa trang ra Internet công khai |
| Release License | [Điều khoản SDK](https://www.live2d.com/en/sdk/license/) | Cần khi doanh thu năm trên 10 triệu yên; phần mềm tracking cho VTuber có ngưỡng riêng 20 triệu yên |
| Model mẫu Hiyori, Haru | [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html) | Dùng để thử; không commit |
| See-through | Code Apache-2.0; trọng số LayerDiff3D và Marigold OpenRAIL++; trọng số SAM Apache-2.0 | OpenRAIL++ giới hạn mục đích sử dụng |
| psd2live | App và phần xuất Cubism GPL-3; runtime và web player MIT | Model xuất ra thuộc về người dùng; không nhúng code GPL vào sản phẩm đóng |
| easy-live2d | MIT | — |
| Dania.png | Quyền của người dùng | Chỉ commit hay bán model khi có quyền; một số nền tảng như nizima có quy định riêng với model làm từ ảnh AI, cần kiểm tra trước khi bán |

## 13. Sau khi Dania chạy được: hướng tiếp theo

Các hướng này đã được nghiên cứu. Chi tiết và link nằm trong `docs/live2d-research.md`.

- **Cho LLM điều khiển nhân vật,** theo mẫu của [Charivo](https://github.com/zeikar/charivo):
  - Thêm route Laravel `POST /api/chat`, nhận `{messages, tools}` và trả `{message, toolCalls}`.
  - Các tool `setExpression`, `playMotion`, `lookAt` có tham số giới hạn theo danh sách motion và expression của model.
  - Phía trình duyệt gọi `startMotion`, `setExpression`, `setGaze`.
  - Giọng TTS đưa vào `playVoice`. Lip sync đã chạy nhờ bản vá ở mục 2.2.
- **Bắt mặt qua webcam:** MediaPipe FaceLandmarker chạy bằng WASM trong trình duyệt. Nó điều khiển `ParamAngleX/Y/Z`, `ParamEyeLOpen`, `ParamEyeROpen`, `ParamEyeBallX/Y` và `ParamMouthOpenY` qua `setParameterValueById`. Mã tham khảo: [mirunova-live](https://github.com/RifkyA911/mirunova-live).
- **Lip sync theo nguyên âm:** dùng [Cubism MotionSync Plugin for Web](https://github.com/Live2D/CubismWebMotionSyncComponents). Plugin cần file `.motionsync3.json` làm trong Cubism Editor 5.
- **Core mã mở:** [Purism Core](https://github.com/SakuraMotion/PurismCore), license MIT, thay được Cubism Core. Phải gán `window.Live2DCubismCore = PurismCore`. Dự án còn mới và chưa được Live2D thử thách.
- **Hoàn toàn không dùng Live2D:** psd2live xuất được web player riêng gồm `p2l.js` và WASM, license MIT. Đổi lại sẽ mất VTube Studio và MotionSync.
- **Phát trực tiếp:** VTube Studio có API WebSocket tại `ws://localhost:8001`. nizima LIVE có API tại `ws://localhost:22022`.
- **Khi tự làm không đủ đẹp:**
  - Dịch vụ "Live2D Splitter AI" của iMATE Engine: AI tách part rồi người rig, giá ¥120,000.
  - Thuê người rig tự do: khoảng ¥30,000 đến ¥150,000.

## 14. Tài liệu liên quan trong repo

- `docs/live2d-research.md`: báo cáo nghiên cứu đầy đủ, bảng so sánh, 44 công cụ đã kiểm chứng.
- `docs/live2d-research-catalog.md`: danh sách thô 474 công cụ đã quét.
- `docs/live2d-playground.md`: cài và dùng trang `/live2d`.
- `scripts/live2d/`:
  - `setup-core.mjs`: cài Cubism Core.
  - `fetch-sample.mjs`: tải model mẫu.
  - `check-model.mjs`: kiểm tra model.
  - `psd_inspect.py`: kiểm tra và sửa PSD.
