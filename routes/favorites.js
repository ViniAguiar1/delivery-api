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

// GET - listar favoritos do usuário logado
router.get('/', autenticarToken, (req, res) => {
  const data = readData();
  const favorites = data.favorites || [];
  const companies = data.companies || [];

  const userFavorites = favorites
    .filter(f => f.userId === req.user.id)
    .map(fav => companies.find(c => c.id === fav.companyId))
    .filter(Boolean);

  res.json(userFavorites);
});

// POST - adicionar favorito
router.post('/:companyId', autenticarToken, (req, res) => {
  const data = readData();
  const favorites = data.favorites || [];
  const companies = data.companies || [];

  const companyId = parseInt(req.params.companyId);
  const company = companies.find(c => c.id === companyId);
  if (!company) return res.status(404).json({ error: 'Empresa não encontrada' });

  const alreadyFavorited = favorites.find(f => f.userId === req.user.id && f.companyId === companyId);
  if (alreadyFavorited) return res.status(409).json({ error: 'Empresa já favoritada' });

  const newFavorite = {
    userId: req.user.id,
    companyId
  };

  favorites.push(newFavorite);
  data.favorites = favorites;
  writeData(data);

  res.status(201).json({ message: 'Empresa favoritada com sucesso' });
});

// DELETE - remover favorito
router.delete('/:companyId', autenticarToken, (req, res) => {
  const data = readData();
  let favorites = data.favorites || [];

  const companyId = parseInt(req.params.companyId);
  const index = favorites.findIndex(f => f.userId === req.user.id && f.companyId === companyId);

  if (index === -1) return res.status(404).json({ error: 'Favorito não encontrado' });

  favorites.splice(index, 1);
  data.favorites = favorites;
  writeData(data);

  res.json({ message: 'Favorito removido com sucesso' });
});

module.exports = router;
