const app = require('express')();
const consign = require('consign');
const knex = require('knex');
const uuid = require('uuidv4');
const winston = require('winston');
const knexfile = require('../knexfile');

app.db = knex(knexfile[process.env.NODE_ENV]);

app.log = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({ format: winston.format.json({ space: 1 }) }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'warn',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json({ space: 1 }))
    })
  ]
});

consign({ cwd: 'src', verbose: false })
  .include('./config/passport.js')
  .then('./config/middlewares.js')
  .then('./services')
  .then('./routes')
  .then('./config/router.js')
  .into(app);

app.get('/', (req, res) => {
  res.status(200).send();
});

app.use((err, req, res, next) => {
  const { name, message, stack } = err;
  if (name === 'ValidationError') res.status(400).json({ error: message });
  else if (name === 'RecursoIndevidoError') res.status(403).json({ error: message });
  else {
    const id = uuid();
    app.log.error({ id, name, message, stack });
    // Não deve logar detalhes dos erros para o usuário
    res.status(500).json({ id, error: 'Erro interno do servidor!' });
  }
  next(err);
});

// Loga as consultas feitas ao banco de dados
/* app.db.on('query', (query) => {
  console.log({ sql: query.sql, bindings: query.bindings ? query.bindings.join(',') : '' });
}).on('query-response', (res) => console.log(res)); */

module.exports = app;
