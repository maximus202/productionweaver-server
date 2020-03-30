const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const jwt = require('jsonwebtoken')

describe('Productions endpoint', () => {
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

    //Malicious production for testing xss attacks
    const maliciousProduction = {
        id: 1,
        production_title: 'Malicious first name <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        date_created: '2009-01-22T16:28:32.615Z',
        owner: 1
    }

    //Sanitized malicious production
    const sanitizedMaliciousProduction = {
        id: 1,
        production_title: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
        date_created: '2009-01-22T16:28:32.615Z',
        owner: 1
    }

    //new productions
    const newProductionWithNoTitle = {
        owner: 1
    }
    const validNewProduction = {
        production_title: 'Taxi Driver 2',
        owner: 1
    }

    //make knex instance
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    //Disconnect from db after all tests in this file.
    after('disconnect from db', () => db.destroy())

    //Remove data from users table before all tests in this file.
    before('clean the tables before all tests', () => helpers.cleanTables(db))

    //Remove data from users table after each test in this block
    afterEach('clean the tables after each test', () => helpers.cleanTables(db))

    function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
        const token = jwt.sign({ id: user.id }, secret, { subject: user.email, algorithm: 'HS256' })
        return `bearer ${token}`
    }

    describe('GET /api/productions', () => {
        context('given productions do not exist', () => {
            beforeEach('insert users', () => {
                return db
                    .into('productionweaver_users')
                    .insert(testUsers)
            })
            it('responds with 404 and error message', () => {
                return supertest(app)
                    .get('/api/productions/')
                    .set('Authorization', makeAuthHeader(testUsers[2]))
                    .expect(404, { error: { message: 'No productions found.' } })
            })
        })
        context('given productions exist', () => {
            const expectedProduction = [{
                id: 1,
                production_title: 'Parasite',
                date_created: '2029-01-22T16:28:32.615Z',
                owner: 1
            }]
            beforeEach('insert users', () => {
                return db
                    .into('productionweaver_users')
                    .insert(testUsers)
            })
            beforeEach('insert productions', () => {
                return db
                    .into('productionweaver_productions')
                    .insert(testProductions)
            })
            it('responds with 200 and all productions', () => {
                return supertest(app)
                    .get('/api/productions/')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(200, expectedProduction)
            })

        })
        context('given XSS attack', () => {
            beforeEach('insert users', () => {
                return db
                    .into('productionweaver_users')
                    .insert(testUsers)
            })
            beforeEach('insert productions', () => {
                return db
                    .into('productionweaver_productions')
                    .insert(maliciousProduction)
            })
            it('removes XSS attack', () => {
                return supertest(app)
                    .get('/api/productions')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].id).to.eql(sanitizedMaliciousProduction.id)
                        expect(res.body[0].production_title).to.eql(sanitizedMaliciousProduction.production_title)
                        expect(res.body[0].date_created).to.eql(sanitizedMaliciousProduction.date_created)
                        expect(res.body[0].owner).to.eql(sanitizedMaliciousProduction.owner)
                    })
            })
        })
    })

    describe('POST /api/productions', () => {
        context('given fields are missing', () => {
            beforeEach('insert users', () => {
                return db
                    .insert(testUsers)
                    .into('productionweaver_users')
            })

            it('responds with 400 and an error message when production_title is missing', () => {
                return supertest(app)
                    .post('/api/productions/')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(newProductionWithNoTitle)
                    .expect(400, { error: { message: 'production_title missing in request body' } })
            })
        })
        context('given a valid request', () => {
            beforeEach('insert users', () => {
                return db
                    .insert(testUsers)
                    .into('productionweaver_users')
            })
            it('responds with 201 and the new production', () => {
                return supertest(app)
                    .post('/api/productions')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(validNewProduction)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.production_title).to.eql(validNewProduction.production_title)
                        expect(res.body.owner).to.eql(validNewProduction.owner)
                    })
            })
        })
        context('given an XSS attack', () => {
            beforeEach('add users', () => {
                return db
                    .insert(testUsers)
                    .into('productionweaver_users')
            })
            it('removes XSS attack', () => {
                return supertest(app)
                    .post('/api/productions')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(maliciousProduction)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.production_title).to.eql(sanitizedMaliciousProduction.production_title)
                        expect(res.body.owner).to.eql(sanitizedMaliciousProduction.owner)
                    })
            })
        })
    })
})