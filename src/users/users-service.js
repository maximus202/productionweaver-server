/* eslint-disable camelcase */
const bcrypt = require('bcryptjs');

const hashPassword = (password) => bcrypt.hash(password, 10);

const UsersService = {
  getAllUsers(knex) {
    return knex
      .select('*')
      .from('productionweaver_users');
  },
  getById(knex, user_id) {
    return knex
      .from('productionweaver_users')
      .select('*')
      .where('id', user_id)
      .first();
  },
  insertNewUser(knex, newUser) {
    return hashPassword(newUser.password)
      .then((hash) => knex
        .insert({
          ...newUser,
          password: hash,
        })
        .into('productionweaver_users')
        .returning('*'))
      .then((rows) => rows[0]);
  },
  updateUser(knex, id, updatedUser) {
    return knex('productionweaver_users')
      .where({ id })
      .update(updatedUser);
  },
  deleteUser(knex, id) {
    return knex('productionweaver_users')
      .where({ id })
      .delete();
  },
};

module.exports = UsersService;
