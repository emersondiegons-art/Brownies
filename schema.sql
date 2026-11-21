-- esquema do banco da MELT (SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL CHECK (length(trim(nome)) BETWEEN 3 AND 60),
    email TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    preco REAL NOT NULL CHECK (preco > 0),
    descricao TEXT NOT NULL DEFAULT '',
    cor TEXT,
    topo TEXT,
    selo TEXT,
    disponivel INTEGER NOT NULL DEFAULT 1 CHECK (disponivel IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL REFERENCES clientes (id),
    data_retirada TEXT NOT NULL,
    hora TEXT NOT NULL,
    obs TEXT NOT NULL DEFAULT '',
    total REAL NOT NULL CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'confirmado', 'entregue', 'cancelado')),
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS itens_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos (id),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario REAL NOT NULL CHECK (preco_unitario > 0),
    UNIQUE (pedido_id, produto_id)
);

-- consulta frequente: pedidos por data de retirada
CREATE INDEX IF NOT EXISTS idx_pedidos_data_retirada ON pedidos (data_retirada);
