const express = require('express');
const Company = require('../models/Company'); // Importando o modelo Company
const router = express.Router();

// Middleware para validar empresa
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// GET todas as empresas
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar empresas' });
  }
});

// GET empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

// POST - Criar nova empresa
router.post('/', async (req, res) => {
  const { name, image, rating, deliveryFee, deliveryTime, categories, dishes } = req.body;

  if (!name || !image || !rating || !deliveryFee || !deliveryTime || !categories) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando' });
  }

  try {
    const newCompany = new Company({
      name,
      image,
      rating,
      deliveryFee,
      deliveryTime,
      categories,
      dishes: dishes || [],
      blockedRegions: [] // Inicializamos o campo de regiões bloqueadas como um array vazio
    });

    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar a empresa' });
  }
});

// PATCH - Atualizar empresa
router.patch('/:id', async (req, res) => {
  const { categories } = req.body;
  const categoriasSistema = (await Company.distinct('categories')) || [];

  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    // Se estiver atualizando categorias, validar
    if (categories && !categoriasValidas(categories, categoriasSistema)) {
      return res.status(400).json({ error: 'Uma ou mais categorias não existem no sistema.' });
    }

    Object.assign(company, req.body); // Atualiza a empresa com os dados do corpo da requisição
    await company.save();
    
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar a empresa' });
  }
});

// DELETE - Remover empresa
router.delete('/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    res.json({ message: 'Empresa removida com sucesso.', empresa: company });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover a empresa' });
  }
});

// PATCH - Adicionar região bloqueada
router.patch('/:id/block-region', validarEmpresa, async (req, res) => {
  const { postalCode } = req.body; // Códigos postais que a empresa quer bloquear

  if (!postalCode) return res.status(400).json({ error: 'PostalCode é obrigatório.' });

  try {
    const company = await Company.findById(req.params.id);

    if (!company) return res.status(404).json({ error: 'Empresa não encontrada.' });

    if (company.blockedRegions.includes(postalCode)) {
      return res.status(409).json({ error: 'Região já está bloqueada.' });
    }

    company.blockedRegions.push(postalCode);
    await company.save();

    res.json({ message: 'Região bloqueada com sucesso.', blockedRegions: company.blockedRegions });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao bloquear a região' });
  }
});

// PATCH - Remover região bloqueada
router.patch('/:id/unblock-region', validarEmpresa, async (req, res) => {
  const { postalCode } = req.body; // Códigos postais que a empresa quer desbloquear

  if (!postalCode) return res.status(400).json({ error: 'PostalCode é obrigatório.' });

  try {
    const company = await Company.findById(req.params.id);

    if (!company) return res.status(404).json({ error: 'Empresa não encontrada.' });

    const index = company.blockedRegions.indexOf(postalCode);
    if (index === -1) {
      return res.status(404).json({ error: 'Região não encontrada para desbloqueio.' });
    }

    company.blockedRegions.splice(index, 1);
    await company.save();

    res.json({ message: 'Região desbloqueada com sucesso.', blockedRegions: company.blockedRegions });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desbloquear a região' });
  }
});

module.exports = router;
