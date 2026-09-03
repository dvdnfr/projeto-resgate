const pool = require('../database/connection');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Informe usuario e senha.'
    });
  }

  try {
    const [users] = await pool.execute(
      'SELECT id, nome, usuario, senha, tipo_usuario FROM usuarios WHERE usuario = ? LIMIT 1',
      [username]
    );

    const user = users[0];

    // Apenas para fins didaticos. Em um sistema real, use bcrypt para comparar senhas criptografadas.
    if (!user || user.senha !== password) {
      return res.status(401).json({
        success: false,
        message: 'Usuario ou senha incorretos.'
      });
    }

    req.session.user = {
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      tipo_usuario: user.tipo_usuario
    };

    return res.json({
      success: true,
      message: 'Login realizado com sucesso.',
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro ao consultar usuario:', error);

    return res.status(500).json({
      success: false,
      message: 'Erro interno ao tentar fazer login.'
    });
  }
}

function me(req, res) {
  return res.json({
    success: true,
    user: req.session.user
  });
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Nao foi possivel encerrar a sessao.'
      });
    }

    res.clearCookie('connect.sid');

    return res.json({
      success: true,
      message: 'Sessao encerrada com sucesso.'
    });
  });
}

module.exports = {
  login,
  me,
  logout
};
