# 📦 SETUP - Installation du Projet IMMO

## 🎯 Objectif

Installer les dépendances du projet **sans** encombrer le répertoire courant avec `node_modules` et `vendor` dans les caches locaux.

## 📍 Localisation des Caches

### Windows
```
npm cache:         C:\Users\<username>\AppData\Roaming\npm-cache
composer cache:    C:\Users\<username>\AppData\Roaming\Composer\cache
```

### macOS / Linux
```
npm cache:         ~/.npm
composer cache:    ~/.composer-cache
```

## ⚙️ Pré-requis

- **Git** : [https://git-scm.com/](https://git-scm.com/)
- **Node.js & npm** : [https://nodejs.org/](https://nodejs.org/) (v18+)
- **PHP** : [https://www.php.net/](https://www.php.net/) (v8.2+)
- **Composer** : [https://getcomposer.org/](https://getcomposer.org/)
- **Docker** (optionnel) : [https://www.docker.com/](https://www.docker.com/)

## 🚀 Installation

### Option 1 : Script Automatisé (Recommandé)

#### Sur Windows (PowerShell)
```powershell
# Ouvrir PowerShell en tant qu'administrateur
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

#### Sur macOS / Linux (Bash)
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2 : Installation Manuelle

#### 1️⃣ Clone le projet
```bash
git clone https://github.com/Linfaigk4/Immo-Artz.git
cd Immo-Artz
git checkout beta
```

#### 2️⃣ Installer Frontend
```bash
cd frontend
npm ci
cd ..
```

#### 3️⃣ Installer Backend
```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
cd ..
```

## 🔍 Vérification

### Vérifier que les caches sont externes
```bash
# Windows (PowerShell)
Get-Item "$env:APPDATA\npm-cache" -Force
Get-Item "$env:APPDATA\Composer" -Force

# macOS / Linux
ls -la ~/.npm
ls -la ~/.composer-cache
```

### Vérifier que node_modules et vendor sont git-ignored
```bash
git status
# Ne doit PAS afficher frontend/node_modules ou backend/vendor
```

### Compter les fichiers du repo
```bash
# Avant cleanup
git ls-files | wc -l   # Devrait être < 150

# Vérifier que node_modules n'est pas trackée
git ls-files | grep node_modules | wc -l  # Doit être 0
```

## 📊 Résumé Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| Fichiers repo | ~49 000 | ~150 |
| node_modules | Dans le repo | En cache (~/.npm) |
| vendor | Dans le repo | En cache (~/.composer-cache) |
| Taille du repo | ~200 MB | ~5 MB |
| Clone/Pull | Lent (50+ MB) | Rapide (~2 MB) |
| Git operations | Lent | Rapide ✓ |

## 🐳 Docker (Production)

Si vous utilisez Docker, les dépendances sont isolées dans les images et ne pollueront pas votre machine :

```bash
docker-compose up --build
```

Les fichiers Dockerfile sont configurés pour :
- Installer npm/composer **dans l'image** 
- Générer node_modules/vendor **dans le conteneur**
- Ne rien exporter vers le host

## ⚠️ Important : Ne Pas Commiter

Assurez-vous que `.gitignore` contient :
```
/vendor/
backend/vendor/
node_modules/
frontend/node_modules/
```

Vérifiez :
```bash
git status
# Ne doit JAMAIS montrer ces dossiers
```

## 🛠️ Troubleshooting

### node_modules réapparaît après npm install
```bash
# Solution : Nettoyer et réinstaller
rm -rf frontend/node_modules
cd frontend
npm ci
```

### vendor réapparaît après composer install
```bash
# Solution : Vérifier COMPOSER_HOME
composer config cache-dir
composer config --list
```

### Erreur "permission denied" sur macOS/Linux
```bash
# Donner les permissions
chmod -R 755 ~/.npm
chmod -R 755 ~/.composer-cache
```

## 📞 Support

Pour toute question : créer une issue sur GitHub
