const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(getBooks)
  .post(protect, adminOnly, createBook);

router.route('/:id')
  .get(getBookById)
  .put(protect, adminOnly, updateBook)
  .delete(protect, adminOnly, deleteBook);

module.exports = router;