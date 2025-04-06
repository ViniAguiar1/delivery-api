const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');  // Importando o modelo de Product
const Company = require('../models/Company');  // Importando o modelo de Company
const router = express.Router();

// GET produtos de uma empresa
router.get('/company/:companyId', async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const products = await Product.find({ companyId });  // Buscando produtos pela empresa
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// GET produto por ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);  // Buscando produto por ID
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// POST produto vinculado a uma empresa
router.post('/company/:companyId', async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findById(companyId);  // Buscando a empresa pelo ID

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    const { name, price, description, image, stock, categoryId } = req.body;

    if (!name || !price || !description || !image || !stock || !categoryId) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Criando um novo produto com os dados fornecidos
    const newProduct = new Product({
      companyId,
      name,
      price,
      description,
      image,
      stock,
      categoryId
    });

    await newProduct.save();  // Salvando o produto no banco de dados

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// PATCH atualizar produto
router.patch('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);  // Buscando o produto pelo ID
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Atualizando o produto com os dados recebidos
    Object.assign(product, req.body);
    await product.save();  // Salvando as alterações no banco de dados

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// DELETE remover produto
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);  // Removendo produto pelo ID
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto removido com sucesso.', produto: product });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

module.exports = router;
