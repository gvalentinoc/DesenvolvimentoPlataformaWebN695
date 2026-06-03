const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, logout, me, acceptConsent, updateMe, deleteMe, revokeConsent } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.patch('/me/accept-consent', protect, acceptConsent);
router.put('/me', protect, updateMe);
router.delete('/me', protect, deleteMe);
router.patch('/me/revoke-consent', protect, revokeConsent);

module.exports = router;