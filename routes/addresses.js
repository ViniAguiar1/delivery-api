const express = require('express');
const router = express.Router();
const Address = require('../models/Address');
const autenticarToken = require('../middleware/auth');

// GET - Listar endereços do usuário logado
router.get('/', autenticarToken, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id });
    res.json(addresses);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar endereços.' });
  }
});

// POST - Criar novo endereço
router.post('/', autenticarToken, async (req, res) => {
  try {
    const {
      apelido,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      cep,
      complemento,
      isDefault
    } = req.body;

    if (!apelido || !rua || !numero || !bairro || !cidade || !estado || !cep) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
    }

    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id },
        { isDefault: false }
      );
    }

    const novoEndereco = new Address({
      userId: req.user.id,
      apelido,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      cep,
      complemento,
      isDefault: isDefault || false
    });

    await novoEndereco.save();
    res.status(201).json(novoEndereco);
  } catch {
    res.status(500).json({ error: 'Erro ao salvar endereço.' });
  }
});

// PATCH - Atualizar endereço
router.patch('/:id', autenticarToken, async (req, res) => {
  try {
    const { isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id },
        { isDefault: false }
      );
    }

    const atualizado = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!atualizado) {
      return res.status(404).json({ error: 'Endereço não encontrado.' });
    }

    res.json(atualizado);
  } catch {
    res.status(400).json({ error: 'Erro ao atualizar endereço.' });
  }
});

// DELETE - Remover endereço
router.delete('/:id', autenticarToken, async (req, res) => {
  try {
    const removido = await Address.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!removido) {
      return res.status(404).json({ error: 'Endereço não encontrado.' });
    }

    res.json({ message: 'Endereço removido com sucesso.' });
  } catch {
    res.status(400).json({ error: 'Erro ao remover endereço.' });
  }
});

module.exports = router;
