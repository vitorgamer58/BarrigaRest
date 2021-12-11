const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const find = (userId, filter = {}) => app.db('transactions')
    .join('accounts', 'accounts.id', 'acc_id')
    .where(filter)
    .andWhere('accounts.user_id', '=', userId)
    .select({
      id: 'transactions.id',
      ammount: 'transactions.ammount',
      description: 'transactions.description',
      account_name: 'accounts.name',
      status: 'transactions.status',
      type: 'transactions.type',
      transfer_id: 'transactions.transfer_id'
    });

  const findOne = (filter) => app.db('transactions').where(filter).first();

  const save = (transaction) => {
    // Validação dos dados
    if (!transaction.description) throw new ValidationError('description é um atributo obrigatório');
    if (!transaction.ammount) throw new ValidationError('ammount é um atributo obrigatório');
    if (!transaction.date) throw new ValidationError('date é um atributo obrigatório');
    if (!transaction.acc_id) throw new ValidationError('acc_id é um atributo obrigatório');
    if (!transaction.type) throw new ValidationError('type é um atributo obrigatório');
    if (!(transaction.type === 'I' || transaction.type === 'O')) throw new ValidationError('type é inválido');

    const transactionClone = { ...transaction };
    if ((transaction.type === 'I' && transaction.ammount < 0) || (transaction.type === 'O' && transaction.ammount > 0)) {
      transactionClone.ammount *= -1;
    }
    return app.db('transactions').insert(transactionClone, '*');
  };

  const update = (id, transaction) => app.db('transactions').where({ id }).update(transaction, '*');

  const remove = (id) => app.db('transactions').where({ id }).del();

  return { find, save, findOne, update, remove };
};
