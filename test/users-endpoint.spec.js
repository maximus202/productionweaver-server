const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe.only('Users endpoint', function () {
    let db

    //Make Knex instance before all tests in this file.
    before('make Knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    //Disconnect from db after all tests in this file.
    after('disconnect from db', () => db.destroy())

    //Remove data from users table before all tests in this file.
    before('clean the tables', () => helpers.cleanTables(db))

    describe('GET /api/users', () => {
        //Tests for when there aren't users in the db
        context('given there are no users in the database', () => {
            it('GET /users responds with 200 and all users', () => {
                return supertest(app)
                    .get('/api/users')
                    .expect(200, [])
            })
        })

        //Tests for when there are users in the db
        context('given there are users in the database', () => {
            const testUsers = [
                {
                    id: 1,
                    first_name: 'Martin',
                    last_name: 'Scorsese',
                    email: 'mscorsese@studio.com',
                    password: 'taxidriver',
                    date_created: '2029-01-22T16:28:32.615Z'
                },
                {
                    id: 2,
                    first_name: 'Alfred',
                    last_name: 'Hitchcock',
                    email: 'ahitchcock@studio.com',
                    password: 'psycho',
                    date_created: '2001-01-22T16:28:32.615Z'
                },
                {
                    id: 3,
                    first_name: 'Ridley',
                    last_name: 'Scott',
                    email: 'rscott@studio.com',
                    password: 'themartian',
                    date_created: '2001-01-28T16:28:32.615Z'
                },
                {
                    id: 4,
                    first_name: 'James',
                    last_name: 'Cameron',
                    email: 'jcameron@studio.com',
                    password: 'avatar',
                    date_created: '1992-07-22T16:28:32.615Z'
                },
                {
                    id: 5,
                    first_name: 'Quentin',
                    last_name: 'Tarantino',
                    email: 'qtarantino@studio.com',
                    password: 'reservoirdogs',
                    date_created: '1999-07-02T16:28:32.615Z'
                },
            ];

            //Inserts testUsers into users table before each test in this context block
            beforeEach('insert users', () => {
                return db
                    .into('productionweaver_users')
                    .insert(testUsers)
            })

            it('GET /users responds with 200 and all users', () => {
                return supertest(app)
                    .get('/api/users/')
                    .expect(200, testUsers)
            })
        })
    })
})