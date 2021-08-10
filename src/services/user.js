/* eslint-disable no-else-return */
module.exports = (app) => {
  const findAll = (filter = {}) => app.db('users').where(filter).select();

  const save = async (user) => {
    if (!user.name) return { error: 'Nome é um atributo obrigatório' };
    if (!user.email) return { error: 'Email é um atributo obrigatório' };
    if (!user.passwd) return { error: 'Senha é um atributo obrigatório' };

    const userDB = await findAll({ email: user.email });
    if (userDB.length > 0) return { error: 'Já existe um usuário com este email' };

    return app.db('users').insert(user, '*');
  };

  return { findAll, save };
};
