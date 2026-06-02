const AuditLog = require('../models/AuditLog');

const audit = async (acao, solicitante = null, alvo = null, detalhes = null) => {
  try {
    await AuditLog.create({ acao, solicitante, alvo, detalhes });
  } catch (err) {
    console.error('[audit] falha ao persistir log:', err);
  }
};

module.exports = audit;
