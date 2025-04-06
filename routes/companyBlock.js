const express = require('express');
const Company = require('../models/Company');  // Importando o modelo de Company
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// Middleware de validação do tipo "empresa"
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// PATCH /api/companies/block-user - Bloquear usuário
router.patch('/block-user', autenticarToken, validarEmpresa, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  try {
    const empresa = await Company.findById(req.user.id);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

    // Se o usuário não estiver bloqueado, bloqueia
    if (!empresa.blockedUsers.includes(userId)) {
      empresa.blockedUsers.push(userId);
      await empresa.save();  // Salva a alteração no banco de dados
    }

    res.json({ message: 'Usuário bloqueado com sucesso.', blockedUsers: empresa.blockedUsers });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao bloquear usuário.' });
  }
});

// PATCH /api/companies/unblock-user - Desbloquear usuário
router.patch('/unblock-user', autenticarToken, validarEmpresa, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  try {
    const empresa = await Company.findById(req.user.id);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

    // Filtra o usuário para removê-lo da lista de bloqueados
    empresa.blockedUsers = empresa.blockedUsers.filter(id => id !== userId);
    await empresa.save();  // Salva a alteração no banco de dados

    res.json({ message: 'Usuário desbloqueado com sucesso.', blockedUsers: empresa.blockedUsers });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desbloquear usuário.' });
  }
});

module.exports = router;
