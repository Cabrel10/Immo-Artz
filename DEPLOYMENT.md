# IMMO-Artz - Documentation de Deploiement

## Architecture Deployee

```
                    RENDER (Free Tier)
    ============================================

    +------------------------------------------+
    |  BACKEND (Docker Web Service)            |
    |  srv-d8gh1o3bc2fs73eijqlg                |
    |  https://immo-backend-api.onrender.com   |
    |                                          |
    |  - PHP 8.4 CLI + Laravel 11              |
    |  - SQLite (fichier persistant)           |
    |  - Sanctum Token Auth                    |
    |  - Auto-deploy depuis GitHub (beta)      |
    +------------------------------------------+

    +------------------------------------------+
    |  FRONTEND (Static Site)                  |
    |  srv-d8gh1tek1jcs73d06ke0                |
    |  https://immo-frontend-web.onrender.com  |
    |                                          |
    |  - React 18 + TypeScript + Vite 5        |
    |  - Tailwind CSS 3                        |
    |  - SPA routing (/* -> /index.html)       |
    |  - Auto-deploy depuis GitHub (beta)      |
    +------------------------------------------+

    GitHub Repository (PUBLIC):
    https://github.com/Linfaigk4/Immo-Artz
    Branch: beta (auto-deploy)
```

---

## URLs de Production

| Service  | URL                                          |
|----------|----------------------------------------------|
| Backend  | https://immo-backend-api.onrender.com        |
| Frontend | https://immo-frontend-web.onrender.com       |
| Health   | https://immo-backend-api.onrender.com/api/v1/health |

---

## Stack Technique

### Backend
- **Runtime**: PHP 8.4-cli (Docker)
- **Framework**: Laravel 11
- **Auth**: Sanctum (token-based)
- **Database**: SQLite (fichier `/app/database/database.sqlite`)
- **Timezone**: Africa/Douala (UTC+1)
- **PDF**: DomPDF
- **QR**: Simple QrCode

### Frontend
- **Framework**: React 18
- **Language**: TypeScript (strict mode)
- **Build**: Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: React Router 6

---

## Deploiement via API Render

Le deploiement a ete effectue integralement via l'API REST Render (pas de Blueprint).

### Credentials necessaires

| Credential     | Variable                  |
|----------------|---------------------------|
| Render API Key | `rnd_35bL9VPX...`        |
| Owner ID       | `tea-cspplrt6l47c73f66sq0`|
| GitHub Token   | Pour push vers repo       |

### Creation du Backend Service

```bash
curl -s -X POST 'https://api.render.com/v1/services' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer $RENDER_API_KEY' \
  -d '{
    "type": "web_service",
    "name": "immo-backend-api",
    "ownerId": "tea-cspplrt6l47c73f66sq0",
    "repo": "https://github.com/Linfaigk4/Immo-Artz",
    "branch": "beta",
    "rootDir": "backend",
    "runtime": "docker",
    "dockerfilePath": "./Dockerfile",
    "plan": "free",
    "region": "oregon",
    "autoDeploy": "yes",
    "envVars": [
      {"key": "APP_ENV", "value": "production"},
      {"key": "APP_DEBUG", "value": "false"},
      {"key": "APP_KEY", "value": "base64:..."},
      {"key": "DB_CONNECTION", "value": "sqlite"},
      {"key": "DB_DATABASE", "value": "/app/database/database.sqlite"},
      {"key": "PAYMENT_DRIVER", "value": "sandbox"}
    ]
  }'
```

### Creation du Frontend Service

```bash
curl -s -X POST 'https://api.render.com/v1/services' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer $RENDER_API_KEY' \
  -d '{
    "type": "static_site",
    "name": "immo-frontend-web",
    "ownerId": "tea-cspplrt6l47c73f66sq0",
    "repo": "https://github.com/Linfaigk4/Immo-Artz",
    "branch": "beta",
    "rootDir": "frontend",
    "buildCommand": "npm install && npm run build",
    "staticPublishPath": "dist",
    "autoDeploy": "yes",
    "routes": [{"type": "rewrite", "source": "/*", "destination": "/index.html"}],
    "envVars": [
      {"key": "VITE_API_URL", "value": "https://immo-backend-api.onrender.com/api/v1"}
    ]
  }'
```

---

## Variables d'Environnement Backend

| Variable          | Valeur                                   |
|-------------------|------------------------------------------|
| APP_ENV           | production                               |
| APP_DEBUG         | false                                    |
| APP_KEY           | base64:... (genere)                      |
| APP_TIMEZONE      | Africa/Douala                            |
| DB_CONNECTION     | sqlite                                   |
| DB_DATABASE       | /app/database/database.sqlite            |
| PAYMENT_DRIVER    | sandbox                                  |
| SESSION_DRIVER    | file                                     |
| CACHE_DRIVER      | file                                     |
| QUEUE_CONNECTION  | sync                                     |

---

## Dockerfile Backend

```dockerfile
FROM php:8.4-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl zip unzip libpng-dev libjpeg62-turbo-dev \
    libfreetype6-dev libzip-dev libonig-dev libxml2-dev \
    libpq-dev sqlite3 libsqlite3-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql pdo_pgsql pdo_sqlite \
        mbstring exif pcntl bcmath gd zip xml \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction
COPY . .

RUN mkdir -p storage/framework/{cache,sessions,views} \
    && mkdir -p storage/logs storage/app/public \
    && mkdir -p bootstrap/cache database \
    && touch database/database.sqlite \
    && chmod -R 777 storage bootstrap/cache database

RUN composer dump-autoload --optimize --no-scripts

EXPOSE 8000

CMD sh -c "\
    php artisan package:discover --ansi 2>/dev/null || true && \
    php artisan config:clear && \
    php artisan migrate --force && \
    php artisan serve --host=0.0.0.0 --port=\${PORT:-8000}"
```

**Points critiques:**
- PHP 8.4 obligatoire (composer.lock contient Symfony packages >= 8.4)
- `--no-scripts` evite l'execution de artisan sans APP_KEY durant le build
- Les commandes artisan sont dans CMD (runtime) ou elles ont acces aux env vars
- SQLite file cree dans le Dockerfile pour garantir son existence

---

## Tests Backend (PHPUnit)

### Execution

```bash
cd backend
php vendor/bin/phpunit
```

### Resultats attendus

```
OK (37 tests, 115 assertions)
```

### Architecture des tests

| Fichier                        | Tests | Description                          |
|--------------------------------|-------|--------------------------------------|
| Auth/AuthTest.php              | 7     | Register, login, profile, guards     |
| PropertyTest.php               | 6     | CRUD, authorization, filters         |
| FavoriteTest.php               | 5     | Add, remove, check, list, IDs        |
| ContactRequestTest.php         | 5     | Submit, rate limit, validation       |
| PaymentTest.php                | 8     | Mobile Money, auto-complete, webhook |
| CatalogTest.php                | 6     | Password verify, rotate, expiry      |

### Corrections appliquees (race conditions)

1. **TestCase.php**: `Carbon::setTestNow()` avec timezone `Africa/Douala`
2. **PaymentController**: `diffInSeconds($past, absolute: true)` (Carbon v3)
3. **CatalogTest**: Avance du temps pour tester l'expiration des mots de passe

---

## Validation Post-Deploiement

### Endpoints testes avec succes

```bash
# Health check
curl https://immo-backend-api.onrender.com/api/v1/health
# -> {"status":"ok","service":"immo-api","time":"2026-06-04T06:58:51+01:00"}

# Properties (public)
curl https://immo-backend-api.onrender.com/api/v1/properties
# -> {"success":true,"data":{"properties":[],...}}

# Registration (visitor)
curl -X POST https://immo-backend-api.onrender.com/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Marie","last_name":"Ngo","email":"test@x.cm","password":"Pass123!","password_confirmation":"Pass123!","phone":"+237699000001","role":"visitor"}'
# -> {"success":true,"data":{"user":{...},"access_token":"..."}}

# Registration (agent - requires validation)
curl -X POST https://immo-backend-api.onrender.com/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Paul","last_name":"M","email":"agent@x.cm","password":"Pass123!","password_confirmation":"Pass123!","phone":"+237699000002","role":"agent","agency_name":"Test","license_number":"LIC-001"}'
# -> {"success":true,"message":"Inscription reussie. Votre compte agent sera active apres validation."}

# Catalog verification
curl -X POST https://immo-backend-api.onrender.com/api/v1/catalog/verify \
  -H "Content-Type: application/json" \
  -d '{"password":"TESTPASS"}'
# -> Validation rules enforced

# Frontend
curl -o /dev/null -w "%{http_code}" https://immo-frontend-web.onrender.com/
# -> 200
```

---

## Operations courantes

### Declencher un redeploy manuel

```bash
# Backend
curl -X POST "https://api.render.com/v1/services/srv-d8gh1o3bc2fs73eijqlg/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": "clear"}'

# Frontend
curl -X POST "https://api.render.com/v1/services/srv-d8gh1tek1jcs73d06ke0/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": "do_not_clear"}'
```

### Verifier le statut des deploys

```bash
curl "https://api.render.com/v1/services/srv-d8gh1o3bc2fs73eijqlg/deploys?limit=1" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### Mettre a jour les variables d'environnement

```bash
curl -X PATCH "https://api.render.com/v1/services/srv-d8gh1o3bc2fs73eijqlg" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"envVars": [{"key": "APP_DEBUG", "value": "true"}]}'
```

---

## Limitations (Free Tier Render)

| Limitation                    | Impact                                    |
|-------------------------------|-------------------------------------------|
| Cold start (~30s)             | Premiere requete lente apres inactivite   |
| 750h/mois par service         | Suffisant pour 1 service 24/7             |
| Pas de persistent disk (free) | SQLite reinitialisee a chaque redeploy    |
| 100 MB static site            | Frontend bien en dessous (< 1 MB)         |
| Auto-sleep apres 15min        | Service dort si pas de trafic             |

### Solution pour la persistance DB

Pour la production, migrer vers:
- PostgreSQL (Render managed, $7/mois)
- Ou ajouter un Persistent Disk ($0.25/GB/mois) pour garder SQLite

---

## Workflow de Developpement

```
1. Modifier le code localement
2. Executer les tests: cd backend && php vendor/bin/phpunit
3. Build frontend: cd frontend && npm run build
4. Commit et push:
   git add .
   git commit -m "feat: description"
   git push origin beta
5. Render auto-deploy (webhook GitHub)
6. Verifier le deploy via API ou Dashboard
```

---

## Contact et Repository

- **Repo**: https://github.com/Linfaigk4/Immo-Artz
- **Branche**: beta (production)
- **Render Dashboard**: https://dashboard.render.com/
