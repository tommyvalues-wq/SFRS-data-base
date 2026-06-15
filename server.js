require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const path = require('path');
const { db, audit } = require('./db');
const { authUrl, callback } = require('./auth');
const { attachUser, requireLogin, requirePST, requireOwner } = require('./middleware');
const app = express();
app.set('view engine', 'ejs'); app.set('views', path.join(__dirname, 'views'));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public')));
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: path.join(__dirname, 'data')
  }),
  secret: process.env.SESSION_SECRET || 'dev-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));secret: process.env.SESSION_SECRET || 'dev-only-change-me', resave:false, saveUninitialized:false, cookie:{ httpOnly:true, sameSite:'lax', secure: process.env.NODE_ENV==='production' }}));
app.use(attachUser);
const roles = { owner: 'Owner', pst: 'Professional Standards', member: 'Member' };
app.locals.roles = roles;
app.get('/', (req,res)=>res.render('home',{title:'Staff Portal'}));
app.get('/login', (req,res)=>res.render('login',{title:'Sign in'}));
app.get('/auth/roblox', async (req,res,next)=>{ try{ res.redirect(await authUrl(req)); }catch(e){ next(e); }});
app.get('/auth/roblox/callback', async (req,res,next)=>{ try{
  const profile = await callback(req);
  const robloxId = String(profile.sub);
  const existing = db.prepare('SELECT * FROM users WHERE roblox_id=?').get(robloxId);
  if (existing) {
    db.prepare('UPDATE users SET username=?, display_name=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(profile.preferred_username || profile.name || robloxId, profile.name || '', existing.id);
    req.session.userId = existing.id;
  } else {
    const owner = process.env.INITIAL_OWNER_ROBLOX_ID && robloxId === String(process.env.INITIAL_OWNER_ROBLOX_ID);
    const info = db.prepare('INSERT INTO users(roblox_id, username, display_name, role, is_allowed) VALUES(?,?,?,?,?)').run(robloxId, profile.preferred_username || profile.name || robloxId, profile.name || '', owner ? 'owner' : 'member', owner ? 1 : 0);
    req.session.userId = info.lastInsertRowid;
  }
  res.redirect('/dashboard');
}catch(e){ next(e); }});
app.post('/logout',(req,res)=>req.session.destroy(()=>res.redirect('/')));
app.get('/dashboard', requireLogin, (req,res)=>{
  const stats = { firefighters: db.prepare('SELECT COUNT(*) c FROM firefighters').get().c, cases: db.prepare('SELECT COUNT(*) c FROM disciplinary_actions').get().c, pst: db.prepare("SELECT COUNT(*) c FROM users WHERE role IN ('owner','pst')").get().c };
  const recent = db.prepare('SELECT a.*, u.username FROM audit_log a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.id DESC LIMIT 8').all();
  res.render('dashboard',{title:'Dashboard', stats, recent});
});
app.get('/firefighters', requireLogin, (req,res)=>res.render('firefighters',{title:'Firefighters', firefighters: db.prepare('SELECT * FROM firefighters ORDER BY name').all()}));
app.get('/firefighters/new', requirePST, (req,res)=>res.render('firefighter-form',{title:'Add firefighter', f:{}}));
app.post('/firefighters', requirePST, (req,res)=>{ const r=req.body; const info=db.prepare('INSERT INTO firefighters(roblox_id,name,rank,station,status,notes) VALUES(?,?,?,?,?,?)').run(r.roblox_id,r.name,r.rank,r.station,r.status,r.notes); audit(req.user,'created','firefighter',info.lastInsertRowid,r.name); res.redirect('/firefighters'); });
app.get('/firefighters/:id/edit', requirePST, (req,res)=>res.render('firefighter-form',{title:'Edit firefighter', f: db.prepare('SELECT * FROM firefighters WHERE id=?').get(req.params.id)}));
app.post('/firefighters/:id', requirePST, (req,res)=>{ const r=req.body; db.prepare('UPDATE firefighters SET roblox_id=?, name=?, rank=?, station=?, status=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(r.roblox_id,r.name,r.rank,r.station,r.status,r.notes,req.params.id); audit(req.user,'updated','firefighter',req.params.id,r.name); res.redirect('/firefighters'); });
app.post('/firefighters/:id/delete', requirePST, (req,res)=>{ db.prepare('DELETE FROM firefighters WHERE id=?').run(req.params.id); audit(req.user,'deleted','firefighter',req.params.id); res.redirect('/firefighters'); });
app.get('/discipline', requirePST, (req,res)=>{ const cases=db.prepare('SELECT d.*, f.name firefighter, u.username issuer FROM disciplinary_actions d JOIN firefighters f ON f.id=d.firefighter_id LEFT JOIN users u ON u.id=d.issued_by_user_id ORDER BY d.action_date DESC').all(); res.render('discipline',{title:'Disciplinary actions', cases}); });
app.get('/discipline/new', requirePST, (req,res)=>res.render('discipline-form',{title:'Add disciplinary action', c:{}, firefighters: db.prepare('SELECT * FROM firefighters ORDER BY name').all()}));
app.post('/discipline', requirePST, (req,res)=>{ const r=req.body; const info=db.prepare('INSERT INTO disciplinary_actions(firefighter_id,type,severity,summary,outcome,issued_by_user_id,action_date) VALUES(?,?,?,?,?,?,?)').run(r.firefighter_id,r.type,r.severity,r.summary,r.outcome,req.user.id,r.action_date); audit(req.user,'created','disciplinary_action',info.lastInsertRowid,r.summary); res.redirect('/discipline'); });
app.get('/discipline/:id/edit', requirePST, (req,res)=>res.render('discipline-form',{title:'Edit disciplinary action', c: db.prepare('SELECT * FROM disciplinary_actions WHERE id=?').get(req.params.id), firefighters: db.prepare('SELECT * FROM firefighters ORDER BY name').all()}));
app.post('/discipline/:id', requirePST, (req,res)=>{ const r=req.body; db.prepare('UPDATE disciplinary_actions SET firefighter_id=?, type=?, severity=?, summary=?, outcome=?, action_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(r.firefighter_id,r.type,r.severity,r.summary,r.outcome,r.action_date,req.params.id); audit(req.user,'updated','disciplinary_action',req.params.id,r.summary); res.redirect('/discipline'); });
app.post('/discipline/:id/delete', requirePST, (req,res)=>{ db.prepare('DELETE FROM disciplinary_actions WHERE id=?').run(req.params.id); audit(req.user,'deleted','disciplinary_action',req.params.id); res.redirect('/discipline'); });
app.get('/admin/users', requireOwner, (req,res)=>res.render('users',{title:'User management', users: db.prepare('SELECT * FROM users ORDER BY role, username').all()}));
app.post('/admin/users/add', requireOwner, (req,res)=>{ const {roblox_id,username,role}=req.body; db.prepare('INSERT INTO users(roblox_id, username, role, is_allowed) VALUES(?,?,?,1) ON CONFLICT(roblox_id) DO UPDATE SET username=excluded.username, role=excluded.role, is_allowed=1, updated_at=CURRENT_TIMESTAMP').run(roblox_id, username || roblox_id, role); audit(req.user,'upserted','user',roblox_id,role); res.redirect('/admin/users'); });
app.post('/admin/users/:id/role', requireOwner, (req,res)=>{ db.prepare('UPDATE users SET role=?, is_allowed=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.role, req.body.is_allowed?1:0, req.params.id); audit(req.user,'updated role','user',req.params.id,req.body.role); res.redirect('/admin/users'); });
app.get('/audit', requirePST, (req,res)=>res.render('audit',{title:'Audit log', rows: db.prepare('SELECT a.*, u.username FROM audit_log a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.id DESC LIMIT 200').all()}));
app.use((err,req,res,next)=>{ console.error(err); res.status(500).render('error',{title:'Error', error: err}); });
app.listen(process.env.PORT || 3000,()=>console.log(`Portal running on ${process.env.BASE_URL || 'http://localhost:3000'}`));
