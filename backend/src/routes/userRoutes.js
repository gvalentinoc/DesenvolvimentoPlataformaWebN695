const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/').get(protect, adminOnly, getUsers).post(protect, adminOnly, createUser);
router.route('/:id').put(protect, adminOnly, updateUser).delete(protect, adminOnly, deleteUser);

module.exports = router;
