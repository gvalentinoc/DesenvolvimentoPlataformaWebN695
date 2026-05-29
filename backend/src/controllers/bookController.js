const Book = require('../models/Book');

// @desc    Get all books (with filtering and pagination)
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
  try {
    const { genero, disponivel, idioma, ordem, busca, pagina = 1, limite = 12 } = req.query;
    
    let query = {};
    
    // Search by title, author or ISBN
    if (busca) {
      query.$or = [
        { titulo: { $regex: busca, $options: 'i' } },
        { autor: { $regex: busca, $options: 'i' } },
        { isbn: { $regex: busca, $options: 'i' } }
      ];
    }
    
    // Filters
    if (genero) {
      const generosArray = genero.split(',');
      query.genero = { $in: generosArray };
    }
    
    if (idioma) {
      const idiomasArray = idioma.split(',');
      query.idioma = { $in: idiomasArray };
    }
    
    if (disponivel === 'true') {
      query.numeroExemplares = { $gt: 0 };
    } else if (disponivel === 'false') {
      query.numeroExemplares = 0;
    }
    
    // Sorting
    let sort = {};
    if (ordem === 'titulo') {
      sort.titulo = 1;
    } else if (ordem === 'recente') {
      sort.createdAt = -1;
    } else {
      sort.createdAt = -1; // Default sort
    }
    
    // Pagination
    const page = parseInt(pagina, 10);
    const limit = parseInt(limite, 10);
    const startIndex = (page - 1) * limit;
    
    const total = await Book.countDocuments(query);
    const books = await Book.find(query).sort(sort).skip(startIndex).limit(limit);
    
    res.json({
      success: true,
      count: books.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: books
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ message: 'Livro não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a book
// @route   POST /api/books
// @access  Private
const createBook = async (req, res) => {
  try {
    const bookExists = await Book.findOne({ isbn: req.body.isbn });
    if (bookExists) {
      return res.status(400).json({ message: 'Um livro com este ISBN já existe' });
    }
    
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private
const updateBook = async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    
    // Check if updating ISBN to one that already exists
    if (req.body.isbn && req.body.isbn !== book.isbn) {
      const isbnExists = await Book.findOne({ isbn: req.body.isbn });
      if (isbnExists) {
        return res.status(400).json({ message: 'Um livro com este ISBN já existe' });
      }
    }
    
    book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }
    
    await Book.deleteOne({ _id: book._id });
    res.json({ message: 'Livro removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
