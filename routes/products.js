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

// GET produtos de uma empresa
router.get('/company/:companyId', (req, res) => {
  const data = readData();
  const companyId = parseInt(req.params.companyId);
  const products = (data.products || []).filter(p => p.companyId === companyId);
  res.json(products);
});

// GET produto por ID
router.get('/:id', (req, res) => {
  const data = readData();
  const product = (data.products || []).find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(product);
});

// POST produto vinculado a uma empresa
router.post('/company/:companyId', (req, res) => {
  const data = readData();
  const companyId = parseInt(req.params.companyId);
  const company = (data.companies || []).find(c => c.id === companyId);
  const products = data.products || [];

  if (!company) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  const { name, price, description, image, accompaniments, suggestedAddOns } = req.body;

  if (!name || !price || !description || !image) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, price, description, image' });
  }

  const newProduct = {
    id: Date.now(),
    companyId,
    name,
    price,
    description,
    image,
    accompaniments: accompaniments || { free: [], paid: [] },
    suggestedAddOns: suggestedAddOns || []
  };

  products.push(newProduct);
  data.products = products;
  writeData(data);

  res.status(201).json(newProduct);
});

// PATCH atualizar produto
router.patch('/:id', (req, res) => {
  const data = readData();
  const products = data.products || [];

  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Produto não encontrado' });

  products[index] = { ...products[index], ...req.body };
  data.products = products;
  writeData(data);

  res.json(products[index]);
});

// DELETE remover produto
router.delete('/:id', (req, res) => {
  const data = readData();
  let products = data.products || [];

  const index = products.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Produto não encontrado' });

  const removed = products.splice(index, 1);
  data.products = products;
  writeData(data);

  res.json({ message: 'Produto removido com sucesso.', produto: removed[0] });
});

module.exports = router;
