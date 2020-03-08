const UsersService = {
    getAllUsers(knex) {
        return knex.select('*').from('productionweaver_users')
    }
}

module.exports = UsersService