const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  try {
    const { nome, sobrenome, email, senha, lgpdConsent } = req.body;
    if (!lgpdConsent) return res.status(400).json({ message: 'Consentimento LGPD é obrigatório' });
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Usuário já existe' });

    const user = await User.create({ nome, sobrenome, email, senha, lgpdConsent });
    if (user) {
      res.status(201).json({
        _id: user._id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Dados de usuário inválidos' });
    }
  } catch (error) {
    console.error('[register]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email }).select('+senha');

    if (user && (await user.matchPassword(senha))) {
      if (user.status === 'Inativo') return res.status(401).json({ message: 'Conta inativa.' });
      console.info(`[audit] login email=${email} userId=${user._id}`);
      res.json({
        _id: user._id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, token: generateToken(user._id)
      });
    } else {
      console.warn(`[audit] login-falhou email=${email}`);
      res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }
  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

module.exports = { register, login };
