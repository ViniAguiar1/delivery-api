const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User'); // Modelo do usuário
const UserCoupon = require('../models/UserCoupon'); // Modelo de cupons do usuário (se já existir ou criaremos depois)

const SECRET_KEY = process.env.SECRET_KEY; // Usando variável de ambiente para a chave secreta

// Gera código de convite com base no nome
function gerarCodigoConvite(nome) {
  return nome.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 10000);
}

// GET - listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// GET - buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'ID inválido' });
  }
});

// POST - criar novo usuário
router.post('/', async (req, res) => {
  const {
    nome,
    email,
    senha,
    endereco,
    documento,
    celular,
    tipo,
    codigoIndicadoPor
  } = req.body;

  if (!nome || !email || !senha || !endereco || !documento || !celular || !tipo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const tiposPermitidos = ['cliente', 'empresa', 'desenvolvimento'];
  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de usuário inválido.' });
  }

  try {
    console.log('Tentando criar usuário com email:', email); // Log para depuração

    const existente = await User.findOne({ email });
    if (existente) {
      console.log('Email já cadastrado:', email); // Log para depuração
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const codigoConvite = gerarCodigoConvite(nome);

    const newUser = new User({
      nome,
      email,
      senha: senhaHash,
      endereco,
      documento,
      celular,
      tipo,
      codigoConvite
    });

    await newUser.save();
    console.log('Usuário criado com sucesso:', newUser); // Log para verificar o usuário criado

    // Se foi indicado por alguém, aplicar recompensa (cupom)
    if (codigoIndicadoPor) {
      const indicadoPor = await User.findOne({ codigoConvite: codigoIndicadoPor });

      if (indicadoPor) {
        const cupomIndicado = new UserCoupon({
          userId: newUser._id,
          code: 'INDICOU10',
          discount: '10%',
          description: 'Desconto por ter sido indicado por um amigo',
          validUntil: '2025-12-31',
          minValue: 30,
          isActive: true,
          price: 0,
          usesLeft: 1,
          maxUses: 1,
          purchased: false
        });

        const cupomQuemIndicou = new UserCoupon({
          ...cupomIndicado.toObject(),
          userId: indicadoPor._id,
          description: 'Desconto por indicar um amigo'
        });

        await cupomIndicado.save();
        await cupomQuemIndicou.save();
      }
    }

    const token = jwt.sign(
      { id: newUser._id, tipo: newUser.tipo, email: newUser.email },
      SECRET_KEY,
      { expiresIn: '2h' }
    );

    res.status(201).json({
      id: newUser._id,
      nome: newUser.nome,
      email: newUser.email,
      tipo: newUser.tipo,
      codigoConvite: newUser.codigoConvite,
      token // Retorna o token gerado
    });
  } catch (err) {
    console.error('Erro ao criar o usuário:', err.message); // Log para depuração
    res.status(500).json({ error: 'Erro ao criar o usuário.' });
  }
});

// PATCH - atualizar usuário
router.patch('/:id', async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao atualizar usuário' });
  }
});

// DELETE - remover usuário
router.delete('/:id', async (req, res) => {
  try {
    const removed = await User.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ message: 'Usuário removido com sucesso.', user: removed });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao deletar usuário' });
  }
});

module.exports = router;
