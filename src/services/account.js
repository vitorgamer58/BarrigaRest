/* eslint-disable arrow-body-style */
const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const findAll = (userId) => {
    return app.db('accounts').where({ user_id: userId });
  };

  const find = (filter = {}) => {
    return app.db('accounts').where(filter).first();
  };

  const save = async (account) => {
    if (!account.name) throw new ValidationError('Nome é um atributo obrigatório');
    const accDb = await find({ name: account.name, user_id: account.user_id });
    if (accDb) throw new ValidationError('Já existe uma conta com esse nome');
    // Está inserindo qualquer dado que vem do usuário no banco
    // TODO: Fazer uma validação melhor destes dados
    return app.db('accounts').insert(account, '*');
  };

  const update = (id, account) => {
    return app.db('accounts')
      .where({ id })
      .update(account, '*');
  };

  const remove = async (id) => {
    const transaction = await app.services.transaction.findOne({ acc_id: id });
    if (transaction) throw new ValidationError('This account have associated transactions');

    return app.db('accounts')
      .where({ id })
      .del();
  };

  return { save, findAll, find, update, remove };
};
