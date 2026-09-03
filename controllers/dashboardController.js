const pool = require('../database/connection');

async function getDashboard(req, res) {
  try {
    const [[summary]] = await pool.execute(
      `SELECT
        COUNT(*) AS totalProdutos,
        COALESCE(SUM(quantidade), 0) AS totalEstoque,
        SUM(CASE WHEN quantidade <= 5 THEN 1 ELSE 0 END) AS estoqueBaixo
       FROM produtos`
    );

    const [recentEntries] = await pool.execute(
      `SELECT m.id, p.nome AS produto_nome, p.unidade_medida, m.quantidade,
              m.origem_motivo, m.responsavel, m.data_movimentacao
       FROM movimentacoes_estoque m
       INNER JOIN produtos p ON p.id = m.produto_id
       WHERE m.tipo_movimentacao = 'entrada'
       ORDER BY m.data_movimentacao DESC, m.id DESC
       LIMIT 5`
    );

    const [recentExits] = await pool.execute(
      `SELECT m.id, p.nome AS produto_nome, p.unidade_medida, m.quantidade,
              m.origem_motivo, m.responsavel, m.data_movimentacao
       FROM movimentacoes_estoque m
       INNER JOIN produtos p ON p.id = m.produto_id
       WHERE m.tipo_movimentacao = 'saida'
       ORDER BY m.data_movimentacao DESC, m.id DESC
       LIMIT 5`
    );

    const [lowStockProducts] = await pool.execute(
      `SELECT id, nome, categoria, quantidade, unidade_medida
       FROM produtos
       WHERE quantidade <= 5
       ORDER BY quantidade ASC, nome ASC
       LIMIT 5`
    );

    return res.json({
      success: true,
      cards: {
        totalProdutos: summary.totalProdutos,
        totalEstoque: summary.totalEstoque,
        estoqueBaixo: summary.estoqueBaixo || 0
      },
      entradasRecentes: recentEntries,
      saidasRecentes: recentExits,
      produtosEstoqueBaixo: lowStockProducts
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);

    return res.status(500).json({
      success: false,
      message: 'Erro ao carregar dashboard.'
    });
  }
}

module.exports = {
  getDashboard
};
