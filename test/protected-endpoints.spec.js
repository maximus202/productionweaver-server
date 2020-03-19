const knex = require('knex')
const app = require('../src/app')
const helpers = require('../test/test-helpers')
const jwt = require('jsonwebtoken')

describe('Protected endpoints', () => {
    let db

    //test users
    const testUsers = [
        {
            id: 1,
            first_name: 'Kevin',
            last_name: 'Feige',
            email: 'kfeige@marvel.com',
            password: 'Kevin',
            date_created: '2029-01-22T16:28:32.615Z'
        },
        {
            id: 2,
            first_name: 'Alfred',
            last_name: 'Hitchcock',
            email: 'ahitchcock@studio.com',
            password: 'Alfred',
            date_created: '2001-01-22T16:28:32.615Z'
        },
        {
            id: 3,
            first_name: 'Ridley',
            last_name: 'Scott',
            email: 'rscott@studio.com',
            password: 'Ridley',
            date_created: '2001-01-28T16:28:32.615Z'
        },
    ]

    //test productions
    const testProductions = [
        {
            id: 1,
            production_title: 'Parasite',
            date_created: '2029-01-22T16:28:32.615Z',
            owner: 1
        },
        {
            id: 2,
            production_title: 'Midsommar',
            date_created: '2011-01-22T16:28:32.615Z',
            owner: 2
        },
        {
            id: 3,
            production_title: 'Avengers: Endgame',
            date_created: '2009-01-22T16:28:32.615Z',
            owner: 2
        },
    ]

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('cleanup', () => helpers.cleanTables(db))

    afterEach('cleanup', () => helpers.cleanTables(db))

    beforeEach('insert users', () => {
        return db
            .insert(testUsers)
            .into('productionweaver_users')
    })

    beforeEach('insert productions', () => {
        return db
            .insert(testProductions)
            .into('productionweaver_productions')
    })

    const protectedEndpoints = [
        {
            name: 'GET /api/productions/',
            path: '/api/productions/',
            method: supertest(app).get,
        },
        {
            name: 'POST /api/productions/',
            path: '/api/productions/',
            method: supertest(app).post,
        },
        {
            name: 'GET /api/scenes/',
            path: '/api/scenes/',
            method: supertest(app).get,
        },
        {
            name: 'POST /api/scenes/:production_id',
            path: '/api/scenes/1',
            method: supertest(app).post,
        },
        {
            name: 'GET /api/elements/',
            path: '/api/elements/',
            method: supertest(app).get,
        },
        {
            name: 'GET /api/elements/:element_id',
            path: '/api/elements/1',
            method: supertest(app).get,
        },
        {
            name: 'PATCH /api/elements/:element_id',
            path: '/api/elements/1',
            method: supertest(app).patch,
        },
        {
            name: 'POST /api/elements/:production_id/:scene_id',
            path: '/api/elements/1/1',
            method: supertest(app).post,
        },
    ]

    protectedEndpoints.forEach(endpoint => {
        describe(endpoint.name, () => {
            it('responds with 401 and "missing bearer token" when no bearer token', () => {
                return endpoint.method(endpoint.path)
                    .expect(401, { error: { message: 'missing bearer token' } })
            })

            it.only('responds 401 "unauthorized request" when invalid JWT secret', () => {
                const validUser = testUsers[0]
                const invalidSecret = 'bad-secret'
                const token = jwt.sign({ user_id: validUser.id }, invalidSecret, { subject: validUser.email, algorithm: 'HS256' })
                return endpoint.method(endpoint.path)
                    .set('Authorization', `bearer ${token}`)
                    .expect(401, { error: { message: 'Unauthorized request' } })
            })
        })
    })
})