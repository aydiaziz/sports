# Sports Multi-Tenant Admin Portal

Ce dépôt contient une API Django REST Framework sécurisée par JWT et un portail d'administration Angular pour une plateforme multi-tenant. L'authentification repose sur un utilisateur personnalisé identifiant par email avec gestion des rôles (`SUPERADMIN`, `ADMIN`, `COACH`, `CLIENT`) et d'un champ `tenant`.

## 1. Pré-requis

- Python 3.11+
- Node.js 18+
- npm 9+

## 2. Démarrer l'API Django

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # optionnel mais recommandé
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # le rôle SUPERADMIN est appliqué automatiquement
python manage.py runserver  # l'API écoute sur http://localhost:8000
```

### Endpoints disponibles

| Méthode | URL              | Description                       |
| ------- | ---------------- | --------------------------------- |
| POST    | `/auth/login/`   | Authentifie un utilisateur (email + mot de passe) et retourne un couple access/refresh JWT. |
| POST    | `/auth/refresh/` | Renouvelle le token d'accès.      |
| POST    | `/auth/register/`| Création d'un utilisateur (réservé aux rôles `SUPERADMIN` et `ADMIN`). |
| GET     | `/auth/me/`      | Retourne le profil connecté (email, rôle, tenant). |

Les permissions sont appliquées côté API via des `permission_classes` basées sur le rôle de l'utilisateur.

## 3. Portail Angular (admin)

```bash
cd frontend/sports
npm install  # la première fois uniquement
npm run start  # lance http://localhost:4200
```

1. Ouvrir `http://localhost:4200/auth/login`.
2. Se connecter avec le compte créé précédemment.
3. Après connexion, le portail appelle `/auth/me/` pour récupérer rôle et tenant, puis redirige vers le tableau de bord (`/dashboard`).
4. Le token JWT est stocké dans `localStorage` et automatiquement attaché aux requêtes grâce à l'intercepteur.

Le lien « Déconnexion » vide le stockage local et redirige vers l'écran de connexion.

## 4. Notes multi-tenant & rôles

- Les rôles sont stockés côté backend dans le champ `role` du modèle `User`. Les super administrateurs peuvent créer d'autres utilisateurs (toutes organisations) via `/auth/register/`.
- Le champ `tenant` permet d'identifier la structure/organisation rattachée à l'utilisateur. La valeur est renvoyée dans `/auth/me/` et affichée dans le header du portail.
- Les tokens de rafraîchissement sont rotatifs (liste noire activée) ; un 401 côté frontend déclenche automatiquement une tentative de rafraîchissement.

## 5. Tests

- Backend : lancer `python manage.py test` depuis `backend/`.
- Frontend : lancer `npm run test` depuis `frontend/sports/`.
