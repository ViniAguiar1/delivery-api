const express = require('express');
const fs = require('fs');
const path = require('path');
const autenticarToken = require('../middleware/auth');

const router = express.Router();
const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  const raw = fs.readFileSync(dataPath);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// GET - listar endereços do usuário
router.get('/', autenticarToken, (req, res) => {
  const data = readData();
  const addresses = (data.addresses || []).filter(a => a.userId === req.user.id);
  res.json(addresses);
});

// POST - adicionar novo endereço
router.post('/', autenticarToken, (req, res) => {
  const data = readData();
  const addresses = data.addresses || [];

  const { apelido, rua, numero, bairro, cidade, estado, cep, complemento, isDefault } = req.body;

  if (!apelido || !rua || !numero || !bairro || !cidade || !estado || !cep) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
  }

  // Se for marcado como default, remove default de outros
  if (isDefault) {
    data.addresses = addresses.map(a =>
      a.userId === req.user.id ? { ...a, isDefault: false } : a
    );
  }

  const newAddress = {
    id: Date.now().toString(),
    userId: req.user.id,
    apelido,
    rua,
    numero,
    bairro,
    cidade,
    estado,
    cep,
    complemento: complemento || '',
    isDefault: isDefault || false
  };

  data.addresses.push(newAddress);
  writeData(data);

  res.status(201).json(newAddress);
});

// PATCH - atualizar endereço
router.patch('/:id', autenticarToken, (req, res) => {
  const data = readData();
  const addresses = data.addresses || [];

  const index = addresses.findIndex(a => a.id === req.params.id && a.userId === req.user.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Endereço não encontrado.' });
  }

  // Se isDefault for enviado como true, remove default de outros
  if (req.body.isDefault === true) {
    data.addresses = addresses.map(a =>
      a.userId === req.user.id ? { ...a, isDefault: false } : a
    );
  }

  data.addresses[index] = { ...data.addresses[index], ...req.body };
  writeData(data);

  res.json(data.addresses[index]);
});

// DELETE - remover endereço
router.delete('/:id', autenticarToken, (req, res) => {
  const data = readData();
  const addresses = data.addresses || [];

  const index = addresses.findIndex(a => a.id === req.params.id && a.userId === req.user.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Endereço não encontrado.' });
  }

  const removed = addresses.splice(index, 1);
  data.addresses = addresses;
  writeData(data);

  res.json({ message: 'Endereço removido com sucesso.', endereco: removed[0] });
});

module.exports = router;
