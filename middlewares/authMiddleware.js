function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Não autenticado.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  const tipo = String(req.session?.user?.tipo_usuario || '').toLowerCase();

  if (tipo !== 'administrador' && tipo !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem gerenciar usuários.'
    });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};