<?php

/**
 * Configuration métier IMMO.
 * Toutes les valeurs sont surchargées via .env (12-factor).
 */
return [
    // Prix du mot de passe catalogue (XAF)
    'catalog_price' => (int) env('CATALOG_PRICE', 2000),

    // Durée de validité d'un mot de passe (heures)
    'catalog_password_validity_hours' => (int) env('CATALOG_PASSWORD_VALIDITY', 12),

    // Nombre max d'utilisations d'un mot de passe
    'catalog_password_max_uses' => (int) env('CATALOG_PASSWORD_MAX_USES', 100),

    // Disk Storage pour les uploads (public, s3, cloud…)
    'upload_disk' => env('IMMO_UPLOAD_DISK', 'public'),

    // Driver paiement : fake | campay | notchpay | mtn | orange
    'payment_driver' => env('PAYMENT_DRIVER', 'fake'),

    // URL Frontend (pour redirections, emails…)
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
];
