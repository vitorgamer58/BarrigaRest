require('dotenv/config');

module.exports = {
  test: {
    client: 'pg',
    version: '13',
    connection: {
      host: 'investimentos.notasdovitor.top',
      user: 'postgres',
      password: process.env.DB_PASSWORD,
      database: 'barriga',
    },
    migrations: {
      directory: 'src/migrations',
    },
  },
};
