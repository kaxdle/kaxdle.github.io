import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/live2d.css',
                'resources/js/live2d/main.js',
            ],
            refresh: true,
        }),
    ],
});
