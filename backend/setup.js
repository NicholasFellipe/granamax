const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
  // Primeiro conectar sem banco para criá-lo
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  console.log('✅ Conectado ao MySQL');

  await conn.execute(`CREATE DATABASE IF NOT EXISTS granamax CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log('✅ Banco granamax criado/verificado');
  await conn.end();

  // Reconectar já com o banco selecionado
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'granamax',
  });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      is_pro BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabela users criada/verificada');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type ENUM('income', 'expense') NOT NULL,
      category VARCHAR(100) NOT NULL,
      date DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Tabela transactions criada/verificada');

  await db.end();
  console.log('🎉 Setup concluído! Banco de dados pronto.');
}

setup().catch(err => {
  console.error('❌ Erro no setup:', err.message);
  process.exit(1);
});
