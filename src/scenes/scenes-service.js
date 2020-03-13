const ScenesService = {
    getAllScenes(knex) {
        return knex
            .select('*')
            .from('productionweaver_scenes')
    }
}

module.exports = ScenesService