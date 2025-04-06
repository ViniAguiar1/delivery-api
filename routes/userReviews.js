const express = require('express');
const fs = require('fs');
const path = require('path');
const autenticarToken = require('../middleware/auth');

const router = express.Router();
const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Middleware para validar empresa
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Apenas empresas podem avaliar usuários.' });
  }
  next();
}

// POST /user-reviews - empresa avalia um usuário após o pedido
router.post('/', autenticarToken, validarEmpresa, (req, res) => {
  const { orderId, rating } = req.body;

  if (!orderId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Informe orderId e uma nota entre 1 e 5.' });
  }

  const data = readData();
  const pedido = (data.orders || []).find(p => p.id === orderId && p.companyId === req.user.id);

  if (!pedido) {
    return res.status(404).json({ error: 'Pedido não encontrado ou não pertence a esta empresa.' });
  }

  if (pedido.status !== 'entregue') {
    return res.status(400).json({ error: 'Só é possível avaliar usuários após entrega do pedido.' });
  }

  const user = (data.users || []).find(u => u.id === pedido.userId);
  if (!user) return res.status(404).json({ error: 'Usuário do pedido não encontrado.' });

  user.avaliacoesRecebidas = user.avaliacoesRecebidas || [];
  user.avaliacoesRecebidas.push(rating);

  // Calcular nova média
  const soma = user.avaliacoesRecebidas.reduce((acc, nota) => acc + nota, 0);
  const media = soma / user.avaliacoesRecebidas.length;
  user.mediaAvaliacoes = parseFloat(media.toFixed(2));

  writeData(data);
  res.status(201).json({
    message: 'Avaliação registrada.',
    usuario: {
      id: user.id,
      nome: user.nome,
      mediaAvaliacoes: user.mediaAvaliacoes,
      totalAvaliacoes: user.avaliacoesRecebidas.length
    }
  });
});

module.exports = router;
