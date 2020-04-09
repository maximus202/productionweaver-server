/* eslint-disable prefer-const */
/* eslint-disable consistent-return */
const AuthService = require('../auth/auth-service');

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || '';

  let basicToken;
  if (!authToken.toLowerCase().startsWith('basic')) {
    return res.status(401).json({ error: { message: 'missing basic token' } });
  }
  basicToken = authToken.slice('basic '.length, authToken.length);


  const [tokenEmail, tokenPassword] = Buffer
    .from(basicToken, 'base64')
    .toString()
    .split(':');

  if (!tokenEmail || !tokenPassword) {
    return res.status(401).json({ error: { message: 'unauthorized request' } });
  }

  req.app.get('db')('productionweaver_users')
    .where({ email: tokenEmail })
    .first()
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: { message: 'unauthorized request' } });
      }

      return AuthService.comparePasswords(tokenPassword, user.password)
        .then((passwordsMatch) => {
          if (!passwordsMatch) {
            return res.status(401).json({ error: { message: 'unauthorized request' } });
          }
          req.user = user;
          next();
        });
    })
    .catch(next);
}

module.exports = {
  requireAuth,
};
