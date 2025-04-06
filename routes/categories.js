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

// GET /api/categories - Listar todas as categorias
router.get('/', (req, res) => {
  const data = readData();
  res.json(data.categories || []);
});

// GET /api/categories/:id - Buscar por ID
router.get('/:id', (req, res) => {
  const data = readData();
  const category = (data.categories || []).find(c => c.id == req.params.id);

  if (!category) {
    return res.status(404).json({ error: 'Categoria não encontrada.' });
  }

  res.json(category);
});

// POST /api/categories - Criar nova categoria
router.post('/', (req, res) => {
  const data = readData();
  const categories = data.categories || [];

  const { nome, imagem } = req.body;

  if (!nome || !imagem) {
    return res.status(400).json({ error: 'Nome e imagem são obrigatórios.' });
  }

  const newCategory = {
    id: Date.now(),
    nome,
    imagem
  };

  categories.push(newCategory);
  data.categories = categories;
  writeData(data);

  res.status(201).json(newCategory);
});

// PATCH /api/categories/:id - Editar categoria
router.patch('/:id', (req, res) => {
  const data = readData();
  let categories = data.categories || [];

  const index = categories.findIndex(c => c.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Categoria não encontrada.' });

  categories[index] = { ...categories[index], ...req.body };
  data.categories = categories;
  writeData(data);

  res.json(categories[index]);
});

// DELETE /api/categories/:id - Remover categoria
router.delete('/:id', (req, res) => {
  const data = readData();
  let categories = data.categories || [];

  const index = categories.findIndex(c => c.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Categoria não encontrada.' });

  const removed = categories.splice(index, 1);
  data.categories = categories;
  writeData(data);

  res.json({ message: 'Categoria removida com sucesso.', categoria: removed[0] });
});

module.exports = router;
