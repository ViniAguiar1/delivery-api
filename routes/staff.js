const express = require('express');
const Staff = require('../models/Staff');  // Importando o modelo Staff
const autenticarToken = require('../middleware/auth');

const router = express.Router();

// Middleware para validar empresa
function validarEmpresa(req, res, next) {
  if (req.user.tipo !== 'empresa') {
    return res.status(403).json({ error: 'Acesso permitido apenas para empresas.' });
  }
  next();
}

// GET - listar funcionários da empresa logada
router.get('/', autenticarToken, validarEmpresa, async (req, res) => {
  try {
    const staff = await Staff.find({ empresaId: req.user.id, ativo: true });  // Buscar funcionários ativos
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar funcionários.' });
  }
});

// POST - adicionar novo funcionário
router.post('/', autenticarToken, validarEmpresa, async (req, res) => {
  const { nome, email, telefone, cargo, placaVeiculo } = req.body;

  if (!nome || !email || !cargo) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, email e cargo.' });
  }

  try {
    const novoFuncionario = new Staff({
      nome,
      email,
      telefone: telefone || '',
      cargo,
      placaVeiculo: cargo === 'motoboy' ? placaVeiculo || '' : '',
      empresaId: req.user.id,
      ativo: true
    });

    await novoFuncionario.save();  // Salvar o novo funcionário no banco
    res.status(201).json(novoFuncionario);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar funcionário.' });
  }
});

// PATCH - editar funcionário
router.patch('/:id', autenticarToken, validarEmpresa, async (req, res) => {
  const { id } = req.params;

  try {
    const funcionario = await Staff.findOneAndUpdate(
      { _id: id, empresaId: req.user.id },
      req.body,
      { new: true }  // Retorna o documento atualizado
    );

    if (!funcionario) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }

    // Atualizar a placa de veículo somente se o cargo for 'motoboy'
    if (funcionario.cargo === 'motoboy' && req.body.placaVeiculo) {
      funcionario.placaVeiculo = req.body.placaVeiculo;
    }

    await funcionario.save();  // Salvar alterações no banco
    res.json(funcionario);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar funcionário.' });
  }
});

// DELETE - desativar funcionário
router.delete('/:id', autenticarToken, validarEmpresa, async (req, res) => {
  const { id } = req.params;

  try {
    const funcionario = await Staff.findOne({ _id: id, empresaId: req.user.id });

    if (!funcionario) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }

    funcionario.ativo = false;  // Marcar funcionário como inativo
    await funcionario.save();  // Salvar no banco de dados

    res.json({ message: 'Funcionário desativado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desativar funcionário.' });
  }
});

module.exports = router;
