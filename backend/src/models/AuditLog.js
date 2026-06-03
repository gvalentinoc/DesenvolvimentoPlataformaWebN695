const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  acao: { type: String, required: true },
  solicitante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  alvo: { type: String, default: null },
  detalhes: { type: mongoose.Schema.Types.Mixed, default: null },
}, {
  timestamps: true
});

// Art. 15 LGPD — retenção limitada ao necessário (90 dias)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);