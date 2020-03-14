const ElementsService = {
    getAllElements(knex) {
        return knex
            .select('*')
            .from('productionweaver_elements')
    },
    getById(knex, element_id) {
        return knex
            .select('*')
            .from('productionweaver_elements')
            .where('id', element_id)
    }
}

module.exports = ElementsService