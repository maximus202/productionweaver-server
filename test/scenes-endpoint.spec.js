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
            production_id: "1"
        },
        {
            id: 2,
            setting: 'EXT.',
            location: 'The Beach',
            time_of_day: 'DAY',
            short_summary: 'Family arrives at beach.',
            date_created: '1989-01-22T16:28:32.615Z',
            production_id: "1"
        },
        {
            id: 3,
            setting: 'EXT.',
            location: 'Far down the beach',
            time_of_day: 'DAY',
            short_summary: 'Tina explores the jungle and gets bitten by a strange lizard',
            date_created: '1989-01-22T16:28:32.615Z',
            production_id: "1"
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

    const sceneWithoutSetting = {
        location: 'Jungle Road',
        time_of_day: 'DAY',
        short_summary: 'summary'
    }

    const sceneWithoutLocation = {
        setting: 'EXT.',
        time_of_day: 'DAY',
        short_summary: 'summary'
    }

    const sceneWithoutTimeOfDay = {
        setting: 'EXT.',
        location: 'Jungle Road',
        short_summary: 'summary'
    }

    const sceneWithoutSummary = {
        setting: 'EXT.',
        location: 'Jungle Road',
        time_of_day: 'DAY'
    }

    const insertScene = {
        setting: 'EXT.',
        location: 'Jungle Road',
        time_of_day: 'DAY',
        short_summary: 'summary',
    }

    const insertMaliciousScene = {
        setting: 'EXT.',
        location: 'Jungle Road',
        time_of_day: 'DAY',
        short_summary: 'Malicious first name <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    }

    const sanitizedInsertedScene = {
        setting: 'EXT.',
        location: 'Jungle Road',
        time_of_day: 'DAY',
        short_summary: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
    }

    //create and return basic token
    function makeAuthHeader(user) {
        const token = Buffer.from(`${user.email}:${user.password}`).toString('base64')
        return `Basic ${token}`
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
        context('given basic token is missing', () => {
            it('responds with 401 and error message', () => {
                return supertest(app)
                    .get('/api/scenes/')
                    .expect(401, { error: { message: 'missing basic token' } })
            })
        })

        context(`given basic token does not have credentials`, () => {
            it('responds with 401 and error message', () => {
                const userNoCreds = { email: '', password: '' }
                return supertest(app)
                    .get('/api/scenes/')
                    .set('Authorization', makeAuthHeader(userNoCreds))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for a user that does not exist', () => {
            it('responds with 401 and error message', () => {
                const nonExistantUser = { email: 'invalid', password: 'existy' }
                return supertest(app)
                    .get('/api/scenes/')
                    .set('Authorization', makeAuthHeader(nonExistantUser))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for an existing user with the wrong password', () => {
            it('responds with 401 and error message', () => {
                const userWithInvalidPassword = { email: testUsers[0].email, password: 'wrong' }
                return supertest(app)
                    .get('/api/scenes/')
                    .set('Authorization', makeAuthHeader(userWithInvalidPassword))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given scenes do not exist', () => {
            beforeEach('insert users', () => {
                return db
                    .into('productionweaver_users')
                    .insert(testUsers)
            })
            it('responds with 400 and message', () => {
                return supertest(app)
                    .get('/api/scenes/')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(400, { error: { message: 'No scenes found.' } })
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
                    .set('Authorization', makeAuthHeader(testUsers[0]))
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
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].short_summary).to.eql(sanitizedScene.short_summary)
                    })
            })
        })
    })

    describe('POST /api/scenes/:production_id', () => {
        context('given basic token is missing', () => {
            it('responds with 401 and error message', () => {
                return supertest(app)
                    .post('/api/scenes/1')
                    .expect(401, { error: { message: 'missing basic token' } })
            })
        })

        context(`given basic token does not have credentials`, () => {
            it('responds with 401 and error message', () => {
                const userNoCreds = { email: '', password: '' }
                return supertest(app)
                    .post('/api/scenes/1')
                    .set('Authorization', makeAuthHeader(userNoCreds))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for a user that does not exist', () => {
            it('responds with 401 and error message', () => {
                const nonExistantUser = { email: 'invalid', password: 'existy' }
                return supertest(app)
                    .post('/api/scenes/1')
                    .set('Authorization', makeAuthHeader(nonExistantUser))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for an existing user with the wrong password', () => {
            it('responds with 401 and error message', () => {
                const userWithInvalidPassword = { email: testUsers[0].email, password: 'wrong' }
                return supertest(app)
                    .post('/api/scenes/1')
                    .set('Authorization', makeAuthHeader(userWithInvalidPassword))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        beforeEach('insert testUsers', () => {
            return db
                .insert(testUsers)
                .into('productionweaver_users')
        })
        beforeEach('insert testProductions', () => {
            return db
                .insert(testProductions)
                .into('productionweaver_productions')
        })
        context('given inputs are missing', () => {
            it('responds with 400 error and message when setting is missing', () => {
                return supertest(app)
                    .post(`/api/scenes/1`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(sceneWithoutSetting)
                    .expect(400, { error: { message: 'missing input in the request body' } })
            })
            it('responds with 400 error and message when location is missing', () => {
                return supertest(app)
                    .post(`/api/scenes/1`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(sceneWithoutLocation)
                    .expect(400, { error: { message: 'missing input in the request body' } })
            })
            it('responds with 400 error and message when time of day is missing', () => {
                return supertest(app)
                    .post(`/api/scenes/1`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(sceneWithoutTimeOfDay)
                    .expect(400, { error: { message: 'missing input in the request body' } })
            })
            it('responds with 400 error and message when short summary is missing', () => {
                return supertest(app)
                    .post(`/api/scenes/1`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(sceneWithoutSummary)
                    .expect(400, { error: { message: 'missing input in the request body' } })
            })
        })
        context('given production_id is invalid', () => {
            it('responds with 400 error and message when production_id is missing', () => {
                return supertest(app)
                    .post(`/api/scenes/9999`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(insertScene)
                    .expect(400, { error: { message: 'production_id is not valid' } })
            })
        })
        context('given valid inputs', () => {
            it('responds with 200 and new scene', () => {
                return supertest(app)
                    .post('/api/scenes/1')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(insertScene)
                    .expect(201)
                    .then(res => {
                        expect(res.body.location).to.eql(insertScene.location)
                        expect(res.body.setting).to.eql(insertScene.setting)
                        expect(res.body.short_summary).to.eql(insertScene.short_summary)
                        expect(res.body.time_of_day).to.eql(insertScene.time_of_day)
                    })
            })
        })
        context('given XSS attack', () => {
            it('removes xss attack', () => {
                return supertest(app)
                    .post('/api/scenes/1')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(insertMaliciousScene)
                    .expect(201)
                    .then(res => {
                        expect(res.body.setting).to.eql(sanitizedInsertedScene.setting)
                        expect(res.body.location).to.eql(sanitizedInsertedScene.location)
                        expect(res.body.time_of_day).to.eql(sanitizedInsertedScene.time_of_day)
                        expect(res.body.short_summary).to.eql(sanitizedInsertedScene.short_summary)
                    })
            })
        })
    })
})