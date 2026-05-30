<?php

return [
    'default' => env('FILESYSTEM_DISK', 'local'),

    'disks' => [
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app'),
            'throw' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL') . '/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'visibility' => 'public',
        ],

        // Alias générique : configurable via env (R2, DO Spaces, Backblaze B2…)
        'cloud' => [
            'driver' => 's3',
            'key' => env('CLOUD_KEY', env('AWS_ACCESS_KEY_ID')),
            'secret' => env('CLOUD_SECRET', env('AWS_SECRET_ACCESS_KEY')),
            'region' => env('CLOUD_REGION', env('AWS_DEFAULT_REGION', 'auto')),
            'bucket' => env('CLOUD_BUCKET', env('AWS_BUCKET')),
            'url' => env('CLOUD_URL', env('AWS_URL')),
            'endpoint' => env('CLOUD_ENDPOINT', env('AWS_ENDPOINT')),
            'use_path_style_endpoint' => env('CLOUD_USE_PATH_STYLE_ENDPOINT', true),
            'throw' => false,
            'visibility' => 'public',
        ],
    ],

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],
];
