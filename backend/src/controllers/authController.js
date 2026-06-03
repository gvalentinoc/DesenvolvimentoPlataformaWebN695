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

const CONSENT_VERSION = '1.0';

const register = async (req, res) => {
  try {
    const { nome, sobrenome, email, senha, lgpdConsent } = req.body;
    if (!lgpdConsent) return res.status(400).json({ message: 'Consentimento LGPD é obrigatório' });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Usuário já existe' });

    const now = new Date();
    const user = await User.create({
      nome, sobrenome, email, senha, lgpdConsent,
      dataConsentimento: now,
      consentVersion: CONSENT_VERSION,
      consentHistory: [{ version: CONSENT_VERSION, acceptedAt: now }],
    });
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
        _id: user._id, nome: user.nome, sobrenome: user.sobrenome, email: user.email, role: user.role, lgpdConsent: user.lgpdConsent, token
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
  res.json({ _id: u._id, nome: u.nome, sobrenome: u.sobrenome, email: u.email, role: u.role, status: u.status, dataConsentimento: u.dataConsentimento, ultimoLogin: u.ultimoLogin });
};

// Art. 8 — aceite de consentimento no primeiro login (usuário criado pelo admin)
const acceptConsent = async (req, res) => {
  try {
    const now = new Date();
    await User.findByIdAndUpdate(req.user._id, {
      $set: { lgpdConsent: true, dataConsentimento: now, consentVersion: CONSENT_VERSION },
      $push: { consentHistory: { version: CONSENT_VERSION, acceptedAt: now } },
    });
    await audit('titular-aceitou-consentimento', req.user._id, req.user._id.toString(), { version: CONSENT_VERSION });
    res.json({ message: 'Consentimento registrado.' });
  } catch (error) {
    console.error('[acceptConsent]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// Art. 18, III — correção de dados pelo próprio titular
const updateMe = async (req, res) => {
  try {
    const { nome, sobrenome, email, senha } = req.body;
    const user = await User.findById(req.user._id).select('+senha');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    if (nome) user.nome = nome;
    if (sobrenome) user.sobrenome = sobrenome;
    if (email) user.email = email;
    if (senha) user.senha = senha;

    const updated = await user.save();
    await audit('titular-atualizou-dados', req.user._id, req.user._id.toString());
    res.json({ _id: updated._id, nome: updated.nome, sobrenome: updated.sobrenome, email: updated.email });
  } catch (error) {
    console.error('[updateMe]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// Art. 18, VI — direito ao esquecimento / exclusão pelo titular
const deleteMe = async (req, res) => {
  try {
    await audit('titular-solicitou-exclusao', req.user._id, req.user._id.toString());
    await User.deleteOne({ _id: req.user._id });
    res.clearCookie('token', COOKIE_OPTIONS);
    res.json({ message: 'Conta excluída com sucesso.' });
  } catch (error) {
    console.error('[deleteMe]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// Art. 8, §5º — revogação de consentimento pelo titular
const revokeConsent = async (req, res) => {
  try {
    const now = new Date();
    await User.findByIdAndUpdate(req.user._id, {
      $set: { lgpdConsent: false, 'consentHistory.$[last].revokedAt': now },
    }, {
      arrayFilters: [{ 'last.revokedAt': null }],
    });
    await audit('titular-revogou-consentimento', req.user._id, req.user._id.toString());
    res.json({ message: 'Consentimento revogado. Seus dados serão removidos em até 30 dias.' });
  } catch (error) {
    console.error('[revokeConsent]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

module.exports = { register, login, logout, me, acceptConsent, updateMe, deleteMe, revokeConsent };