const jwt = require('jsonwebtoken');
const SECRET_KEY = 'sua-chave-secreta-super-segura';

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) return res.status(401).json({ error: 'Token não enviado' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });

    req.user = user;
    next();
  });
}

module.exports = autenticarToken;
