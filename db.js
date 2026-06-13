const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'data', 'portal.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roblox_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  is_allowed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS firefighters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roblox_id TEXT,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  station TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS disciplinary_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firefighter_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  summary TEXT NOT NULL,
  outcome TEXT,
  issued_by_user_id INTEGER,
  action_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(firefighter_id) REFERENCES firefighters(id) ON DELETE CASCADE,
  FOREIGN KEY(issued_by_user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);
function audit(actor, action, entity, entityId, details = '') {
  db.prepare('INSERT INTO audit_log(actor_user_id, action, entity, entity_id, details) VALUES(?,?,?,?,?)')
    .run(actor?.id || null, action, entity, String(entityId ?? ''), details);
}
module.exports = { db, audit };
