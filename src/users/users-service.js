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
    insertNewUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('productionweaver_users')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
};

module.exports = UsersService