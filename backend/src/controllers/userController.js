const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-senha');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { nome, sobrenome, email, senha, status, lgpdConsent } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Usuário já existe' });

    const user = await User.create({
      nome, sobrenome, email, senha, status: status || 'Ativo', lgpdConsent: lgpdConsent !== undefined ? lgpdConsent : true
    });

    if (user) {
      res.status(201).json({ _id: user._id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, status: user.status });
    } else {
      res.status(400).json({ message: 'Dados de usuário inválidos' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      if (req.body.senha) user.senha = req.body.senha;
      
      const updatedUser = await user.save();
      res.json({ _id: updatedUser._id, nome: updatedUser.nome, sobrenome: updatedUser.sobrenome, email: updatedUser.email, status: updatedUser.status });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'Usuário removido' });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
