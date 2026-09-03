const pool = require('../database/connection');

function parsePositiveQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) ? quantity : NaN;
}

async function listProducts(req, res) {
  const { busca = '', categoria = '', origem = '' } = req.query;

  const conditions = [];
  const params = [];

  if (busca) {
    conditions.push('nome LIKE ?');
    params.push(`%${busca}%`);
  }

  if (categoria) {
    conditions.push('categoria = ?');
    params.push(categoria);
  }

  if (origem) {
    conditions.push('origem = ?');
    params.push(origem);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [products] = await pool.execute(
      `SELECT id, nome, categoria, origem, doador_fornecedor, quantidade, unidade_medida,
              data_entrada, observacoes, criado_em
       FROM produtos
       ${where}
       ORDER BY nome ASC`,
      params
    );

    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar produtos.' });
  }
}

async function getProduct(req, res) {
  try {
    const [products] = await pool.execute(
      `SELECT id, nome, categoria, origem, doador_fornecedor, quantidade, unidade_medida,
              data_entrada, observacoes, criado_em
       FROM produtos
       WHERE id = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (!products.length) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
    }

    return res.json({ success: true, data: products[0] });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar produto.' });
  }
}

async function getProductSummary(req, res) {
  try {
    const [[summary]] = await pool.execute(
      `SELECT
        COUNT(*) AS totalProdutos,
        COALESCE(SUM(quantidade), 0) AS totalEstoque,
        SUM(CASE WHEN quantidade <= 5 THEN 1 ELSE 0 END) AS estoqueBaixo
       FROM produtos`
    );

    return res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Erro ao buscar resumo de produtos:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar resumo de produtos.' });
  }
}

async function createProduct(req, res) {
  const {
    nome,
    categoria,
    origem,
    doador_fornecedor,
    quantidade,
    unidade_medida,
    data_entrada,
    observacoes
  } = req.body;

  const parsedQuantity = parsePositiveQuantity(quantidade);

  if (!nome || !categoria || !origem || !quantidade || !unidade_medida || !data_entrada) {
    return res.status(400).json({ success: false, message: 'Preencha os campos obrigatórios.' });
  }

  if (parsedQuantity <= 0) {
    return res.status(400).json({ success: false, message: 'A quantidade deve ser maior que zero.' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO produtos
        (nome, categoria, origem, doador_fornecedor, quantidade, unidade_medida, data_entrada, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        categoria,
        origem,
        doador_fornecedor || null,
        parsedQuantity,
        unidade_medida,
        data_entrada,
        observacoes || null
      ]
    );

    await connection.execute(
      `INSERT INTO movimentacoes_estoque
        (produto_id, tipo_movimentacao, quantidade, origem_motivo, responsavel, data_movimentacao, observacoes)
       VALUES (?, 'entrada', ?, ?, ?, ?, ?)`,
      [
        result.insertId,
        parsedQuantity,
        origem,
        doador_fornecedor || req.session.user.nome,
        data_entrada,
        observacoes || null
      ]
    );

    await connection.commit();

    return res.status(201).json({ success: true, message: 'Produto cadastrado e entrada registrada com sucesso.' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao cadastrar produto:', error);
    return res.status(500).json({ success: false, message: 'Erro ao cadastrar produto.' });
  } finally {
    connection.release();
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const {
    nome,
    categoria,
    origem,
    doador_fornecedor,
    quantidade,
    unidade_medida,
    data_entrada,
    observacoes
  } = req.body;

  const parsedQuantity = parsePositiveQuantity(quantidade);

  if (!nome || !categoria || !origem || !quantidade || !unidade_medida || !data_entrada) {
    return res.status(400).json({ success: false, message: 'Preencha os campos obrigatórios.' });
  }

  if (parsedQuantity < 0) {
    return res.status(400).json({ success: false, message: 'A quantidade não pode ser negativa.' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE produtos
       SET nome = ?, categoria = ?, origem = ?, doador_fornecedor = ?, quantidade = ?,
           unidade_medida = ?, data_entrada = ?, observacoes = ?
       WHERE id = ?`,
      [
        nome,
        categoria,
        origem,
        doador_fornecedor || null,
        parsedQuantity,
        unidade_medida,
        data_entrada,
        observacoes || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
    }

    return res.json({ success: true, message: 'Produto atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ success: false, message: 'Erro ao atualizar produto.' });
  }
}

async function deleteProduct(req, res) {
  try {
    const [result] = await pool.execute('DELETE FROM produtos WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
    }

    return res.json({ success: true, message: 'Produto excluído com sucesso.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Este produto possui movimentações e não pode ser excluído.'
      });
    }

    console.error('Erro ao excluir produto:', error);
    return res.status(500).json({ success: false, message: 'Erro ao excluir produto.' });
  }
}

async function registerProductExit(req, res) {
  const { quantidade, motivo, responsavel, data_saida, observacoes } = req.body;
  const parsedQuantity = parsePositiveQuantity(quantidade);

  if (!quantidade || !motivo || !responsavel || !data_saida) {
    return res.status(400).json({ success: false, message: 'Preencha os campos obrigatórios da saída.' });
  }

  if (parsedQuantity <= 0) {
    return res.status(400).json({ success: false, message: 'A quantidade de saída deve ser maior que zero.' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [products] = await connection.execute(
      'SELECT id, nome, quantidade FROM produtos WHERE id = ? FOR UPDATE',
      [req.params.id]
    );

    const product = products[0];

    if (!product) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
    }

    if (Number(product.quantidade) < parsedQuantity) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Estoque insuficiente. Disponível: ${product.quantidade}.`
      });
    }

    await connection.execute(
      'UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?',
      [parsedQuantity, req.params.id]
    );

    await connection.execute(
      `INSERT INTO movimentacoes_estoque
        (produto_id, tipo_movimentacao, quantidade, origem_motivo, responsavel, data_movimentacao, observacoes)
       VALUES (?, 'saida', ?, ?, ?, ?, ?)`,
      [req.params.id, parsedQuantity, motivo, responsavel, data_saida, observacoes || null]
    );

    await connection.commit();

    return res.status(201).json({ success: true, message: 'Saída registrada com sucesso.' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao registrar saída:', error);
    return res.status(500).json({ success: false, message: 'Erro ao registrar saída.' });
  } finally {
    connection.release();
  }
}

module.exports = {
  listProducts,
  getProduct,
  getProductSummary,
  createProduct,
  updateProduct,
  deleteProduct,
  registerProductExit
};
