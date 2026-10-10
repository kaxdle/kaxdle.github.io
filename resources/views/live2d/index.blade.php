<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Live2D playground</title>
    @vite(['resources/css/live2d.css'])
</head>
<body class="l2d">
<div class="l2d-layout">
    <main class="l2d-stage" id="l2d-stage">
        <canvas id="l2d-canvas" aria-label="Live2D model"></canvas>
        <p class="l2d-status" id="l2d-status" role="status">Đang khởi tạo…</p>
    </main>

    <aside class="l2d-panel">
        <section>
            <h2>Model</h2>
            @if (count($models))
                <select id="l2d-model">
                    @foreach (collect($models)->groupBy('group') as $group => $items)
                        <optgroup label="{{ $group }}">
                            @foreach ($items as $model)
                                <option value="{{ $model['url'] }}" @selected($model['url'] === $selectedUrl)>{{ $model['name'] }}</option>
                            @endforeach
                        </optgroup>
                    @endforeach
                </select>
            @else
                <div class="l2d-empty">
                    <p>Chưa có model nào trong <code>public/assets/live2d/models</code> hoặc <code>public/assets/live2d/samples</code>.</p>
                    <p>Cài Cubism Core và tải model mẫu chính thức (Hiyori, Haru):</p>
                    <pre>npm run live2d:core -- --accept-license
npm run live2d:sample -- --accept-license</pre>
                    <p>Model của bạn: chép cả thư mục chứa <code>*.model3.json</code> vào <code>public/assets/live2d/models/&lt;Tên&gt;/</code>.</p>
                </div>
            @endif
            <label class="l2d-check"><input type="checkbox" id="l2d-follow" checked> Nhìn theo con trỏ</label>
            <label class="l2d-check"><input type="checkbox" id="l2d-draggable"> Kéo để di chuyển model</label>
        </section>

        <section>
            <h2>Motion</h2>
            <div id="l2d-motions" class="l2d-buttons"><span class="l2d-muted">—</span></div>
        </section>

        <section>
            <h2>Expression</h2>
            <div id="l2d-expressions" class="l2d-buttons"><span class="l2d-muted">—</span></div>
        </section>

        <section>
            <h2>Lip sync</h2>
            <label class="l2d-file">File âm thanh (playVoice)
                <input type="file" id="l2d-voice" accept="audio/*">
            </label>
            <div class="l2d-row">
                <button type="button" id="l2d-voice-stop">Dừng giọng</button>
                <button type="button" id="l2d-mic">Bật micro</button>
            </div>
            <p class="l2d-muted" id="l2d-lipsync-note"></p>
        </section>

        <section>
            <h2>Tham số</h2>
            <div class="l2d-row">
                <input type="search" id="l2d-param-filter" placeholder="Lọc theo tên hoặc ID">
                <button type="button" id="l2d-param-release">Thả tất cả</button>
            </div>
            <p class="l2d-muted">Kéo thanh trượt để ghi đè tham số mỗi frame; bỏ tick để trả lại cho motion/physics.</p>
            <div id="l2d-params" class="l2d-params"></div>
        </section>

        <section>
            <h2>Thông tin</h2>
            <dl id="l2d-info" class="l2d-info"></dl>
        </section>
    </aside>
</div>

<script id="l2d-config" type="application/json">@json(['coreUrl' => $coreUrl, 'selectedUrl' => $selectedUrl, 'models' => $models])</script>
@if ($coreUrl)
    <script src="{{ $coreUrl }}"></script>
@endif
@vite(['resources/js/live2d/main.js'])
</body>
</html>
