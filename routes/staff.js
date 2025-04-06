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
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// GET - listar funcionários da empresa logada
router.get('/', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const funcionarios = (data.staff || []).filter(f => f.empresaId === req.user.id && f.ativo !== false);
  res.json(funcionarios);
});

// POST - adicionar novo funcionário
router.post('/', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const staff = data.staff || [];

  const { nome, email, telefone, cargo, placaVeiculo } = req.body;

  if (!nome || !email || !cargo) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, email e cargo.' });
  }

  const novoFuncionario = {
    id: Date.now().toString(),
    nome,
    email,
    telefone: telefone || '',
    cargo,
    placaVeiculo: cargo === 'motoboy' ? placaVeiculo || '' : '',
    empresaId: req.user.id,
    ativo: true
  };

  staff.push(novoFuncionario);
  data.staff = staff;
  writeData(data);

  res.status(201).json(novoFuncionario);
});

// PATCH - editar funcionário
router.patch('/:id', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const staff = data.staff || [];
  const index = staff.findIndex(f => f.id === req.params.id && f.empresaId === req.user.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Funcionário não encontrado.' });
  }

  const atual = staff[index];
  staff[index] = {
    ...atual,
    ...req.body,
    placaVeiculo: atual.cargo === 'motoboy' ? req.body.placaVeiculo || atual.placaVeiculo : ''
  };

  data.staff = staff;
  writeData(data);

  res.json(staff[index]);
});

// DELETE - desativar funcionário
router.delete('/:id', autenticarToken, validarEmpresa, (req, res) => {
  const data = readData();
  const staff = data.staff || [];
  const index = staff.findIndex(f => f.id === req.params.id && f.empresaId === req.user.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Funcionário não encontrado.' });
  }

  staff[index].ativo = false;
  data.staff = staff;
  writeData(data);

  res.json({ message: 'Funcionário desativado com sucesso.' });
});

module.exports = router;
