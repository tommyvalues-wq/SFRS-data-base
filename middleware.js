const { db } = require('./db');
function attachUser(req, res, next) {
  res.locals.user = null;
  if (req.session.userId) {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.session.userId);
    if (user) res.locals.user = req.user = user;
  }
  next();
}
function requireLogin(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (!req.user.is_allowed) return res.status(403).render('denied', { title: 'Access pending' });
  next();
}
function requirePST(req, res, next) {
  if (!req.user || !req.user.is_allowed) return res.redirect('/login');
  if (!['owner','pst'].includes(req.user.role)) return res.status(403).render('denied', { title: 'Professional Standards only' });
  next();
}
function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') return res.status(403).render('denied', { title: 'Owner only' });
  next();
}
module.exports = { attachUser, requireLogin, requirePST, requireOwner };
