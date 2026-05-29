const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Título é obrigatório']
  },
  autor: {
    type: String,
    required: [true, 'Autor é obrigatório']
  },
  isbn: {
    type: String,
    required: [true, 'ISBN é obrigatório'],
    unique: true
  },
  genero: {
    type: String,
    required: [true, 'Gênero é obrigatório']
  },
  anoPublicacao: {
    type: Number,
    required: [true, 'Ano de publicação é obrigatório']
  },
  numeroExemplares: {
    type: Number,
    required: [true, 'Número de exemplares é obrigatório'],
    default: 1,
    min: [0, 'O número de exemplares não pode ser negativo']
  },
  idioma: {
    type: String,
    required: [true, 'Idioma é obrigatório']
  },
  paginas: {
    type: Number,
    required: [true, 'Número de páginas é obrigatório']
  },
  sinopse: {
    type: String,
    required: [true, 'Sinopse é obrigatória']
  },
  urlCapa: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property to determine if the book is available
bookSchema.virtual('disponivel').get(function() {
  return this.numeroExemplares > 0;
});

module.exports = mongoose.model('Book', bookSchema);
