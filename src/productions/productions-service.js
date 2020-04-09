/* eslint-disable camelcase */
const ProductionsService = {
  getAllProductions(knex, user_id) {
    return knex
      .select('*')
      .from('productionweaver_productions')
      .where('owner', user_id);
  },
  getById(knex, user_id, production_id) {
    return knex
      .from('productionweaver_productions')
      .select('*')
      .where('id', production_id)
      .where('owner', user_id)
      .then((row) => row[0]);
  },
  insertProduction(knex, newProduction) {
    return knex
      .insert(newProduction)
      .into('productionweaver_productions')
      .returning('*')
      .then((newRow) => newRow[0]);
  },
};

module.exports = ProductionsService;
