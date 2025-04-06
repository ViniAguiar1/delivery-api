const express = require('express');
const User = require('../models/User');  // Model de User
const Order = require('../models/Order');  // Model de Order
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// Middleware para validar se é uma empresa
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Apenas empresas podem avaliar usuários.' });
  }
  next();
}

// POST /user-reviews - empresa avalia um usuário após o pedido
router.post('/', autenticarToken, validarEmpresa, async (req, res) => {
  const { orderId, rating } = req.body;

  if (!orderId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Informe orderId e uma nota entre 1 e 5.' });
  }

  try {
    // Encontrar o pedido da empresa e do usuário
    const pedido = await Order.findOne({ _id: orderId, companyId: req.user.id });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado ou não pertence a esta empresa.' });
    }

    if (pedido.status !== 'entregue') {
      return res.status(400).json({ error: 'Só é possível avaliar usuários após entrega do pedido.' });
    }

    // Encontrar o usuário do pedido
    const user = await User.findById(pedido.userId);
    if (!user) return res.status(404).json({ error: 'Usuário do pedido não encontrado.' });

    // Adicionar avaliação recebida do usuário
    user.avaliacoesRecebidas = user.avaliacoesRecebidas || [];
    user.avaliacoesRecebidas.push(rating);

    // Calcular a nova média
    const soma = user.avaliacoesRecebidas.reduce((acc, nota) => acc + nota, 0);
    const media = soma / user.avaliacoesRecebidas.length;
    user.mediaAvaliacoes = parseFloat(media.toFixed(2));

    // Salvar as alterações no usuário
    await user.save();

    res.status(201).json({
      message: 'Avaliação registrada.',
      usuario: {
        id: user.id,
        nome: user.nome,
        mediaAvaliacoes: user.mediaAvaliacoes,
        totalAvaliacoes: user.avaliacoesRecebidas.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar avaliação.' });
  }
});

module.exports = router;
