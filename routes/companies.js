const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  const raw = fs.readFileSync(dataPath);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function categoriasValidas(inputCategories, existingCategories) {
  return inputCategories.every(cat => existingCategories.includes(cat));
}

// GET todas as empresas
router.get('/', (req, res) => {
  const data = readData();
  res.json(data.companies || []);
});

// GET empresa por ID
router.get('/:id', (req, res) => {
  const data = readData();
  const company = (data.companies || []).find(c => c.id == req.params.id);

  if (!company) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  res.json(company);
});

// POST nova empresa
// POST - criar nova empresa
router.post('/', (req, res) => {
  const data = readData();
  const companies = data.companies || [];

  const {
    name,
    image,
    rating,
    deliveryFee,
    deliveryTime,
    categories,
    dishes
  } = req.body;

  if (!name || !image || !rating || !deliveryFee || !deliveryTime || !categories) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando' });
  }

  const newCompany = {
    id: Date.now(),
    name,
    image,
    rating,
    deliveryFee,
    deliveryTime,
    categories,
    dishes: dishes || [],
    blockedUsers: []
  };

  companies.push(newCompany);
  data.companies = companies;
  writeData(data);

  res.status(201).json(newCompany);
});

// PATCH atualizar empresa
router.patch('/:id', (req, res) => {
  const data = readData();
  const companies = data.companies || [];
  const categoriasSistema = (data.categories || []).map(cat => cat.nome);

  const index = companies.findIndex(c => c.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  // Se estiver atualizando categorias, validar
  if (req.body.categories && !categoriasValidas(req.body.categories, categoriasSistema)) {
    return res.status(400).json({ error: 'Uma ou mais categorias não existem no sistema.' });
  }

  companies[index] = { ...companies[index], ...req.body };
  data.companies = companies;
  writeData(data);

  res.json(companies[index]);
});

// DELETE empresa
router.delete('/:id', (req, res) => {
  const data = readData();
  let companies = data.companies || [];

  const index = companies.findIndex(c => c.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  const removed = companies.splice(index, 1);
  data.companies = companies;
  writeData(data);

  res.json({ message: 'Empresa removida com sucesso.', empresa: removed[0] });
});

module.exports = router;
