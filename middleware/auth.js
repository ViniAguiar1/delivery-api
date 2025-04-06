const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config(); // Carrega as variáveis do .env

const SECRET_KEY = 'sua-chave-secreta-super-segura'; 

function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if(!authHeader) return res.status(401).json({ error: 'Token não enviado - OLHA EU AQUI' });


  const partes = authHeader.split('.'); // Bearer token
  console.log('ÄQUI EU AQUI');
  console.log(partes);
  if(partes.length != 2) return res.status(401).json({ error: 'Token não enviado - ARTUR ' });

  const [schema, token] = partes;

  if (!/ˆBearer$/i.test(schema)) {
    return res.status(401).json({ error: 'Token não enviado' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });

    req.user = user; // O usuário que foi decodificado do JWT é anexado à requisição
    next(); // Passa para o próximo middleware ou rota
  });

  // if (!token) return res.status(401).json({ error: 'Token não enviado' });

  // jwt.verify(token, SECRET_KEY, (err, user) => {
  //   if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });

  //   req.user = user; // O usuário que foi decodificado do JWT é anexado à requisição
  //   next(); // Passa para o próximo middleware ou rota
  // });
}

module.exports = autenticarToken;