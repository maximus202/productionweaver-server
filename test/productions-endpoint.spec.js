const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Productions endpoint', () => {
    let db

    //test users
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
            owner: 3
        }
    ]

    //Malicious production for testing xss attacks
    const maliciousProduction = {
        id: 1,
        production_title: 'Malicious first name <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        date_created: new Date().toISOString(),
        owner: 1
    }

    //Sanitized malicious production
    const sanitizedMaliciousProduction = {
        id: 1,
        production_title: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
        owner: 1
    }

    //make knex instance
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    //Disconnect from db after all tests in this file.
    after('disconnect from db', () => db.destroy())

    //Remove data from users table before all tests in this file.
    before('clean the tables before all tests', () => helpers.cleanTables(db))

    //Remove data from users table after each test in this block
    afterEach('clean the tables after each test', () => helpers.cleanTables(db))

    describe('GET /api/productions', () => {
        context('given productions do not exist', () => {
            it('responds with 404 and error message', () => {
                return supertest(app)
                    .get('/api/productions/')
                    .expect(404, { error: { message: 'No productions found.' } })
            })
        })
        context('given productions exist', () => {
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
                    .expect(200, testProductions)
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
                    .insert(testProductions)
            })
            it('removes XSS attack', () => {
                return supertest(app)
                    .get('/api/productions')
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].id).to.eql(testProductions[0].id)
                        expect(res.body[0].production_title).to.eql(testProductions[0].production_title)
                        expect(res.body[0].date_created).to.eql(testProductions[0].date_created)
                        expect(res.body[0].owner).to.eql(testProductions[0].owner)
                    })
            })
        })
    })
})