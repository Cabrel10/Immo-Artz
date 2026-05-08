# Architecture IMMO - Documentation Technique

## 📐 Structure de la Base de Données

### Schéma Relationnel

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │   properties    │     │    ratings      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────┤ agent_id (FK)   │     │ agent_id (FK)   │
│ first_name      │     │ id (PK)         |     │ property_id(FK) │
│ last_name       │     │ title           │     │ rater_name      │
│ email           │     │ description     │     │ score (1-5)     │
│ password        │     │ type            │     │ comment         │
│ role            │     │ standing        │     │ rater_ip        │
│ status          │     │ price           │     │ status          │
│ agency_name     │     │ area            │     └─────────────────┘
│ rating_average  │     │ images (JSON)   │
└─────────────────┘     │ city            │
         │              │ status          │
         │              └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │ property_views  │
         │              ├─────────────────┤
         │              │ property_id(FK) │
         │              │ ip_address      │
         │              │ viewed_at       │
         │              └─────────────────┘
         │
         └──────►┌─────────────────┐
                 │catalog_passwords│
                 ├─────────────────┤
                 │ id (PK)         │
                 │ password (8char)│
                 │ hash            │
                 │ valid_from      │
                 │ valid_until     │
                 │ max_uses        │
                 │ current_uses    │
                 └─────────────────┘
                          │
                 ┌─────────────────┐
                 │catalog_access_  │
                 │     logs        │
                 ├─────────────────┤
                 │ password_id(FK) │
                 │ ip_address      │
                 │ success         │
                 │ accessed_at     │
                 └─────────────────┘
```

## 🔧 Contrôleurs API

### AuthController
| Méthode |   Route   |     Description      | Auth |
|---------|-----------|----------------------|------|
| POST    | /register | Inscription          |  ❌  |
| POST    | /login    | Connexion            |  ❌  |
| POST    | /logout   | Déconnexion          |  ✅  |
| GET     | /me       | Profil               |  ✅  |
| PUT     | /profile  | Modifier profil      |  ✅  |
| PUT     | /password | Changer mot de passe |  ✅  |

### PropertyController
| Méthode |        Route         |   Description   |       Auth      |
|---------|----------------------|-----------------|-----------------|
| GET     |  /properties         | Liste + filtres | ❌             |
| GET     |  /properties/featured| En vedette      | ❌             |
| GET     |  /properties/nearby  | Proximité       | ❌             |
| GET     |  /properties/{id}    | Détail          | ❌             |
| POST    |  /properties         | Créer           | ✅ Agent/Admin |
| PUT     |  /properties/{id}    | Modifier        | ✅ Agent/Admin |
| DELETE  |  /properties/{id}    | Supprimer       | ✅ Agent/Admin |
| GET     |  /my-properties      | Mes propriétés  | ✅ Agent       |
| GET     |  /stats/properties   | Stats           | ✅ Admin       |

### RatingController
| Méthode |        Route         |   Description   |    Auth   |
|---------|----------------------|-----------------|-----------|
| GET     | /agents/{id}/ratings | Liste avis      | ❌       |
| POST    | /ratings             | Soumettre avis  | ❌       |
| GET     | /ratings/pending     | En attente      | ✅ Admin |
| POST    | /ratings/{id}/approve| Approuver       | ✅ Admin |
| POST    | /ratings/{id}/reject | Rejeter         | ✅ Admin |

### CatalogController
| Méthode |        Route      |      Description      | Auth      |
|---------|-------------------|-----------------------|-----------|
| POST    | /catalog/verify   | Vérifier mot de passe | ❌       |
| GET     | /catalog          | Voir catalogue        | ❌       |
| GET     | /catalog/download | Télécharger PDF       | ❌       |
| GET     | /catalog/password | Mot de passe actuel   | ✅ Admin |
| POST    | /catalog/rotate   | Rotation manuelle     | ✅ Admin |
| GET     | /catalog/history  | Historique            | ✅ Admin |

## 🛡 Système de Sécurité

### Gestion des Rôles
```php
// Middleware CheckRole
public function handle($request, $next, $role) {
    $allowedRoles = explode('|', $role); // 'admin|agent'
    if (!in_array($request->user()->role, $allowedRoles)) {
        return response()->json(['message' => 'Non autorisé'], 403);
    }
    return $next($request);
}
```

### Rate Limiting
```php
// Catalogue (brute force)
RateLimiter::for('catalog', fn($req) => 
    Limit::perMinute(10)->by($req->ip())
);

// Auth
RateLimiter::for('auth', fn($req) => 
    Limit::perMinute(5)->by($req->ip())
);
```

### Protection Anti-Spam Avis
```php
// Une note par IP par agent par 24h
$table->unique(['agent_id', 'rater_ip', 'created_at'], 
    'unique_rating_per_ip_daily');
```

## 📄 Génération PDF

### Classement du Catalogue
1. **Standing** (Haut de gamme → Moyen → Standard)
2. **Type** (Appartement → Maison → Villa → etc.)
3. **Premium** (Premium en premier)
4. **Date** (Plus récent)

### Template PDF
```blade
@foreach($grouped_properties as $standing => $types)
    <div class="section-header">{{ $standing }}</div>
    @foreach($types as $type => $props)
        <div class="subsection-header">{{ $type }}</div>
        @foreach($props as $property)
            // Carte propriété avec QR code
        @endforeach
    @endforeach
@endforeach
```

## 🔄 Système de Mot de Passe Rotatif

### Algorithme de Génération
```php
public static function generatePassword(int $length = 8): string
{
    $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    // Exclut: I, O, 0, 1 (pour éviter confusion)
    $password = '';
    for ($i = 0; $i < $length; $i++) {
        $password .= $characters[random_int(0, strlen($characters) - 1)];
    }
    return $password;
}
```

### Cron Job
```php
$schedule->command('catalog:rotate-password')
    ->twiceDaily(0, 12)  // Minuit et midi
    ->timezone('Africa/Douala');
```

## 🎨 Frontend Architecture

### Structure des Composants
```
src/
├── components/
│   ├── ui/              # Composants de base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── Header.tsx       # Navigation
│   ├── Footer.tsx       # Pied de page
│   ├── PropertyCard.tsx # Carte propriété
│   └── PropertyFilters.tsx # Filtres
├── hooks/
│   ├── useAuth.ts       # Authentification
│   ├── useTheme.ts      # Dark/Light mode
│   └── useProperties.ts # Gestion propriétés
├── pages/
│   ├── HomePage.tsx
│   ├── PropertiesPage.tsx
│   ├── PropertyDetailPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── CatalogPage.tsx
├── services/
│   └── api.ts           # Services API
└── types/
    └── index.ts         # Types TypeScript
```

### State Management
- **Zustand** pour le state global (auth, theme)
- **React Query** pour le cache serveur (à implémenter)
- **LocalStorage** pour le token et préférences

### Routing
```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/properties" element={<PropertiesPage />} />
  <Route path="/properties/:id" element={<PropertyDetailPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/catalog" element={<CatalogPage />} />
</Routes>
```

## 📊 Modèles Eloquent - Relations

### User
```php
public function properties(): HasMany
public function ratingsReceived(): HasMany
public function favorites(): HasMany
public function payments(): HasMany
```

### Property
```php
public function agent(): BelongsTo
public function views(): HasMany
public function favorites(): HasMany
public function ratings(): HasMany
```

### Rating
```php
public function agent(): BelongsTo
public function property(): BelongsTo
public function approver(): BelongsTo
```

### CatalogPassword
```php
public function accessLogs(): HasMany
public static function rotate(): self
public function verify(string $password): bool
```

## 🔐 Configuration CORS

```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'https://immo.cm',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

## 🚀 Déploiement

### Checklist Production
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] Configurer HTTPS
- [ ] Configurer CORS
- [ ] Configurer mail
- [ ] Configurer queue (Redis)
- [ ] Configurer backup
- [ ] Configurer monitoring
- [ ] Optimiser assets (`npm run build`)
- [ ] Cache config (`php artisan config:cache`)
- [ ] Cache routes (`php artisan route:cache`)
- [ ] Cache views (`php artisan view:cache`)

### Commandes de Déploiement
```bash
# Backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link

# Frontend
cd frontend
npm ci
npm run build
```

---

**Document généré pour le projet IMMO - Plateforme Immobilière Premium**
