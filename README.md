# Staffordshire Fire & Rescue Roblox Staff Portal (Unofficial Demo)

Professional Express + SQLite starter portal with Roblox OpenID Connect login, role-based access, firefighter records, and disciplinary actions.

## Features
- Roblox OAuth/OIDC login
- Allow-list access for selected Roblox users
- Owner and Professional Standards Team roles
- Add/remove Professional Standards Team members
- Add/edit/remove firefighters
- Add/edit/remove disciplinary actions
- Audit log
- Responsive professional UI

## Setup
1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill it in.
4. Create a Roblox OAuth app and set redirect URI to `http://localhost:3000/auth/roblox/callback`.
5. Run `npm run seed` to initialise the owner from `INITIAL_OWNER_ROBLOX_ID`.
6. Run `npm run dev` and open `http://localhost:3000`.

Roblox uses OpenID Connect on OAuth 2.0 for authentication. This app uses authorization-code flow and the `openid profile` scopes.

## Important
This is an unofficial demo template. Replace branding/content with your own authorised assets before public deployment.
