const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe.only('Users endpoint', function () {
    let db

    //testUsers to use for tests
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

    const maliciousUser = {
        id: 1,
        first_name: 'Malicious first name <script>alert("xss");</script>',
        last_name: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        email: 'email@kasdfoandf.com',
        password: 'helloimfriendly',
        date_created: new Date().toISOString()
    }

    const sanitizedMaliciousUser = {
        id: 1,
        first_name: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        last_name: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
        email: 'email@kasdfoandf.com',
        password: 'helloimfriendly'
    }

    const userWithMissingFirstName = {
        last_name: 'Howard',
        email: 'rhoward@studio.com',
        password: 'ladyinthewater'
    }

    const userwithMissingLastName = {
        first_name: 'Frank',
        email: 'fmiller@studio.com',
        password: 'madmax'
    }

    const userwithMissingEmail = {
        first_name: 'Todd',
        last_name: 'Phillips',
        password: 'joker'
    }

    const userWithMissingPassword = {
        first_name: 'Christopher',
        last_name: 'Nolan',
        email: 'cnolan@studio.com',
    }

    const newUser = {
        first_name: 'Leigh',
        last_name: 'Wannell',
        email: 'lwannell@studio.com',
        password: 'upgrade'
    }

    const updateUserWithMissingFields = {}

    const updateUser = {
        first_name: 'Kevyn',
        last_name: 'Feige'
    }

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

    //Remove data from users table after each test in this block
    afterEach('clean the tables', () => helpers.cleanTables(db))

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
            //Inserts testUsers into users table before each test in this context block
            beforeEach('insert users', () => {
                return db
                    .into('productionweaver_users')
                    .insert(testUsers)
            })

            it('responds with 200 and all users', () => {
                return supertest(app)
                    .get('/api/users')
                    .expect(200, testUsers)
            })

            context('given an XSS attack', () => {
                it('removes XSS attack', () => {
                    return supertest(app)
                        .get('/api/users')
                        .expect(200)
                        .expect(res => {
                            expect(res.body[0].id).to.eql(testUsers[0].id)
                            expect(res.body[0].first_name).to.eql(testUsers[0].first_name)
                            expect(res.body[0].last_name).to.eql(testUsers[0].last_name)
                            expect(res.body[0].email).to.eql(testUsers[0].email)
                            expect(res.body[0].password).to.eql(testUsers[0].password)
                            expect(res.body[0].date_created).to.eql(testUsers[0].date_created)
                        })
                })
            })
        })
    })

    describe('GET /api/users/:user_id', () => {
        context('given there are no users in the database', () => {
            it('responds with 404', () => {
                const user_id = 123456
                return supertest(app)
                    .get(`/api/users/${user_id}`)
                    .expect(404, { error: { message: `User not found.` } })
            })
        })

        context('given there are users in the database', () => {
            //Inserts testUsers into users table before each test in this context block
            beforeEach('insert users', () => {
                return db
                    .into('productionweaver_users')
                    .insert(testUsers)
            })

            it('responds with 404 and user not found if user_id is invalid', () => {
                const user_id = 123456
                return supertest(app)
                    .get(`/api/users/${user_id}`)
                    .expect(404, { error: { message: `User not found.` } })
            })

            it('responds with 200 and requested user', () => {
                const user_id = 1
                return supertest(app)
                    .get(`/api/users/${user_id}`)
                    .expect(200, testUsers[0])
            })

            context('given an XSS attack', () => {
                it('removes XSS attack', () => {
                    const user_id = 1
                    return supertest(app)
                        .get(`/api/users/${user_id}`)
                        .expect(res => {
                            expect(res.body.id).to.eql(testUsers[0].id)
                            expect(res.body.first_name).to.eql(testUsers[0].first_name)
                            expect(res.body.last_name).to.eql(testUsers[0].last_name)
                            expect(res.body.email).to.eql(testUsers[0].email)
                            expect(res.body.password).to.eql(testUsers[0].password)
                            expect(res.body.date_created).to.eql(testUsers[0].date_created)
                        })
                })
            })
        })
    })

    describe('POST /api/users', () => {
        context('missing fields', () => {
            it('responds with 400 if first name is missing', () => {
                return supertest(app)
                    .post('/api/users')
                    .send(userWithMissingFirstName)
                    .expect(400, {
                        error: {
                            message: `first_name missing in request body`
                        }
                    })

            })
            it('responds with 400 if last name is missing', () => {
                return supertest(app)
                    .post('/api/users')
                    .send(userwithMissingLastName)
                    .expect(400, { error: { message: 'last_name missing in request body' } })
            })
            it('responds with 400 if email is missing', () => {
                return supertest(app)
                    .post('/api/users')
                    .send(userwithMissingEmail)
                    .expect(400, { error: { message: 'email missing in request body' } })
            })
            it('responds with 400 if password is missing', () => {
                return supertest(app)
                    .post('/api/users')
                    .send(userWithMissingPassword)
                    .expect(400, { error: { message: 'password missing in request body' } })
            })
        })

        context('valid credentials', () => {
            it('responds with 201 and new user', () => {
                return supertest(app)
                    .post('/api/users')
                    .send(newUser)
                    .expect(201)
                    .then(res => {
                        expect(res.body.first_name).to.eql(newUser.first_name)
                        expect(res.body.last_name).to.eql(newUser.last_name)
                        expect(res.body.email).to.eql(newUser.email)
                        expect(res.body.password).to.eql(newUser.password)
                    })
            })
        })

        context('XSS attack', () => {
            it('removes XSS attack', () => {
                return supertest(app)
                    .post('/api/users')
                    .send(maliciousUser)
                    .expect(201)
                    .then(res => {
                        expect(res.body.id).to.eql(sanitizedMaliciousUser.id)
                        expect(res.body.first_name).to.eql(sanitizedMaliciousUser.first_name)
                        expect(res.body.last_name).to.eql(sanitizedMaliciousUser.last_name)
                        expect(res.body.email).to.eql(sanitizedMaliciousUser.email)
                        expect(res.body.password).to.eql(sanitizedMaliciousUser.password)
                    })
            })
        })
    })

    describe('PATCH /api/users', () => {
        //Inserts testUsers into users table before each test in this context block
        beforeEach('insert users', () => {
            return db
                .into('productionweaver_users')
                .insert(testUsers)
        })

        context('User exists and first_name and last_name are missing', () => {
            it('responds with 404 not found', () => {
                const user_id = testUsers[0].id
                return supertest(app)
                    .patch(`/api/users/${user_id}`)
                    .send(updateUserWithMissingFields)
                    .expect(400)
            })
        })

        context('User exists and first_name and last_name are present', () => {
            it('responds with 204', () => {
                const user_id = testUsers[0].id
                return supertest(app)
                    .patch(`/api/users/${user_id}`)
                    .send(updateUser)
                    .expect(204)
            })
        })
    })

    describe('DELETE /api/users/:user_id', () => {
        beforeEach('insert users', () => {
            return db
                .into('productionweaver_users')
                .insert(testUsers)
        })

        context('User exists and request is successful', () => {
            it('responds with 200 and success message', () => {
                const user_id = testUsers[0].id
                return supertest(app)
                    .delete(`/api/users/${user_id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.success.message).to.eql('User successfully deleted')
                    })
            })
        })
    })
})