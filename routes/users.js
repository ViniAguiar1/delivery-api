const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const router = express.Router();

const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  const raw = fs.readFileSync(dataPath);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function gerarCodigoConvite(nome) {
  return nome.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 10000);
}

// GET all users
router.get('/', (req, res) => {
  const data = readData();
  res.json(data.users || []);
});

// GET user by ID
router.get('/:id', (req, res) => {
  const data = readData();
  const user = (data.users || []).find(u => u.id == req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

// POST create user
router.post('/', async (req, res) => {
  const data = readData();
  const users = data.users || [];

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
    return res.status(400).json({ error: 'Tipo de usuário inválido. Use cliente, empresa ou desenvolvimento.' });
  }

  const existente = users.find(u => u.email === email);
  if (existente) {
    return res.status(409).json({ error: 'Email já cadastrado.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const codigoConvite = gerarCodigoConvite(nome);

  const newUser = {
    id: Date.now(),
    nome,
    email,
    senha: senhaHash,
    endereco,
    documento,
    celular,
    tipo,
    codigoConvite
  };

  users.push(newUser);
  data.users = users;

  // Aplicar recompensa se foi indicado por outro usuário
  if (codigoIndicadoPor) {
    const indicadoPor = users.find(u => u.codigoConvite === codigoIndicadoPor);

    if (indicadoPor) {
      const cupomParaIndicado = {
        id: Date.now().toString() + 'A',
        userId: newUser.id,
        code: "INDICOU10",
        discount: "10%",
        description: "Desconto por ter sido indicado por um amigo",
        validUntil: "2025-12-31",
        minValue: 30,
        isActive: true,
        price: 0,
        usesLeft: 1,
        maxUses: 1,
        purchased: false
      };

      const cupomParaQuemIndicou = {
        ...cupomParaIndicado,
        id: Date.now().toString() + 'B',
        userId: indicadoPor.id,
        description: "Desconto por indicar um amigo"
      };

      data.userCoupons = data.userCoupons || [];
      data.userCoupons.push(cupomParaIndicado, cupomParaQuemIndicou);
    }
  }

  writeData(data);

  res.status(201).json({
    id: newUser.id,
    nome,
    email,
    tipo,
    codigoConvite: newUser.codigoConvite
  });
});

// PATCH update user
router.patch('/:id', (req, res) => {
  const data = readData();
  let users = data.users || [];

  const index = users.findIndex(u => u.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

  users[index] = { ...users[index], ...req.body };
  data.users = users;
  writeData(data);

  res.json(users[index]);
});

// DELETE user
router.delete('/:id', (req, res) => {
  const data = readData();
  let users = data.users || [];

  const index = users.findIndex(u => u.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

  const removed = users.splice(index, 1);
  data.users = users;
  writeData(data);

  res.json({ message: 'Usuário removido com sucesso.', user: removed[0] });
});

module.exports = router;
