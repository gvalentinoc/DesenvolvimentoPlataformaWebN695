const User = require('../models/User');
const audit = require('../utils/audit');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-senha');
    await audit('listagem-usuarios', req.user?._id);
    res.json(users);
  } catch (error) {
    console.error('[getUsers]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { nome, sobrenome, email, senha, status, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Usuário já existe' });

    const user = await User.create({
      nome, sobrenome, email, senha,
      role: role || 'leitor',
      status: status || 'Ativo',
      lgpdConsent: false,
      dataConsentimento: null,
    });

    if (user) {
      await audit('usuario-criado', req.user?._id, user._id.toString(), { email: user.email });
      res.status(201).json({ _id: user._id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, role: user.role, status: user.status });
    } else {
      res.status(400).json({ message: 'Dados de usuário inválidos' });
    }
  } catch (error) {
    console.error('[createUser]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.nome = req.body.nome || user.nome;
      user.sobrenome = req.body.sobrenome || user.sobrenome;
      user.email = req.body.email || user.email;
      user.status = req.body.status || user.status;
      if (req.body.role) user.role = req.body.role;
      if (req.body.senha) user.senha = req.body.senha;

      const updatedUser = await user.save();
      await audit('usuario-editado', req.user?._id, req.params.id);
      res.json({ _id: updatedUser._id, nome: updatedUser.nome, sobrenome: updatedUser.sobrenome, email: updatedUser.email, role: updatedUser.role, status: updatedUser.status });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('[updateUser]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await User.deleteOne({ _id: user._id });
      await audit('usuario-deletado', req.user?._id, req.params.id);
      res.json({ message: 'Usuário removido' });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('[deleteUser]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };