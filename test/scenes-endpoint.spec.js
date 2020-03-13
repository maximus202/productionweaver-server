const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('scenes endpoint', () => {
    let db

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
        },
    ]

    const testScenes = [
        {
            id: 1,
            setting: 'EXT.',
            location: 'Jungle Road',
            time_of_day: 'DAY',
            short_summary: 'opening',
            date_created: '1986-01-22T16:28:32.615Z',
            production_id: 1
        },
        {
            id: 2,
            setting: 'EXT.',
            location: 'The Beach',
            time_of_day: 'DAY',
            short_summary: 'Family arrives at beach.',
            date_created: '1989-01-22T16:28:32.615Z',
            production_id: 1
        },
        {
            id: 3,
            setting: 'EXT.',
            location: 'Far down the beach',
            time_of_day: 'DAY',
            short_summary: 'Tina explores the jungle and gets bitten by a strange lizard',
            date_created: '1989-01-22T16:28:32.615Z',
            production_id: 1
        },
    ]

    const maliciousScene = {
        id: 1,
        setting: 'EXT.',
        location: 'Jungle Road',
        time_of_day: 'DAY',
        short_summary: 'Malicious first name <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        date_created: '1986-01-22T16:28:32.615Z',
        production_id: 1
    }

    const sanitizedScene = {
        id: 1,
        setting: 'EXT.',
        location: 'Jungle Road',
        time_of_day: 'DAY',
        short_summary: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
        date_created: '1986-01-22T16:28:32.615Z',
        production_id: 1
    }

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

    describe('GET /api/scenes', () => {
        context('given scenes do not exist', () => {
            it('responds with 404 and message', () => {
                return supertest(app)
                    .get('/api/scenes')
                    .expect(404, { error: { message: 'No scenes found.' } })
            })
        })
        context('given scenes exist', () => {
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
            beforeEach('insert scenes', () => {
                return db
                    .into('productionweaver_scenes')
                    .insert(testScenes)
            })
            it('responds with 200 and list of scenes', () => {
                return supertest(app)
                    .get('/api/scenes')
                    .expect(200, testScenes)
            })
        })
        context('given an XSS attack', () => {
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
            beforeEach('insert malicious scene', () => {
                return db
                    .into('productionweaver_scenes')
                    .insert(maliciousScene)
            })
            it('removes XSS attack', () => {
                return supertest(app)
                    .get('/api/scenes')
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].short_summary).to.eql(sanitizedScene.short_summary)
                    })
            })
        })
    })
})