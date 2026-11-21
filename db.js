// abre o banco SQLite e garante que as tabelas existem
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const arquivo = fileURLToPath(new URL('./melt.db', import.meta.url));
const db = new Database(arquivo);

db.pragma('foreign_keys = ON');
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

export default db;
