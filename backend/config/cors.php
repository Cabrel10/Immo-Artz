<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure CORS settings for your application. This output
    | is compiled from your CORS configuration defined in your application
    | configuration. The 'paths' and 'allowed_methods' are merged together.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // Local Development
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',  // Vite dev server
        
        // Render Production
        'https://*.onrender.com',
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\.onrender\.com$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
