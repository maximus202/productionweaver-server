const ScenesService = {
    getAllScenes(knex) {
        return knex
            .select('*')
            .from('productionweaver_scenes')
    },
    insertScene(knex, newScene) {
        return knex('productionweaver_scenes')
            .insert(newScene)
            .returning('*')
            .then(newRow => {
                return newRow[0]
            })
    }
}

module.exports = ScenesService