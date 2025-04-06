const express = require('express');
const CompanyOrder = require('../models/CompanyOrder');  // Importando o modelo de CompanyOrder
const Product = require('../models/Product');  // Importando o modelo de Product
const Staff = require('../models/Staff');  // Importando o modelo de Staff
const User = require('../models/User');  // Importando o modelo de User
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// Middleware de validação do tipo "empresa"
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// GET - listar pedidos da empresa
router.get('/', autenticarToken, validarEmpresa, async (req, res) => {
  try {
    const companyOrders = await CompanyOrder.find({ companyId: req.user.id }).populate('userId').populate('motoboyId').populate('items.productId');
    res.json(companyOrders);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// PATCH - atualizar status do pedido
router.patch('/:id/status', autenticarToken, validarEmpresa, async (req, res) => {
  const { status } = req.body;
  const statusValidos = ['pendente', 'aceito', 'em preparo', 'saiu para entrega', 'entregue', 'cancelado'];

  if (!statusValidos.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  try {
    const pedido = await CompanyOrder.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    pedido.status = status;

    // 🔽 Reduzir estoque se for aceito
    if (status === 'aceito') {
      for (let item of pedido.items) {
        const produto = await Product.findById(item.productId);
        if (produto && produto.estoque >= item.quantity) {
          produto.estoque -= item.quantity;
          await produto.save();
        } else {
          return res.status(400).json({ error: 'Estoque insuficiente para o produto ' + produto.name });
        }
      }
    }

    await pedido.save();
    res.json({ message: 'Status do pedido atualizado com sucesso.', pedido });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// PATCH - atribuir pedido a um motoboy
router.patch('/:id/assign', autenticarToken, validarEmpresa, async (req, res) => {
  const { motoboyId } = req.body;

  try {
    const pedido = await CompanyOrder.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const motoboy = await Staff.findById(motoboyId);

    if (!motoboy || motoboy.empresaId.toString() !== req.user.id.toString() || motoboy.cargo !== 'motoboy') {
      return res.status(404).json({ error: 'Motoboy não encontrado ou não é válido.' });
    }

    pedido.motoboyId = motoboyId;
    await pedido.save();

    res.json({ message: 'Pedido atribuído ao motoboy com sucesso.', pedido });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atribuir pedido ao motoboy' });
  }
});

// GET - listar motoboys ativos da empresa
router.get('/:id/available-motoboys', autenticarToken, validarEmpresa, async (req, res) => {
  try {
    const motoboys = await Staff.find({ empresaId: req.user.id, cargo: 'motoboy', ativo: true });
    res.json(motoboys);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar motoboys' });
  }
});

module.exports = router;
