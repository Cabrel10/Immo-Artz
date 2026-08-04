# ============================================
# SETUP IMMO - Installation avec cache externe
# Windows PowerShell
# ============================================

Write-Host "🔧 Initialisation du projet IMMO..." -ForegroundColor Green

# 1. Vérifier Git
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ Git n'est pas installé" -ForegroundColor Red
    exit 1
}

# 2. Vérifier Node.js & npm
try {
    node --version | Out-Null
} catch {
    Write-Host "❌ Node.js n'est pas installé. Installez-le depuis https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 3. Vérifier PHP & Composer
try {
    php --version | Out-Null
} catch {
    Write-Host "❌ PHP n'est pas installé" -ForegroundColor Red
    exit 1
}

try {
    composer --version | Out-Null
} catch {
    Write-Host "❌ Composer n'est pas installé" -ForegroundColor Red
    exit 1
}

# 4. Configurer les variables d'environnement
Write-Host "📦 Configuration des caches..." -ForegroundColor Yellow

$npmCache = "$env:APPDATA\npm-cache"
$composerCache = "$env:APPDATA\Composer\cache"

Write-Host "  ✓ npm cache: $npmCache" -ForegroundColor Cyan
Write-Host "  ✓ composer cache: $composerCache" -ForegroundColor Cyan

# Créer les dossiers s'ils n'existent pas
if (!(Test-Path $npmCache)) {
    New-Item -ItemType Directory -Force -Path $npmCache | Out-Null
}
if (!(Test-Path $composerCache)) {
    New-Item -ItemType Directory -Force -Path $composerCache | Out-Null
}

# 5. Installer les dépendances du frontend
Write-Host "📦 Installation des dépendances frontend..." -ForegroundColor Yellow
Set-Location frontend
npm ci --prefer-offline --no-audit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'installation npm" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 6. Installer les dépendances du backend
Write-Host "📦 Installation des dépendances backend..." -ForegroundColor Yellow
Set-Location backend
composer install --no-dev --optimize-autoloader
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'installation composer" -ForegroundColor Red
    exit 1
}

# Créer les fichiers de configuration
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
}
php artisan key:generate 2>$null

Set-Location ..

Write-Host ""
Write-Host "✅ Installation terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Configuration :" -ForegroundColor Cyan
Write-Host "  - Frontend cache: $npmCache"
Write-Host "  - Backend cache: $composerCache"
Write-Host "  - node_modules: frontend/node_modules (git-ignored)"
Write-Host "  - vendor: backend/vendor (git-ignored)"
Write-Host ""
Write-Host "🚀 Prochaines étapes :" -ForegroundColor Green
Write-Host "  1. Configurer le .env du backend"
Write-Host "  2. Démarrer le serveur: docker-compose up"
Write-Host "  3. Accéder à: http://localhost:3000 (frontend)"
