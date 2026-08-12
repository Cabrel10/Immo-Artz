<?php

// Origines issues de FRONTEND_URL (peut contenir plusieurs URLs séparées par des virgules)
$frontendOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('FRONTEND_URL', 'http://localhost:8092'))
)));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    // Origines autorisées : FRONTEND_URL + origines locales de dev + CORS_ALLOWED_ORIGINS
    'allowed_origins' => array_values(array_filter(array_unique(array_merge(
        $frontendOrigins,
        [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:8092',
            'http://127.0.0.1:8092',
        ],
        array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))
    )))),

    'allowed_origins_patterns' => [
        '#^https://.*\.onrender\.com$#',
        '#^https://.*\.pages\.dev$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    'supports_credentials' => (bool) env('CORS_SUPPORTS_CREDENTIALS', true),
];
