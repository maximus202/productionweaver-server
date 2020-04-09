/* eslint-disable camelcase */
const ScenesService = {
  getAllScenes(knex, user_id) {
    return knex
      .select('*')
      .from('productionweaver_scenes')
      .where('owner', user_id);
  },
  insertScene(knex, newScene) {
    return knex('productionweaver_scenes')
      .insert(newScene)
      .returning('*')
      .then((newRow) => newRow[0]);
  },
  getAllProductionScenes(knex, user_id, production_id) {
    return knex
      .select('*')
      .from('productionweaver_scenes')
      .where('owner', user_id)
      .where('production_id', production_id);
  },
  getById(knex, user_id, scene_id) {
    return knex
      .select('*')
      .from('productionweaver_scenes')
      .where('owner', user_id)
      .where('id', scene_id);
  },
};

module.exports = ScenesService;
