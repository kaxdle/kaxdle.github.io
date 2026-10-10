<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Live2D Cubism Core
    |--------------------------------------------------------------------------
    |
    | easy-live2d 1.x chỉ chạy với Core của "Cubism 5 SDK for Web R5"
    | (cần Live2DCubismCore.MocVersion_53). Cài bằng:
    |
    |     npm run live2d:core -- --accept-license
    |
    | Lệnh này tải gói SDK chính thức, kiểm tra checksum và chép Core vào
    | public/assets/live2d/core/ (đã gitignore). Bản Core do Live2D host tại
    | cubism.live2d.com/sdk-web/cubismcore/ là bản cũ hơn và bị easy-live2d
    | từ chối, nên không dùng làm mặc định. Đường dẫn tương đối được đưa qua
    | asset(); URL tuyệt đối giữ nguyên.
    |
    */

    'core_url' => env('LIVE2D_CORE_URL', 'assets/live2d/core/live2dcubismcore.min.js'),

    /*
    | Thư mục (trong public/) được quét để tìm *.model3.json, theo thứ tự hiển thị.
    | models/  : model của bạn (ví dụ Dania), được commit vào repo.
    | samples/ : model mẫu tải bằng `npm run live2d:sample`, không commit.
    */

    'model_dirs' => [
        'assets/live2d/models' => 'Model của bạn',
        'assets/live2d/samples' => 'Model mẫu Live2D',
    ],

];
