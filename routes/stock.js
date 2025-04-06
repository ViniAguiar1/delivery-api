const express = require('express');
const Product = require('../models/Product'); // Importando a model Product
const autenticarToken = require('../middleware/auth');
const Company = require('../models/Company'); // Para validar a empresa
const router = express.Router();

// Middleware para validar empresa
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// GET /stock - listar produtos com estoque da empresa logada
router.get('/', autenticarToken, validarEmpresa, async (req, res) => {
  try {
    // Buscar produtos da empresa logada
    const produtos = await Product.find({ companyId: req.user.id });

    const estoque = produtos.map(p => ({
      id: p._id,
      nome: p.name,
      estoque: p.estoque // Usando diretamente o campo estoque da model
    }));

    res.json(estoque);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar estoque', details: error.message });
  }
});

// PATCH /stock/:productId - atualizar estoque de um produto da empresa
router.patch('/:productId', autenticarToken, validarEmpresa, async (req, res) => {
  const { productId } = req.params;
  const { estoque } = req.body;

  if (typeof estoque !== 'number' || estoque < 0) {
    return res.status(400).json({ error: 'Estoque deve ser um número igual ou maior que 0.' });
  }

  try {
    // Verificar se o produto existe para a empresa logada
    const produto = await Product.findOne({ _id: productId, companyId: req.user.id });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado para esta empresa.' });
    }

    produto.estoque = estoque;

    // Atualizar o estoque
    await produto.save();

    res.json({ message: 'Estoque atualizado com sucesso.', produto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar estoque', details: error.message });
  }
});

// DELETE /stock/:productId - remover produto da empresa logada
router.delete('/:productId', autenticarToken, validarEmpresa, async (req, res) => {
  const { productId } = req.params;

  try {
    // Verificar se o produto existe para a empresa logada
    const produto = await Product.findOne({ _id: productId, companyId: req.user.id });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado para esta empresa.' });
    }

    // Remover o produto
    await produto.remove();

    res.json({ message: 'Produto removido do estoque com sucesso.', produto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover produto', details: error.message });
  }
});

module.exports = router;
