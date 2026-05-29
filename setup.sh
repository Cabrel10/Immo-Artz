#!/bin/bash

# ============================================
# SETUP IMMO - Installation avec cache externe
# ============================================

echo "🔧 Initialisation du projet IMMO..."

# 1. Vérifier Git
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé"
    exit 1
fi

# 2. Vérifier Node.js & npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Installez-le depuis https://nodejs.org/"
    exit 1
fi

# 3. Vérifier PHP & Composer
if ! command -v php &> /dev/null; then
    echo "❌ PHP n'est pas installé"
    exit 1
fi

if ! command -v composer &> /dev/null; then
    echo "❌ Composer n'est pas installé"
    exit 1
fi

# 4. Configurer les caches
echo "📦 Configuration des caches..."

# npm cache (utilise déjà ~/.npm par défaut)
echo "  ✓ npm cache: ~/.npm"

# composer cache
export COMPOSER_CACHE_DIR="$HOME/.composer-cache"
export COMPOSER_HOME="$HOME/.composer"
echo "  ✓ composer cache: $HOME/.composer-cache"

# 5. Installer les dépendances du frontend
echo "📦 Installation des dépendances frontend..."
cd frontend
npm ci --prefer-offline --no-audit
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation npm"
    exit 1
fi
cd ..

# 6. Installer les dépendances du backend
echo "📦 Installation des dépendances backend..."
cd backend
composer install --no-dev --optimize-autoloader
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation composer"
    exit 1
fi

# Créer les fichiers de configuration
cp .env.example .env 2>/dev/null
php artisan key:generate 2>/dev/null

cd ..

echo ""
echo "✅ Installation terminée !"
echo ""
echo "📝 Configuration :"
echo "  - Frontend cache: ~/.npm"
echo "  - Backend cache: ~/.composer-cache"
echo "  - node_modules: frontend/node_modules (git-ignored)"
echo "  - vendor: backend/vendor (git-ignored)"
echo ""
echo "🚀 Prochaines étapes :"
echo "  1. Configurer le .env du backend"
echo "  2. Démarrer le serveur: docker-compose up"
echo "  3. Accéder à: http://localhost:3000 (frontend)"
