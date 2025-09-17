# Sports Multi-Tenant Admin Portal

Ce dépôt contient une API Django REST Framework sécurisée par JWT et un portail Angular pour gérer des clubs multi-tenant. Les rôles supportés sont `SUPERADMIN`, `OWNER`, `COACH`, `CLIENT`. Les super administrateurs peuvent créer des tenants, inviter des owners et suivre leur onboarding via des invitations.

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

### Endpoints principaux

| Méthode | URL | Description |
| ------- | --- | ----------- |
| POST | `/auth/login/` | Authentifie un utilisateur (email + mot de passe) et retourne un couple access/refresh JWT. |
| POST | `/auth/refresh/` | Renouvelle le token d'accès à partir du refresh token. |
| GET | `/api/v1/me/` | Retourne `{ role, tenant, profile }` pour l'utilisateur connecté. |
| GET | `/api/v1/tenants/` | Liste les tenants (SUPERADMIN uniquement). |
| POST | `/api/v1/tenants/` | Crée un tenant (SUPERADMIN uniquement). |
| GET | `/api/v1/tenants/{id}/` | Détail d'un tenant (accessible au SUPERADMIN et au OWNER rattaché). |
| POST | `/api/v1/tenants/{id}/invite-owner/` | Génère une invitation owner et retourne le token (SUPERADMIN). |
| POST | `/api/v1/tenants/{id}/assign-owner/` | Associe un owner existant au tenant (SUPERADMIN). |
| POST | `/api/v1/owners/accept-invite/` | Finalise l'onboarding owner (public). |

Toutes les routes tenant-scoped filtrent automatiquement sur `request.user.tenant` pour les owners.

## 3. Portail Angular

```bash
cd frontend/sports
npm install  # la première fois uniquement
npm run start  # lance http://localhost:4200
```

1. Ouvrir `http://localhost:4200/auth/login`.
2. Se connecter avec un compte SUPERADMIN pour accéder à `/superadmin/tenants`, créer un tenant et envoyer des invitations owners.
3. Un owner connecté est automatiquement redirigé vers `/owner/dashboard` et peut consulter les paramètres de son club dans `/owner/settings` (lecture seule pour l'instant).
4. Le lien « Déconnexion » vide le stockage local et redirige vers l'écran de connexion.

## 4. Notes multi-tenant & rôles

- Les rôles principaux sont `SUPERADMIN`, `OWNER`, `COACH`, `CLIENT`. Le champ `tenant` est une clé étrangère vers le modèle `Tenant` (nullable pour les super administrateurs).
- `GET /api/v1/me/` renvoie la structure `{ role, tenant, profile }` et le frontend stocke cette payload pour gérer les redirections basées sur le rôle.
- L'acceptation d'une invitation met automatiquement à jour le statut `OwnerInvitation` et crée (ou met à jour) un utilisateur OWNER rattaché au tenant.

## 5. Tests

- Backend : lancer `python manage.py test` depuis `backend/`.
- Frontend : lancer `npm run test` depuis `frontend/sports/`.

## 6. Tester le flow d'invitation

1. Créer un tenant via l'interface SUPERADMIN (`/superadmin/tenants`) ou en appelant `POST /api/v1/tenants/` avec un token SUPERADMIN.
2. Envoyer une invitation owner depuis l'onglet « Owners » du tenant (`POST /api/v1/tenants/{id}/invite-owner/`). Le backend renvoie directement le token.
3. Visiter `http://localhost:4200/accept-invite/<token>` et compléter le formulaire (mot de passe + prénom/nom).
4. L'invitation est validée, l'utilisateur OWNER est créé/associé, puis connecté automatiquement. Il est redirigé vers `/owner/dashboard`.
5. Recharger `/api/v1/me/` confirme que `{ role: 'OWNER', tenant: {...} }` est bien renvoyé.
