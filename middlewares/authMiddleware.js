function requireAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Acesso negado. Faca login para continuar.'
  });
}

module.exports = {
  requireAuth
};
