CREATE DATABASE IF NOT EXISTS projeto_resgate;

USE projeto_resgate;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo_usuario VARCHAR(20) NOT NULL DEFAULT 'administrador',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'projeto_resgate'
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'tipo_usuario'
);

SET @alter_usuarios = IF(
  @column_exists = 0,
  'ALTER TABLE usuarios ADD COLUMN tipo_usuario VARCHAR(20) NOT NULL DEFAULT ''administrador''',
  'SELECT ''Coluna tipo_usuario ja existe'' AS status'
);

PREPARE stmt FROM @alter_usuarios;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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
);

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'projeto_resgate'
    AND TABLE_NAME = 'produtos'
    AND COLUMN_NAME = 'origem'
);

SET @alter_produtos_origem = IF(
  @column_exists = 0,
  'ALTER TABLE produtos ADD COLUMN origem VARCHAR(30) NOT NULL DEFAULT ''doacao'' AFTER categoria',
  'SELECT ''Coluna origem ja existe'' AS status'
);

PREPARE stmt FROM @alter_produtos_origem;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'projeto_resgate'
    AND TABLE_NAME = 'produtos'
    AND COLUMN_NAME = 'doador_fornecedor'
);

SET @alter_produtos_doador = IF(
  @column_exists = 0,
  'ALTER TABLE produtos ADD COLUMN doador_fornecedor VARCHAR(100) NULL AFTER origem',
  'SELECT ''Coluna doador_fornecedor ja existe'' AS status'
);

PREPARE stmt FROM @alter_produtos_doador;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
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
);

INSERT INTO usuarios (nome, usuario, senha, tipo_usuario)
VALUES ('Administrador', 'admin', '123456', 'administrador')
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  senha = VALUES(senha),
  tipo_usuario = VALUES(tipo_usuario);
