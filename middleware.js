const { db } = require('./db');
function attachUser(req,res,next){ req.user = null; if(req.session?.userId) req.user = db.prepare('SELECT * FROM users WHERE id=?').get(req.session.userId) || null; res.locals.user=req.user; next(); }
function requireLogin(req,res,next){ if(!req.user) return res.redirect('/login'); if(!req.user.is_allowed) return res.status(403).render('denied',{title:'Access denied'}); next(); }
function requirePST(req,res,next){ if(!req.user) return res.redirect('/login'); if(!req.user.is_allowed || !['owner','pst'].includes(req.user.role)) return res.status(403).render('denied',{title:'Access denied'}); next(); }
function requireOwner(req,res,next){ if(!req.user) return res.redirect('/login'); if(!req.user.is_allowed || req.user.role !== 'owner') return res.status(403).render('denied',{title:'Access denied'}); next(); }
module.exports={attachUser,requireLogin,requirePST,requireOwner};
