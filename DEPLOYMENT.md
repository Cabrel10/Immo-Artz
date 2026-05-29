# 🚀 DÉPLOIEMENT SUR RENDER

## Prérequis

- Compte Render : https://render.com/
- Repository GitHub connecté à Render
- (Optionnel) Domain custom

---

## 🎯 Déploiement Automatisé avec render.yaml

### Étape 1 : Connecter GitHub à Render

1. Accéder à https://render.com/
2. Créer un nouveau **Blueprint**
3. Connecter ton repository GitHub
4. Render détecte automatiquement `render.yaml`
5. ✅ Déploiement automatique

### Étape 2 : Variables d'Environnement

Render charge **automatiquement** les variables depuis `render.yaml`, mais tu dois définir les secrets :

**Dans Render Dashboard :**
- `APP_KEY` : Laravel key (généré pendant build)
- `SANCTUM_ENCRYPT_COOKIES` : `false`
- `FRONTEND_URL` : URL du frontend après déploiement

---

## 📊 Ce que render.yaml Crée

```
┌─────────────────────────────────────────┐
│          RENDER SERVICES               │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ PostgreSQL Database (immo-db)    │  │
│  │ Plan: Free                       │  │
│  │ 256 MB RAM, auto-backup          │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Backend Laravel (immo-backend)   │  │
│  │ - Node: PHP 8.2                  │  │
│  │ - Persistent Disk: 1 GB          │  │
│  │ - Auto restart on crash          │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Frontend React (immo-frontend)   │  │
│  │ - Node: 22                       │  │
│  │ - SPA routing configured         │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 Configuration RENDER.YAML

### 1. Database (PostgreSQL)
```yaml
- type: pgsql
  name: immo-db
  plan: free
```
✓ Gré par Render
✓ Connexion automatique via `render.yaml`
✓ Données persistantes

### 2. Backend (Laravel)
```yaml
- type: web
  name: immo-backend
  runtime: php
```
- Disk persistant pour `storage/app/public`
- Migrations exécutées auto au deploy
- CORS configuré
- DB Connection : PostgreSQL

### 3. Frontend (React)
```yaml
- type: static_site
  name: immo-frontend
```
- Build Vite optimisé
- SPA routing (tout → index.html)
- Env var `VITE_API_URL` injectée

---

## ⚡ Premier Déploiement

### Pas à pas

1. **Push sur GitHub**
   ```bash
   git add .
   git commit -m "chore: add render deployment config"
   git push origin beta
   ```

2. **Sur Render Dashboard**
   - New → Blueprint
   - Sélectionner ton repo
   - Autoriser Render à accéder au repo
   - Render détecte `render.yaml`
   - ✅ Cliquer "Deploy"

3. **Attendre ~10-15 minutes**
   - Database création
   - Backend build (composer install)
   - Frontend build (npm run build)
   - Migrations exécutées
   - Services connectés

4. **Vérifier l'état**
   - Dashboard Render
   - Tous les services doivent être "Live" (vert)

---

## 🌐 Domaines

### URLs Générées
```
Backend:  https://immo-backend-xxxx.onrender.com
Frontend: https://immo-frontend-xxxx.onrender.com
Database: Interne (postgres-xxxx.onrender.com)
```

### Configurer Custom Domain (Payant)
```
Frontend:
  - Settings → Custom Domain
  - Ajouter immo.dev (DNS via Namecheap/Route53)

Backend:
  - Settings → Custom Domain
  - Ajouter api.immo.dev
```

---

## 🔒 Secrets & Configuration

### En Production (Variables à setter sur Render)

1. **APP_KEY**
   - Généré par Laravel pendant build
   - Vérifié automatiquement

2. **CORS & SANCTUM**
   - `SANCTUM_STATEFUL_DOMAINS=immo-frontend-xxxx.onrender.com`
   - `SESSION_DOMAIN=.onrender.com`
   - Configurés dans `render.yaml`

3. **Payment APIs** (Optionnel pour MVP)
   - `MTN_MONEY_API_KEY`
   - `ORANGE_MONEY_API_KEY`

### Comment les setter

```
Render Dashboard
→ immo-backend (service)
→ Environment
→ Add environment variables
→ Saisir les secrets
→ Save & Redeploy
```

---

## 🐛 Troubleshooting

### Backend en erreur (Red X)

**Logs :**
```
Dashboard → immo-backend → Logs
```

**Causes courantes :**
1. **DB Connection Failed**
   - Render génère les ENV automatiquement
   - Vérifier dans "Environment" que DB_* sont présents
   - Re-deploy

2. **PHP Version**
   - Vérifier `render.yaml` → `PHP_VERSION: 8.2`
   - Render utilise 8.1 par défaut, nous voulons 8.2

3. **Permissions**
   - Disk `/app/backend/storage` doit être writable
   - Configuré dans `render.yaml` (`disk:`)

### Frontend en erreur

**Cause 1 : VITE_API_URL mal défini**
```bash
# Vérifier dans Browser Console
console.log(import.meta.env.VITE_API_URL)
# Doit afficher : https://immo-backend-xxxx.onrender.com/api
```

**Cause 2 : 404 au reload**
- SPA routing non configuré
- Vérifier `render.yaml` : routes section
- Toutes les routes doivent → `/index.html`

### Database vide

**Vérifier migrations :**
```
Dashboard → immo-backend → Logs
Chercher "Migrating"
```

**Forcer migration manuellement :**
```
Render Web Service Console
$ php artisan migrate --force
$ php artisan db:seed
```

---

## 📈 Scaling (Après MVP)

### Passage en Production
```
immo-backend:  Plan "Standard" (~$10/mo)
immo-frontend: Plan "Standard" (~$7/mo) 
immo-db:       Plan "PostgreSQL" (~$7/mo)
```

### Cache Redis
```yaml
- type: redis
  name: immo-cache
  plan: free
```

### Background Jobs
```
Plan "Standard" + Queue Worker
```

---

## ✅ Checklist Pré-Déploiement

- [ ] `render.yaml` commité
- [ ] `.env.example` mise à jour
- [ ] `config/cors.php` créé
- [ ] `bootstrap/app.php` CORS activé
- [ ] `backend/Procfile` présent
- [ ] `backend/nginx.conf` présent
- [ ] `frontend/src/services/api.ts` utilise `VITE_API_URL`
- [ ] Pas de `node_modules` ou `vendor` dans git
- [ ] `.gitignore` à jour
- [ ] Repo nettoyé (~5 MB)
- [ ] Dernier commit pushé sur `beta`

---

## 🚀 Lancer le Déploiement

```bash
# 1. Vérifier status local
npm run build        # Frontend
composer install     # Backend

# 2. Commit final
git add .
git commit -m "chore: prepare for render deployment"
git push origin beta

# 3. Render Dashboard
# Blueprint → Deploy

# 4. Attendre & vérifier
# Logs → Tous services en vert
```

---

## 📞 Support Render

- Dashboard : https://dashboard.render.com/
- Logs : Services → Logs (temps réel)
- Health : Services → Health (CPU, Memory)
- Docs : https://render.com/docs/

---

**Bonne chance! 🎉**
