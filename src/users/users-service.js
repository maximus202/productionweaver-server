const UsersService = {
    getAllUsers(knex) {
        return knex
            .select('*')
            .from('productionweaver_users')
    },
    getById(knex, user_id) {
        return knex
            .from('productionweaver_users')
            .select('*')
            .where('id', user_id)
            .first()
    },
};

module.exports = UsersService