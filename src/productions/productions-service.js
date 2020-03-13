const ProductionsService = {
    getAllProductions(knex) {
        return knex
            .select('*')
            .from('productionweaver_productions')
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