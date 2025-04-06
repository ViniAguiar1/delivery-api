const express = require('express');
const autenticarToken = require('../middleware/auth');
const PaymentMethod = require('../models/PaymentMethod'); // Importando o modelo de PaymentMethod
const router = express.Router();

// GET - listar cartões do usuário
router.get('/', autenticarToken, async (req, res) => {
  try {
    const cards = await PaymentMethod.find({ userId: req.user.id });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar cartões', details: error.message });
  }
});

// POST - cadastrar novo cartão
router.post('/', autenticarToken, async (req, res) => {
  const { nomeTitular, numeroCartao, validade, cvv, tipo } = req.body;

  if (!nomeTitular || !numeroCartao || !validade || !cvv || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const tiposPermitidos = ['crédito', 'débito'];
  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de cartão inválido. Use "crédito" ou "débito".' });
  }

  const ultimos4 = numeroCartao.slice(-4);

  const newPaymentMethod = new PaymentMethod({
    userId: req.user.id,
    nomeTitular,
    numeroCartao: `**** **** **** ${ultimos4}`,
    validade,
    cvv: "***", // CVV não é retornado por questões de segurança
    tipo
  });

  try {
    await newPaymentMethod.save();
    res.status(201).json(newPaymentMethod);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar cartão', details: error.message });
  }
});

// PATCH - atualizar cartão
router.patch('/:id', autenticarToken, async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findOne({ _id: req.params.id, userId: req.user.id });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Cartão não encontrado.' });
    }

    // Atualizando o número de cartão e ocultando os primeiros números
    if (req.body.numeroCartao) {
      req.body.numeroCartao = `**** **** **** ${req.body.numeroCartao.slice(-4)}`;
    }

    Object.assign(paymentMethod, req.body);
    await paymentMethod.save();

    res.json(paymentMethod);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cartão', details: error.message });
  }
});

// DELETE - excluir cartão
router.delete('/:id', autenticarToken, async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Cartão não encontrado.' });
    }

    res.json({ message: 'Cartão removido com sucesso.', cartao: paymentMethod });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir cartão', details: error.message });
  }
});

module.exports = router;
