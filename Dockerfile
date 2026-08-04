# IMMO - Plateforme Immobilière Premium
# Dockerfile pour production

# ================================
# Étape 1: Build du Frontend
# ================================
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

# Copier les fichiers de dépendances
COPY frontend/package*.json ./
COPY frontend/.npmrc ./

# Installer avec cache optimisé
RUN npm ci --prefer-offline --no-audit

# Copier le code source et builder
COPY frontend/ ./
RUN npm run build

# ================================
# Étape 2: Backend Laravel
# ================================
FROM php:8.2-fpm-alpine AS backend

# Installer les extensions PHP nécessaires
RUN apk add --no-cache \
    mysql-client \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    oniguruma-dev \
    libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        xml

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app/backend

# Copier les fichiers de dépendances
COPY backend/composer*.json ./

# Installer avec cache optimisé
# Note: Le cache Composer est local au host (~/.composer-cache)
RUN COMPOSER_CACHE_DIR=/tmp/composer-cache composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction

# Copier le code source
COPY backend/ ./

# Copier le build du frontend
COPY --from=frontend-build /app/frontend/dist ../frontend-dist

# Créer le lien symbolique pour le storage
RUN php artisan storage:link || true

# Permissions
RUN chown -R www-data:www-data /app/backend \
    && chmod -R 755 /app/backend/storage \
    && chmod -R 755 /app/backend/bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]

# ================================
# Étape 3: Nginx
# ================================
FROM nginx:alpine AS nginx

# Copier la configuration nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copier le frontend buildé
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copier le backend public
COPY --from=backend /app/backend/public /usr/share/nginx/html/api

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
