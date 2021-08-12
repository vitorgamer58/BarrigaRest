/* eslint-disable no-else-return */

const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  const findAll = (filter = {}) => app.db('users').where(filter).select();

  const save = async (user) => {
    if (!user.name) throw new ValidationError('Nome é um atributo obrigatório');
    if (!user.email) throw new ValidationError('Email é um atributo obrigatório');
    if (!user.passwd) throw new ValidationError('Senha é um atributo obrigatório');

    const userDB = await findAll({ email: user.email });
    if (userDB.length > 0) throw new ValidationError('Já existe um usuário com este email');

    return app.db('users').insert(user, '*');
  };

  return { findAll, save };
};
