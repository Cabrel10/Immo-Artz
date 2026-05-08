# IMMO - Plateforme Immobilière Premium

Plateforme immobilière premium pour le marché camerounais, avec accès gratuit limité et catalogue PDF premium payant.

## 🏗 Architecture

Le projet suit une architecture **Backend/Frontend séparée** avec les principes **SOLID** et **Clean Coding**.

```
immo/
├── backend/          # API Laravel 11
│   ├── app/
│   │   ├── Console/Commands/     # Commandes Artisan
│   │   ├── Http/Controllers/Api/ # Contrôleurs API
│   │   ├── Models/               # Modèles Eloquent
│   │   └── ...
│   ├── database/migrations/      # Migrations
│   ├── resources/views/pdf/      # Templates PDF
│   └── routes/api.php            # Routes API
│
└── frontend/         # React + TypeScript + Tailwind
    ├── src/
    │   ├── components/    # Composants React
    │   ├── hooks/         # Hooks personnalisés
    │   ├── pages/         # Pages
    │   ├── services/      # Services API
    │   └── ...
    └── ...
```

## 🚀 Stack Technique

### Backend
- **Laravel 11** - Framework PHP
- **Sanctum** - Authentification API
- **MySQL** - Base de données
- **DomPDF** - Génération PDF
- **QR Code** - Génération QR codes

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Leaflet** - Cartes interactives

## 📊 Structure de la Base de Données

### Tables Principales

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs (Admin, Agent, Visiteur) |
| `properties` | Propriétés immobilières avec JSON pour images |
| `ratings` | Avis sur les agents avec protection anti-spam |
| `catalog_passwords` | Mots de passe rotatifs pour le catalogue |
| `catalog_access_logs` | Logs d'accès au catalogue (rate limiting) |
| `property_views` | Vues des propriétés (une par IP/jour) |
| `favorites` | Favoris des utilisateurs |
| `contact_requests` | Demandes de contact |
| `payments` | Paiements (catalogue, mise en avant) |

## 🔐 Système de Mot de Passe Rotatif

### Fonctionnement
- Mot de passe généré automatiquement toutes les **12 heures**
- Validité: **12 heures** après génération
- Prix: **2 000 FCFA**
- Limite d'utilisations: **100** par mot de passe

### Commande Artisan
```bash
# Rotation manuelle
php artisan catalog:rotate-password

# Avec options
php artisan catalog:rotate-password --validity=24 --max-uses=200 --price=3000
```

### Cron Job (Automatique)
```php
// app/Console/Kernel.php
$schedule->command('catalog:rotate-password')
    ->twiceDaily(0, 12)  // Minuit et midi
    ->timezone('Africa/Douala');
```

## 📱 Endpoints API

### Authentification
```
POST /api/v1/register
POST /api/v1/login
POST /api/v1/logout
GET  /api/v1/me
PUT  /api/v1/profile
PUT  /api/v1/password
```

### Propriétés
```
GET    /api/v1/properties              # Liste avec filtres
GET    /api/v1/properties/featured     # En vedette
GET    /api/v1/properties/nearby       # Proximité géo
GET    /api/v1/properties/{id}         # Détail
POST   /api/v1/properties              # Créer (Agent/Admin)
PUT    /api/v1/properties/{id}         # Modifier
DELETE /api/v1/properties/{id}         # Supprimer
GET    /api/v1/my-properties           # Mes propriétés
```

### Avis (Ratings)
```
GET  /api/v1/agents/{id}/ratings       # Liste des avis
POST /api/v1/ratings                   # Soumettre un avis
GET  /api/v1/ratings/pending           # En attente (Admin)
POST /api/v1/ratings/{id}/approve      # Approuver (Admin)
POST /api/v1/ratings/{id}/reject       # Rejeter (Admin)
```

### Catalogue Premium
```
POST /api/v1/catalog/verify            # Vérifier mot de passe
GET  /api/v1/catalog                   # Voir le catalogue
GET  /api/v1/catalog/download          # Télécharger PDF
GET  /api/v1/catalog/password          # Mot de passe actuel (Admin)
POST /api/v1/catalog/rotate            # Rotation manuelle (Admin)
GET  /api/v1/catalog/history           # Historique (Admin)
```

## 🎨 Design System

### Couleurs
- **Primary**: `#0c4a6e` (Immo 900)
- **Secondary/Or**: `#f59e0b` (Gold 500)
- **Background Light**: `#ffffff`
- **Background Dark**: `#0f172a`

### Badges de Standing
| Standing | Couleur |
|----------|---------|
| Standard | Gris |
| Moyen | Bleu |
| Haut de gamme | Or |

### Breakpoints
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

## 🛡 Sécurité

### Authentification
- **Sanctum** pour les tokens API
- Tokens avec abilities selon le rôle
- Révocation possible

### Rate Limiting
```php
// Catalogue (brute force protection)
RateLimiter::for('catalog', fn($req) => Limit::perMinute(10)->by($req->ip()));

// Auth
RateLimiter::for('auth', fn($req) => Limit::perMinute(5)->by($req->ip()));

// Ratings (anti-spam)
RateLimiter::for('ratings', fn($req) => Limit::perHour(3)->by($req->ip()));
```

### Protection Anti-Spam Avis
- Une note par **IP** par **agent** par **24h**
- Modération obligatoire avant publication
- Stockage de l'IP pour traçabilité

## 📄 Génération PDF

Le catalogue PDF est généré avec **DomPDF** et comprend:
- Page de couverture
- Table des matières
- Propriétés classées par **Standing** puis par **Type**
- QR codes pointant vers chaque annonce
- Design premium responsive

### Template Blade
```php
// resources/views/pdf/catalog.blade.php
$pdf = Pdf::loadView('pdf.catalog', [
    'properties' => $properties,
    'grouped_properties' => $grouped,
    'generated_at' => now(),
])->setPaper('a4');
```

## 🚀 Installation

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Configuration Environment

**Backend (.env)**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=immo
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 📚 Documentation API

La documentation complète de l'API est disponible via:
- Postman Collection: `docs/IMMO-API.postman_collection.json`
- OpenAPI/Swagger: `docs/openapi.yaml`

## 🧪 Tests

```bash
# Backend tests
php artisan test

# Frontend tests
npm run test
```

## 📝 License

Propriétaire - Tous droits réservés

## 👥 Équipe

- **Lead Developer** - Architecture & Backend
- **Frontend Developer** - React & UI/UX
- **DevOps** - Déploiement & Infrastructure

---

**IMMO** - Plateforme immobilière premium au Cameroun 🇨🇲
