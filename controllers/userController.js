const pool = require('../database/connection');

async function listUsers(req, res) {
  try {
    const [users] = await pool.execute(
      `SELECT id, nome, usuario, tipo_usuario, criado_em
       FROM usuarios
       ORDER BY nome ASC`
    );

    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('Erro ao listar usuarios:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar usuarios.' });
  }
}

async function createUser(req, res) {
  const { nome, usuario, senha, tipo_usuario } = req.body;

  if (!nome || !usuario || !senha || !tipo_usuario) {
    return res.status(400).json({ success: false, message: 'Preencha os campos obrigatorios.' });
  }

  try {
    // Apenas para fins didaticos. Em um sistema real, salve a senha criptografada com bcrypt.
    await pool.execute(
      'INSERT INTO usuarios (nome, usuario, senha, tipo_usuario) VALUES (?, ?, ?, ?)',
      [nome, usuario, senha, tipo_usuario]
    );

    return res.status(201).json({ success: true, message: 'Usuario cadastrado com sucesso.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Este usuario ja existe.' });
    }

    console.error('Erro ao cadastrar usuario:', error);
    return res.status(500).json({ success: false, message: 'Erro ao cadastrar usuario.' });
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { nome, usuario, senha, tipo_usuario } = req.body;

  if (!nome || !usuario || !tipo_usuario) {
    return res.status(400).json({ success: false, message: 'Preencha os campos obrigatorios.' });
  }

  try {
    let result;

    if (senha) {
      // Apenas para fins didaticos. Em um sistema real, salve a senha criptografada com bcrypt.
      [result] = await pool.execute(
        'UPDATE usuarios SET nome = ?, usuario = ?, senha = ?, tipo_usuario = ? WHERE id = ?',
        [nome, usuario, senha, tipo_usuario, id]
      );
    } else {
      [result] = await pool.execute(
        'UPDATE usuarios SET nome = ?, usuario = ?, tipo_usuario = ? WHERE id = ?',
        [nome, usuario, tipo_usuario, id]
      );
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Usuario nao encontrado.' });
    }

    return res.json({ success: true, message: 'Usuario atualizado com sucesso.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Este usuario ja existe.' });
    }

    console.error('Erro ao atualizar usuario:', error);
    return res.status(500).json({ success: false, message: 'Erro ao atualizar usuario.' });
  }
}

async function deleteUser(req, res) {
  if (Number(req.params.id) === req.session.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Voce nao pode excluir o proprio usuario logado.'
    });
  }

  try {
    const [result] = await pool.execute('DELETE FROM usuarios WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Usuario nao encontrado.' });
    }

    return res.json({ success: true, message: 'Usuario excluido com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuario:', error);
    return res.status(500).json({ success: false, message: 'Erro ao excluir usuario.' });
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser
};
