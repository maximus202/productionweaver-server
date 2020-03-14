const ProductionsService = {
    getAllProductions(knex) {
        return knex
            .select('*')
            .from('productionweaver_productions')
    },
    getById(knex, production_id) {
        return knex
            .from('productionweaver_productions')
            .select('*')
            .where('id', production_id)
            .then(row => {
                return row[0]
            })
    },
    insertProduction(knex, newProduction) {
        return knex
            .insert(newProduction)
            .into('productionweaver_productions')
            .returning('*')
            .then(newRow => {
                return newRow[0]
            })
    },
}

module.exports = ProductionsService