const pool = require('../database/connection');

async function getReports(req, res) {
  try {
    const [[stock]] = await pool.execute(
      `SELECT
        COUNT(*) AS totalProdutos,
        COALESCE(SUM(quantidade), 0) AS totalItensEstoque
       FROM produtos`
    );

    const [[entries]] = await pool.execute(
      `SELECT COUNT(*) AS totalEntradas, COALESCE(SUM(quantidade), 0) AS quantidadeEntradas
       FROM movimentacoes_estoque
       WHERE tipo_movimentacao = 'entrada'`
    );

    const [[exits]] = await pool.execute(
      `SELECT COUNT(*) AS totalSaidas, COALESCE(SUM(quantidade), 0) AS quantidadeSaidas
       FROM movimentacoes_estoque
       WHERE tipo_movimentacao = 'saida'`
    );

    const [mostMovedProducts] = await pool.execute(
      `SELECT p.id, p.nome, p.unidade_medida, COUNT(m.id) AS total_movimentacoes,
              COALESCE(SUM(m.quantidade), 0) AS quantidade_movimentada
       FROM produtos p
       INNER JOIN movimentacoes_estoque m ON m.produto_id = p.id
       GROUP BY p.id, p.nome, p.unidade_medida
       ORDER BY total_movimentacoes DESC, quantidade_movimentada DESC
       LIMIT 8`
    );

    const [movements] = await pool.execute(
      `SELECT m.id, p.nome AS produto_nome, p.unidade_medida, m.tipo_movimentacao,
              m.quantidade, m.origem_motivo, m.responsavel, m.data_movimentacao
       FROM movimentacoes_estoque m
       INNER JOIN produtos p ON p.id = m.produto_id
       ORDER BY m.data_movimentacao DESC, m.id DESC
       LIMIT 12`
    );

    return res.json({
      success: true,
      estoque: stock,
      entradas: entries,
      saidas: exits,
      produtosMaisMovimentados: mostMovedProducts,
      historicoMovimentacoes: movements
    });
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error);
    return res.status(500).json({ success: false, message: 'Erro ao carregar relatórios.' });
  }
}

module.exports = {
  getReports
};
