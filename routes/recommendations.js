const express = require('express');
const mongoose = require('mongoose');
const Recommendation = require('../models/Recommendation'); // Importando a model Recommendation
const Product = require('../models/Product'); // Importando a model Product
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// Função para gerar recomendações de produtos baseadas nas interações do usuário
router.get('/', autenticarToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Buscar favoritos e pedidos do usuário
    const favoritos = await mongoose.model('Favorite').find({ userId });
    const pedidos = await mongoose.model('Order').find({ userId });

    const empresasFavoritas = favoritos.map(f => f.companyId);
    const empresasDosPedidos = [...new Set(pedidos.map(p => p.companyId))];

    const empresasBase = [...new Set([...empresasFavoritas, ...empresasDosPedidos])];

    // Buscar categorias baseadas nas empresas que o usuário interage
    const categoriasFrequentes = await mongoose.model('Company').find({ '_id': { $in: empresasBase } })
      .then(companies => companies.flatMap(company => company.categories));

    const categoriasUnicas = [...new Set(categoriasFrequentes)];

    // Buscar produtos de empresas com as mesmas categorias que o usuário ainda não comprou
    const produtosRecomendados = await Product.find({
      companyId: { $in: empresasBase },
      categories: { $in: categoriasUnicas },
      _id: { $nin: pedidos.map(pedido => pedido.productId) }
    });

    const recommendations = produtosRecomendados.map(prod => ({
      productId: prod._id,
      productName: prod.name,
      productPrice: prod.price,
      productImage: prod.image,
      companyName: prod.companyName
    }));

    // Criar ou atualizar recomendações para o usuário
    let existingRecommendation = await Recommendation.findOne({ userId });

    if (existingRecommendation) {
      existingRecommendation.recommendations = recommendations;
      await existingRecommendation.save();
    } else {
      const newRecommendation = new Recommendation({
        userId,
        recommendations
      });
      await newRecommendation.save();
    }

    // Limitar o número de recomendações (máximo 10)
    res.json(recommendations.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar recomendações de produtos.' });
  }
});

module.exports = router;
