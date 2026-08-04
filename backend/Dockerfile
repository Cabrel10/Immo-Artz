FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl zip unzip libpng-dev libjpeg62-turbo-dev \
    libfreetype6-dev libzip-dev libonig-dev libxml2-dev \
    libpq-dev sqlite3 libsqlite3-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql pdo_pgsql pdo_sqlite \
        mbstring exif pcntl bcmath gd zip xml \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy composer files first for Docker layer cache
COPY composer.json composer.lock ./

# Install dependencies (no-scripts to avoid artisan calls without APP_KEY)
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copy full application source
COPY . .

# Create required directories and set permissions
RUN mkdir -p storage/framework/{cache,sessions,views} \
    && mkdir -p storage/logs \
    && mkdir -p storage/app/public \
    && mkdir -p bootstrap/cache \
    && mkdir -p database \
    && touch database/database.sqlite \
    && chmod -R 777 storage bootstrap/cache database

# Dump autoload with full class map
RUN composer dump-autoload --optimize --no-scripts

EXPOSE 8000

# At runtime: generate cache, run migrations, then serve
CMD sh -c "\
    php artisan package:discover --ansi 2>/dev/null || true && \
    php artisan config:clear && \
    php artisan migrate --force && \
    php artisan serve --host=0.0.0.0 --port=\${PORT:-8000}"
