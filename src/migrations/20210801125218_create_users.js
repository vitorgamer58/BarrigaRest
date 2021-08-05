/* eslint-disable no-unused-vars */
/* eslint-disable func-names */
exports.up = function (knex, Promise) {
  return knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('name').notNull();
    t.string('email').notNull().unique();
    t.string('passwd').notNull();
  }).then((result) => console.log(result));
};

exports.down = (knex) => knex.schema.dropTable('users');
