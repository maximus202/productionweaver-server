const knex = require('knex')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const helpers = require('../test/test-helpers')

describe.only('Auth endpoints', () => {
    let db

    const testUsers = [
        {
            id: 1,
            first_name: 'Martin',
            last_name: 'Scorsese',
            email: 'mscorsese@studio.com',
            password: 'Martin',
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

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    //Remove data from users table before all tests in this file.
    before('clean the tables before all tests', () => helpers.cleanTables(db))

    //Remove data from users table after each test in this block
    afterEach('clean the tables after each test', () => helpers.cleanTables(db))

    describe('POST /api/auth/login', () => {
        beforeEach('insert users', () => {
            return db
                .insert(testUsers)
                .into('productionweaver_users')
        })
        context('given no username or password in request', () => {
            it('responds with 400 and error if request is missing username', () => {
                const requestWithoutUsername = {
                    password: 'existy'
                }
                return supertest(app)
                    .post(`/api/auth/login`)
                    .send(requestWithoutUsername)
                    .expect(400, {
                        error: {
                            message: 'missing username or password in request body'
                        }
                    })
            })
            it('responds with 400 and error if request is missing a password', () => {
                const requestWithoutPassword = {
                    email: 'kfeige@marvel.com'
                }
                return supertest(app)
                    .post('/api/auth/login')
                    .send(requestWithoutPassword)
                    .expect(400, {
                        error: {
                            message: 'missing username or password in request body'
                        }
                    })
            })
        })

        context('given username does not exist', () => {
            it('responds with 400 and error message', () => {
                const invalidUsername = { email: 'bad@bad.com', password: 'existy' }
                return supertest(app)
                    .post('/api/auth/login')
                    .send(invalidUsername)
                    .expect(400, {
                        error: {
                            message: 'incorrect username or password'
                        }
                    })
            })
        })

        context('given username is correct, password is incorrect', () => {
            it('responds with 400 and error message', () => {
                const invalidPassword = {
                    email: 'mscorsese@studio.com',
                    password: 'incorrect'
                }
                return supertest(app)
                    .post('/api/auth/login')
                    .send(invalidPassword)
                    .expect(400, {
                        error: {
                            message: 'incorrect username or password'
                        }
                    })
            })
        })

        context('given username and password is correct', () => {
            it('responds with 200 and JWT auth token using secret', () => {
                const validUsernamePassword = {
                    email: testUsers[0].email,
                    password: testUsers[0].password
                }
                const expectedToken = jwt.sign(
                    { id: testUsers.id },
                    process.env.JWT_SECRET,
                    {
                        subject: testUsers[0].email,
                        algorithm: 'HS256'
                    }
                )
                return supertest(app)
                    .post('/api/auth/login')
                    .send(validUsernamePassword)
                    .then(res => {
                        console.log(validUsernamePassword)
                        console.log(`Log: ${res}`)
                    })
            })
        })
    })
})