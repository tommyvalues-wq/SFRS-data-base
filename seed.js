require('dotenv').config();
const { db } = require('./db');
const id = process.env.INITIAL_OWNER_ROBLOX_ID;
if (!id) throw new Error('Set INITIAL_OWNER_ROBLOX_ID in .env first');
db.prepare("INSERT INTO users(roblox_id, username, role, is_allowed) VALUES(?,?, 'owner', 1) ON CONFLICT(roblox_id) DO UPDATE SET role='owner', is_allowed=1").run(String(id), 'InitialOwner');
console.log(`Owner seeded for Roblox ID ${id}`);
