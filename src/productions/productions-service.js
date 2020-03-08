const ProductionsService = {
    getAllProductions(knex) {
        return knex.select('*').from('productionweaver_productions')
    },
}

module.exports = ProductionsService