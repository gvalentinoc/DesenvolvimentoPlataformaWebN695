const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório']
  },
  sobrenome: {
    type: String,
    required: [true, 'Sobrenome é obrigatório']
  },
  email: {
    type: String,
    required: [true, 'E-mail é obrigatório'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, adicione um e-mail válido']
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: 8,
    select: false
  },
  status: {
    type: String,
    enum: ['Ativo', 'Inativo'],
    default: 'Ativo'
  },
  lgpdConsent: {
    type: Boolean,
    required: [true, 'Consentimento LGPD é obrigatório']
  },
  dataConsentimento: {
    type: Date,
    default: Date.now
  },
  ultimoLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (!this.isModified('senha')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.senha);
};

module.exports = mongoose.model('User', userSchema);
