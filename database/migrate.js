const pool = require('./connection');

async function columnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [process.env.DB_NAME, tableName, columnName]
  );

  return rows[0].total > 0;
}

async function tableExists(tableName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?`,
    [process.env.DB_NAME, tableName]
  );

  return rows[0].total > 0;
}

async function ensureDatabaseSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      categoria VARCHAR(30) NOT NULL,
      origem VARCHAR(30) NOT NULL DEFAULT 'doacao',
      doador_fornecedor VARCHAR(100),
      quantidade DECIMAL(10, 2) NOT NULL,
      unidade_medida VARCHAR(20) NOT NULL,
      data_entrada DATE NOT NULL,
      observacoes TEXT,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  if (!(await columnExists('produtos', 'origem'))) {
    await pool.execute(
      "ALTER TABLE produtos ADD COLUMN origem VARCHAR(30) NOT NULL DEFAULT 'doacao' AFTER categoria"
    );
  }

  if (!(await columnExists('produtos', 'doador_fornecedor'))) {
    await pool.execute(
      'ALTER TABLE produtos ADD COLUMN doador_fornecedor VARCHAR(100) NULL AFTER origem'
    );
  }

  if (!(await tableExists('movimentacoes_estoque'))) {
    await pool.execute(`
      CREATE TABLE movimentacoes_estoque (
        id INT AUTO_INCREMENT PRIMARY KEY,
        produto_id INT NOT NULL,
        tipo_movimentacao VARCHAR(20) NOT NULL,
        quantidade DECIMAL(10, 2) NOT NULL,
        origem_motivo VARCHAR(100) NOT NULL,
        responsavel VARCHAR(100) NOT NULL,
        data_movimentacao DATE NOT NULL,
        observacoes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_movimentacoes_produtos
          FOREIGN KEY (produto_id) REFERENCES produtos(id)
          ON DELETE RESTRICT
      )
    `);
  }

  await pool.execute(`
    INSERT INTO movimentacoes_estoque
      (produto_id, tipo_movimentacao, quantidade, origem_motivo, responsavel, data_movimentacao, observacoes)
    SELECT p.id, 'entrada', p.quantidade, p.origem, COALESCE(p.doador_fornecedor, 'Migração inicial'),
           p.data_entrada, p.observacoes
    FROM produtos p
    WHERE p.quantidade > 0
      AND NOT EXISTS (
        SELECT 1
        FROM movimentacoes_estoque m
        WHERE m.produto_id = p.id
      )
  `);
}

module.exports = {
  ensureDatabaseSchema
};
