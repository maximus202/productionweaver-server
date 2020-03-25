const ElementsService = {
    getAllElements(knex, user_id) {
        return knex
            .select('*')
            .from('productionweaver_elements')
            .where('owner', user_id)
    },
    getById(knex, element_id, user_id) {
        return knex
            .select('*')
            .from('productionweaver_elements')
            .where('id', element_id)
            .where('owner', user_id)
    },
    insertElement(knex, newElement) {
        return knex('productionweaver_elements')
            .insert(newElement)
            .returning('*')
            .then(newRow => {
                return newRow[0]
            })
    },
    updateElement(knex, updateElement, element_id, user_id) {
        return knex('productionweaver_elements')
            .where('id', element_id)
            .where('owner', user_id)
            .update(updateElement)
            .returning('*')
            .then(newRow => {
                return newRow[0]
            })
    }
}

module.exports = ElementsService