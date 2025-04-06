const express = require('express');
const Favorite = require('../models/Favorite');  // Importando a model Favorite
const Company = require('../models/Company');  // Importando a model Company (para buscar informações da empresa)
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// GET - listar favoritos do usuário logado
router.get('/', autenticarToken, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).populate('companyId');
    res.json(favorites.map(fav => fav.companyId));  // Retorna apenas as empresas favoritas
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar favoritos.' });
  }
});

// POST - adicionar favorito
router.post('/:companyId', autenticarToken, async (req, res) => {
  const companyId = req.params.companyId;

  try {
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ error: 'Empresa não encontrada.' });

    const alreadyFavorited = await Favorite.findOne({ userId: req.user.id, companyId });
    if (alreadyFavorited) return res.status(409).json({ error: 'Empresa já favoritada.' });

    const newFavorite = new Favorite({
      userId: req.user.id,
      companyId
    });

    await newFavorite.save();
    res.status(201).json({ message: 'Empresa favoritada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao favoritar empresa.' });
  }
});

// DELETE - remover favorito
router.delete('/:companyId', autenticarToken, async (req, res) => {
  const companyId = req.params.companyId;

  try {
    const favorite = await Favorite.findOneAndDelete({ userId: req.user.id, companyId });
    if (!favorite) return res.status(404).json({ error: 'Favorito não encontrado.' });

    res.json({ message: 'Favorito removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover favorito.' });
  }
});

module.exports = router;
