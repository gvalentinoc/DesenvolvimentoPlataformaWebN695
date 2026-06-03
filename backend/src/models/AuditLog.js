const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  acao: { type: String, required: true },
  solicitante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  alvo: { type: String, default: null },
  detalhes: { type: mongoose.Schema.Types.Mixed, default: null },
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);