# SFRS Staff Portal

Unofficial Staffordshire Fire and Rescue ROBLOX staff portal demo.

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and fill Roblox OAuth values.
3. Run `npm install`.
4. Run `npm run seed` after setting `INITIAL_OWNER_ROBLOX_ID`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

Roblox redirect URI: `http://localhost:3000/auth/roblox/callback`
