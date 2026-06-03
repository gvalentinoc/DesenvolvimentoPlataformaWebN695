const User = require('../models/User');
const jwt = require('jsonwebtoken');
const audit = require('../utils/audit');

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

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
      const token = generateToken(user._id);
      res.cookie('token', token, COOKIE_OPTIONS);
      res.status(201).json({
        _id: user._id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, role: user.role, token
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
      await User.findByIdAndUpdate(user._id, { ultimoLogin: new Date() });
      await audit('login', user._id, user._id.toString(), { email });
      const token = generateToken(user._id);
      res.cookie('token', token, COOKIE_OPTIONS);
      res.json({
        _id: user._id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, role: user.role, token
      });
    } else {
      await audit('login-falhou', null, null, { email });
      res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }
  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logout realizado com sucesso.' });
};

const me = (req, res) => {
  const u = req.user;
  res.json({ _id: u._id, nome: u.nome, sobrenome: u.sobrenome, email: u.email, role: u.role, status: u.status, dataConsentimento: u.dataConsentimento });
};

module.exports = { register, login, logout, me };