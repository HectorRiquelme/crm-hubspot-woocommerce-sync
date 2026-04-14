const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'pipeline.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      hubspot_id TEXT UNIQUE,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      telefono TEXT,
      rut TEXT,
      comuna TEXT,
      region TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      woo_id INTEGER UNIQUE,
      contact_id TEXT NOT NULL,
      status TEXT NOT NULL,
      total_clp INTEGER NOT NULL,
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      hubspot_deal_id TEXT UNIQUE,
      order_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      monto_clp INTEGER NOT NULL,
      etapa TEXT NOT NULL,
      productos_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      detalle TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function reset() {
  db.exec(`
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS deals;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS contacts;
  `);
  init();
}

init();

module.exports = {
  db,
  init,
  reset,
  DB_PATH
};
