const moment = require('moment');

exports.seed = (knex) => knex('users').insert([
  { id: 10100, name: 'User for balance #1', email: 'user123@mail.com', passwd: '$2a$10$8fZO8t7337U00aACrIRPguEl.GaH66BDMmou6pryh9fZGRJ2sZGVa' },
  { id: 10101, name: 'User for balance #2', email: 'user456@mail.com', passwd: '$2a$10$8fZO8t7337U00aACrIRPguEl.GaH66BDMmou6pryh9fZGRJ2sZGVa' },
  { id: 10102, name: 'User for balance #3', email: 'user789@mail.com', passwd: '$2a$10$8fZO8t7337U00aACrIRPguEl.GaH66BDMmou6pryh9fZGRJ2sZGVa' }
])
  .then(() => knex('accounts').insert([
    { id: 10100, name: 'Acc Saldo Principal', user_id: 10100 },
    { id: 10101, name: 'Acc Saldo Secundário', user_id: 10100 },
    { id: 10102, name: 'Acc Alternativa #1', user_id: 10101 },
    { id: 10103, name: 'Acc Alternativa #2', user_id: 10101 },
    { id: 10104, name: 'Acc Geral Principal', user_id: 10102 },
    { id: 10105, name: 'Acc Geral Secundário', user_id: 10102 }
  ]))
  .then(() => knex('transfers').insert([
    { id: 10100, description: 'Transfer #1', user_id: 10102, acc_ori_id: 10105, acc_dest_id: 10104, ammount: 256, date: new Date() },
    { id: 10101, description: 'Transfer #2', user_id: 10101, acc_ori_id: 10102, acc_dest_id: 10103, ammount: 512, date: new Date() }
  ]))
  .then(() => knex('transactions').insert([
    // Positive transaction // saldo = 2
    { description: '2', date: new Date(), ammount: 2, type: 'I', acc_id: 10104, status: true },
    // Transaction wrong user // saldo = 2
    { description: '2', date: new Date(), ammount: 2, type: 'I', acc_id: 10102, status: true },
    // Transaction another acccount // saldo = 2 // saldo = 8
    { description: '2', date: new Date(), ammount: 8, type: 'I', acc_id: 10105, status: true },
    // Pending transaction // saldo = 2 // saldo = 8
    { description: '2', date: new Date(), ammount: 16, type: 'I', acc_id: 10104, status: false },
    // Past transaction // saldo = 34 // saldo = 8
    { description: '2', date: moment().subtract({ days: 5 }), ammount: 32, type: 'I', acc_id: 10104, status: true },
    // Future transaction // saldo = 34 // saldo = 8
    { description: '2', date: moment().add({ days: 5 }), ammount: 64, type: 'I', acc_id: 10104, status: true },
    // Negative transaction // saldo = 162 // saldo = -248
    { description: '2', date: new Date(), ammount: -128, type: 'O', acc_id: 10104, status: true },
    // Transf // Saldo
    { description: '2', date: new Date(), ammount: 256, type: 'I', acc_id: 10104, status: true },
    { description: '2', date: new Date(), ammount: -256, type: 'O', acc_id: 10105, status: true },
    // Other trans
    { description: '2', date: new Date(), ammount: 512, type: 'I', acc_id: 10102, status: true },
    { description: '2', date: new Date(), ammount: -512, type: 'O', acc_id: 10103, status: true }
  ]));
