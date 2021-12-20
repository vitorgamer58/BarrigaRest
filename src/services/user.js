/* eslint-disable consistent-return */
/* eslint-disable no-else-return */
const bcrypt = require('bcrypt-nodejs');

const ValidationError = require('../errors/ValidationError');

module.exports = (app) => {
  function validateEmail(email) {
    if (email) return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }

  const findAll = () => app.db('users').select(['id', 'name', 'email']);

  const findOne = (filter = {}) => app.db('users').where(filter).first();

  const getPasswdHash = (passwd) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(passwd, salt);
  };

  const save = async (user) => {
    const emailIsValid = validateEmail(user.email);
    if (!user.name) throw new ValidationError('Nome é um atributo obrigatório');
    if (!user.email) throw new ValidationError('Email é um atributo obrigatório');
    if (!user.passwd) throw new ValidationError('Senha é um atributo obrigatório');
    if (!emailIsValid) throw new ValidationError('Email inválido');

    const userDB = await findOne({ email: user.email });
    if (userDB) throw new ValidationError('Já existe um usuário com este email');

    const copyUser = { ...user };
    copyUser.passwd = getPasswdHash(user.passwd);
    return app.db('users').insert(copyUser, ['id', 'name', 'email']);
  };

  return { findAll, save, findOne };
};
