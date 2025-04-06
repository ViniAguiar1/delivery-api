const express = require('express');
const fs = require('fs');
const path = require('path');
const autenticarToken = require('../middleware/auth');

const router = express.Router();
const dataPath = path.join(__dirname, '../db/data.json');

function readData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

// GET - recomendações de produtos para o usuário logado
router.get('/', autenticarToken, (req, res) => {
  const data = readData();
  const userId = req.user.id;

  const favoritos = (data.favorites || []).filter(f => f.userId === userId);
  const pedidos = (data.orders || []).filter(p => p.userId === userId);

  const empresasFavoritas = favoritos.map(f => f.companyId);
  const empresasDosPedidos = [...new Set(pedidos.map(p => p.companyId))];

  const empresasBase = [...new Set([...empresasFavoritas, ...empresasDosPedidos])];

  // Buscar categorias baseadas nessas empresas
  const categoriasFrequentes = empresasBase
    .map(id => data.companies.find(c => c.id === id))
    .filter(Boolean)
    .flatMap(c => c.categories);

  const categoriasUnicas = [...new Set(categoriasFrequentes)];

  // Buscar produtos de empresas com as mesmas categorias, que o usuário ainda não comprou
  const produtosRecomendados = data.products.filter(p => {
    const empresa = data.companies.find(c => c.id === p.companyId);
    if (!empresa) return false;

    const temCategoriaRelacionada = empresa.categories.some(cat => categoriasUnicas.includes(cat));
    const naoEhEmpresaRepetida = !empresasBase.includes(empresa.id);

    return temCategoriaRelacionada && naoEhEmpresaRepetida;
  }).map(prod => {
    const empresa = data.companies.find(c => c.id === prod.companyId);
    return {
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image,
      companyName: empresa?.name || ''
    };
  });

  res.json(produtosRecomendados.slice(0, 10)); // Limitar a 10 sugestões
});

module.exports = router;
