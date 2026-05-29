#!/usr/bin/env bash

echo "Building Laravel application..."

# Install dependencies
composer install --optimize-autoloader --no-dev

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Cache config
php artisan config:cache
php artisan route:cache

# Storage link
php artisan storage:link || true

echo "Build complete!"
