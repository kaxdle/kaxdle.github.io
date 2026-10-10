<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class Live2DController extends Controller
{
    public function index(Request $request)
    {
        $models = $this->discoverModels();
        $requested = $request->query('model');
        $selected = collect($models)->firstWhere('name', $requested) ?? ($models[0] ?? null);

        return view('live2d.index', [
            'models' => $models,
            'selectedUrl' => $selected['url'] ?? null,
            'coreUrl' => $this->coreUrl(),
        ]);
    }

    /**
     * URL tuyệt đối giữ nguyên; đường dẫn trong public/ đi qua asset() để chạy cả khi app nằm trong thư mục con.
     */
    private function coreUrl(): ?string
    {
        $url = config('live2d.core_url');

        if (! $url || preg_match('#^(https?:)?//#i', $url)) {
            return $url;
        }

        return asset(ltrim($url, '/'));
    }

    /**
     * Tìm mọi public/<dir>/<Tên>/*.model3.json trong các thư mục cấu hình.
     *
     * @return array<int, array{name: string, group: string, url: string}>
     */
    private function discoverModels(): array
    {
        $publicRoot = rtrim(str_replace('\\', '/', public_path()), '/');
        $models = [];

        foreach (config('live2d.model_dirs', []) as $dir => $label) {
            $pattern = $publicRoot.'/'.trim($dir, '/').'/*/*.model3.json';
            $files = glob($pattern) ?: [];
            sort($files);

            foreach ($files as $file) {
                $relative = ltrim(substr(str_replace('\\', '/', $file), strlen($publicRoot)), '/');
                $segments = array_map('rawurlencode', explode('/', $relative));

                $models[] = [
                    'name' => basename(dirname($file)),
                    'group' => $label,
                    'url' => asset(implode('/', $segments)),
                ];
            }
        }

        return $models;
    }
}
