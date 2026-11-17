const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  console.log('Tentando conectar com:');
  console.log('  host:', process.env.DB_HOST);
  console.log('  port:', process.env.DB_PORT);
  console.log('  user:', process.env.DB_USER);
  console.log('  password definida:', process.env.DB_PASSWORD ? 'sim' : 'nao');

  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    console.log('Conexao bem sucedida!');
    await conn.end();
  } catch (err) {
    console.error('Erro:', err.message);
    console.error('Code:', err.code);
  }
}

test();
