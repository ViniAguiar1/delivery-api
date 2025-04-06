const express = require('express');
const Category = require('../models/Category');  // Importando o modelo Category
const router = express.Router();

// GET /api/categories - Listar todas as categorias
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar categorias', details: error.message });
  }
});

// GET /api/categories/:id - Buscar por ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categoria', details: error.message });
  }
});

// POST /api/categories - Criar nova categoria
router.post('/', async (req, res) => {
  const { nome, imagem } = req.body;

  if (!nome || !imagem) {
    return res.status(400).json({ error: 'Nome e imagem são obrigatórios.' });
  }

  const newCategory = new Category({
    nome,
    imagem
  });

  try {
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar categoria', details: error.message });
  }
});

// PATCH /api/categories/:id - Editar categoria
router.patch('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar categoria', details: error.message });
  }
});

// DELETE /api/categories/:id - Remover categoria
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    res.json({ message: 'Categoria removida com sucesso.', categoria: category });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover categoria', details: error.message });
  }
});

module.exports = router;
