const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = req.cookies?.token;

  // mantém suporte ao header Authorization para compatibilidade
  if (!token && req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado, sem token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-senha');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Não autorizado, token inválido' });
  }
};

module.exports = { protect };
