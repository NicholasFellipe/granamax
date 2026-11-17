const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await db.execute(`ALTER TABLE users ADD COLUMN birth_date DATE NULL`);
    console.log('✅ Coluna birth_date adicionada com sucesso!');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Coluna birth_date já existe, nada a fazer.');
    } else {
      throw err;
    }
  }

  await db.end();
  console.log('✅ Migração concluída.');
}

migrate().catch(err => {
  console.error('❌ Erro na migração:', err.message);
  process.exit(1);
});
