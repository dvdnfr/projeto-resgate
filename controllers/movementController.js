const pool = require('../database/connection');

async function listMovements(req, res) {
  try {
    const [movements] = await pool.execute(
      `SELECT m.id, m.produto_id, p.nome AS produto_nome, p.unidade_medida,
              m.tipo_movimentacao, m.quantidade, m.origem_motivo, m.responsavel,
              m.data_movimentacao, m.observacoes, m.criado_em
       FROM movimentacoes_estoque m
       INNER JOIN produtos p ON p.id = m.produto_id
       ORDER BY m.data_movimentacao DESC, m.id DESC`
    );

    return res.json({ success: true, data: movements });
  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar movimentações.' });
  }
}

async function listProductMovements(req, res) {
  try {
    const [movements] = await pool.execute(
      `SELECT m.id, m.produto_id, p.nome AS produto_nome, p.unidade_medida,
              m.tipo_movimentacao, m.quantidade, m.origem_motivo, m.responsavel,
              m.data_movimentacao, m.observacoes, m.criado_em
       FROM movimentacoes_estoque m
       INNER JOIN produtos p ON p.id = m.produto_id
       WHERE m.produto_id = ?
       ORDER BY m.data_movimentacao DESC, m.id DESC`,
      [req.params.produtoId]
    );

    return res.json({ success: true, data: movements });
  } catch (error) {
    console.error('Erro ao listar movimentações do produto:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar movimentações do produto.' });
  }
}

module.exports = {
  listMovements,
  listProductMovements
};
