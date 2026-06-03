const Book = require('../models/Book');
const audit = require('../utils/audit');

const getBooks = async (req, res) => {
  try {
    const { genero, disponivel, idioma, ordem, busca, pagina = 1, limite = 12 } = req.query;

    let query = {};

    if (busca) {
      query.$or = [
        { titulo: { $regex: busca, $options: 'i' } },
        { autor: { $regex: busca, $options: 'i' } },
        { isbn: { $regex: busca, $options: 'i' } }
      ];
    }

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

    let sort = {};
    if (ordem === 'titulo') {
      sort.titulo = 1;
    } else if (ordem === 'recente') {
      sort.createdAt = -1;
    } else {
      sort.createdAt = -1;
    }

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
    console.error('[getBooks]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ message: 'Livro não encontrado' });
    }
  } catch (error) {
    console.error('[getBookById]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const BOOK_FIELDS = ['titulo', 'autor', 'isbn', 'genero', 'anoPublicacao', 'numeroExemplares', 'idioma', 'paginas', 'sinopse', 'urlCapa'];

const pickBookFields = (body) => BOOK_FIELDS.reduce((acc, key) => {
  if (body[key] !== undefined) acc[key] = body[key];
  return acc;
}, {});

const createBook = async (req, res) => {
  try {
    const data = pickBookFields(req.body);
    const bookExists = await Book.findOne({ isbn: data.isbn });
    if (bookExists) {
      return res.status(400).json({ message: 'Um livro com este ISBN já existe' });
    }

    const book = await Book.create(data);
    await audit('livro-criado', req.user?._id, book._id.toString(), { titulo: book.titulo });
    res.status(201).json(book);
  } catch (error) {
    console.error('[createBook]', error);
    res.status(400).json({ message: 'Erro ao criar livro. Verifique os dados enviados.' });
  }
};

const updateBook = async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    if (req.body.isbn && req.body.isbn !== book.isbn) {
      const isbnExists = await Book.findOne({ isbn: req.body.isbn });
      if (isbnExists) {
        return res.status(400).json({ message: 'Um livro com este ISBN já existe' });
      }
    }

    book = await Book.findByIdAndUpdate(req.params.id, pickBookFields(req.body), {
      new: true,
      runValidators: true
    });

    await audit('livro-editado', req.user?._id, req.params.id);
    res.json(book);
  } catch (error) {
    console.error('[updateBook]', error);
    res.status(400).json({ message: 'Erro ao atualizar livro. Verifique os dados enviados.' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    await Book.deleteOne({ _id: book._id });
    await audit('livro-deletado', req.user?._id, req.params.id);
    res.json({ message: 'Livro removido com sucesso' });
  } catch (error) {
    console.error('[deleteBook]', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};