const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Elements endpoints', () => {
    let db

    const testUsers = [
        {
            id: 1,
            first_name: 'Martin',
            last_name: 'Scorsese',
            email: 'mscorsese@studio.com',
            password: '$2y$10$/tEjnUkJE3WP.eOIWzj9.usxxas8rJnaW4DWOmdM58jhm.waQzuTa',
            date_created: '2029-01-22T16:28:32.615Z'
        },
        {
            id: 2,
            first_name: 'Alfred',
            last_name: 'Hitchcock',
            email: 'ahitchcock@studio.com',
            password: '$2y$12$jaAyDNT.oD1UXcyckL2Zsumq6VEdP5.3lMgKyVnJjKmtNTBlxFKqO',
            date_created: '2001-01-22T16:28:32.615Z'
        },
        {
            id: 3,
            first_name: 'Ridley',
            last_name: 'Scott',
            email: 'rscott@studio.com',
            password: '$2y$12$gRoOtIsv0fwtqsIKsfmcD.jnF9jcctpN2IyLezyiPsPl2pDNdEO9W',
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

    const testElements = [
        {
            id: 1,
            category: 'Props',
            description: 'silverware',
            date_created: '2001-01-02T16:28:32.615Z',
            production_id: 1,
            scene_id: 1
        },
        {
            id: 2,
            category: 'Cast',
            description: 'Bob',
            date_created: '2009-01-02T16:28:32.615Z',
            production_id: 1,
            scene_id: 1
        },
        {
            id: 3,
            category: 'Wardrobe',
            description: 'Bob\'s suit',
            date_created: '2001-01-03T16:28:32.615Z',
            production_id: 1,
            scene_id: 1
        },
    ]

    maliciousElement = {
        id: 1,
        category: 'Wardrobe',
        description: 'Malicious first name <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        date_created: '2001-01-03T16:28:32.615Z',
        production_id: 1,
        scene_id: 1
    }

    maliciousElementSanitized = {
        id: 1,
        category: 'Wardrobe',
        description: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
        date_created: '2001-01-03T16:28:32.615Z',
        production_id: 1,
        scene_id: 1
    }

    requestWithMissingCategory = {
        description: 'Here is a description',
    }

    requestWithMissingDescription = {
        category: 'Wardrobe',
    }

    validRequest = {
        category: 'Cast',
        description: 'New element'
    }

    maliciousRequest = {
        category: 'Cast',
        description: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
    }

    sanitizedRequest = {
        category: 'Cast',
        description: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.'
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

    describe('GET /api/elements', () => {
        context('given basic token is missing', () => {
            it('responds with 401 and error message', () => {
                return supertest(app)
                    .get('/api/elements/')
                    .expect(401, { error: { message: 'missing basic token' } })
            })
        })

        context(`given basic token does not have credentials`, () => {
            it('responds with 401 and error message', () => {
                const userNoCreds = { email: '', password: '' }
                return supertest(app)
                    .get('/api/elements/')
                    .set('Authorization', makeAuthHeader(userNoCreds))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for a user that does not exist', () => {
            it('responds with 401 and error message', () => {
                const nonExistantUser = { email: 'invalid', password: 'existy' }
                return supertest(app)
                    .get('/api/elements')
                    .set('Authorization', makeAuthHeader(nonExistantUser))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for an existing user with the wrong password', () => {
            it('responds with 401 and error message', () => {
                const userWithInvalidPassword = { email: testUsers[0].email, password: 'wrong' }
                return supertest(app)
                    .get('/api/elements/')
                    .set('Authorization', makeAuthHeader(userWithInvalidPassword))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given elements do not exist', () => {
            beforeEach('insert users', () => {
                return db
                    .insert(testUsers)
                    .into('productionweaver_users')
            })

            it('responds with 404 error and message', () => {
                return supertest(app)
                    .get('/api/elements')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(404, {
                        error: {
                            message: 'no elements found'
                        }
                    })
            })
        })
        context('given elements exist', () => {
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
            beforeEach('insert scenes', () => {
                return db
                    .insert(testScenes)
                    .into('productionweaver_scenes')
            })
            beforeEach('insert elements', () => {
                return db
                    .insert(testElements)
                    .into('productionweaver_elements')
            })
            it('responds with 200 and elements', () => {
                return supertest(app)
                    .get('/api/elements')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(200)
                    .then(res => {
                        expect(res.body.id).to.eql(testElements.id)
                        expect(res.body.category).to.eql(testElements.category)
                        expect(res.body.description).to.eql(testElements.description)
                        expect(res.body.date_created).to.eql(testElements.date_created)
                        expect(res.body.production_id).to.eql(testElements.production_id)
                        expect(res.body.scene_id).to.eql(testElements.scene_id)
                    })
            })
        })
        context('given xss attack', () => {
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
            beforeEach('insert scenes', () => {
                return db
                    .insert(testScenes)
                    .into('productionweaver_scenes')
            })
            beforeEach('insert elements', () => {
                return db
                    .insert(maliciousElement)
                    .into('productionweaver_elements')
            })
            it('removes xss attack', () => {
                return supertest(app)
                    .get('/api/elements')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(200)
                    .then(res => {
                        expect(res.body[0].description).to.eql(maliciousElementSanitized.description)
                    })

            })
        })
    })

    describe('GET /api/elements/:element_id', () => {
        context('given basic token is missing', () => {
            it('responds with 401 and error message', () => {
                return supertest(app)
                    .get('/api/elements/1')
                    .expect(401, { error: { message: 'missing basic token' } })
            })
        })

        context(`given basic token does not have credentials`, () => {
            it('responds with 401 and error message', () => {
                const userNoCreds = { email: '', password: '' }
                return supertest(app)
                    .get('/api/elements/1')
                    .set('Authorization', makeAuthHeader(userNoCreds))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for a user that does not exist', () => {
            it('responds with 401 and error message', () => {
                const nonExistantUser = { email: 'invalid', password: 'existy' }
                return supertest(app)
                    .get('/api/elements/1')
                    .set('Authorization', makeAuthHeader(nonExistantUser))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for an existing user with the wrong password', () => {
            it('responds with 401 and error message', () => {
                const userWithInvalidPassword = { email: testUsers[0].email, password: 'wrong' }
                return supertest(app)
                    .get('/api/elements/1')
                    .set('Authorization', makeAuthHeader(userWithInvalidPassword))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

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
        beforeEach('insert scenes', () => {
            return db
                .insert(testScenes)
                .into('productionweaver_scenes')
        })
        beforeEach('insert elements', () => {
            return db
                .insert(testElements)
                .into('productionweaver_elements')
        })

        context('element_id is invalid', () => {
            it('responds with 404 and error', () => {
                const element_id = 99;
                return supertest(app)
                    .get(`/api/elements/${element_id}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(404)
            })
        })
        context('element_id is valid', () => {
            it('responds with 200 and element', () => {
                const element_id = 1
                return supertest(app)
                    .get(`/api/elements/${element_id}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(200)
                    .then(res => {
                        expect(res.body.id).to.eql(testElements.id)
                        expect(res.body.category).to.eql(testElements.category)
                        expect(res.body.description).to.eql(testElements.description)
                        expect(res.body.date_created).to.eql(testElements.date_created)
                        expect(res.body.production_id).to.eql(testElements.production_id)
                        expect(res.body.scene_id).to.eql(testElements.scene_id)
                    })
            })
        })
    })

    describe('PATCH /api/elements', () => {
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
        beforeEach('insert scenes', () => {
            return db
                .insert(testScenes)
                .into('productionweaver_scenes')
        })
        beforeEach('insert elements', () => {
            return db
                .insert(testElements)
                .into('productionweaver_elements')
        })

        context('given basic token is missing', () => {
            it('responds with 401 and error message', () => {
                return supertest(app)
                    .patch('/api/elements/')
                    .send(validRequest)
                    .expect(401, { error: { message: 'missing basic token' } })
            })
        })

        context(`given basic token does not have credentials`, () => {
            it('responds with 401 and error message', () => {
                const userNoCreds = { email: '', password: '' }
                return supertest(app)
                    .patch('/api/elements/')
                    .set('Authorization', makeAuthHeader(userNoCreds))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for a user that does not exist', () => {
            it('responds with 401 and error message', () => {
                const nonExistantUser = { email: 'invalid', password: 'existy' }
                return supertest(app)
                    .patch('/api/elements/')
                    .set('Authorization', makeAuthHeader(nonExistantUser))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given basic token has credentials for an existing user with the wrong password', () => {
            it('responds with 401 and error message', () => {
                const userWithInvalidPassword = { email: testUsers[0].email, password: 'wrong' }
                return supertest(app)
                    .patch('/api/elements/')
                    .set('Authorization', makeAuthHeader(userWithInvalidPassword))
                    .expect(401, { error: { message: 'unauthorized request' } })
            })
        })

        context('given missing inputs in the request body', () => {
            it('responds with 400 and a message when Category is missing', () => {
                return supertest(app)
                    .patch('/api/elements/1')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(requestWithMissingCategory)
                    .expect(400, { error: { message: 'missing input in the request body' } })
            })
            it('responds with 400 and a message when Description is missing', () => {
                return supertest(app)
                    .patch('/api/elements/1')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(requestWithMissingDescription)
                    .expect(400, { error: { message: 'missing input in the request body' } })
            })
        })
        context('given element_id is invalid', () => {
            it('responds with 400 and a message', () => {
                return supertest(app)
                    .patch('/api/elements/9999')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(validRequest)
                    .expect(404, { error: { message: 'element not found' } })
            })
        })
        context('given valid request', () => {
            it('responds with 201 with updated element', () => {
                return supertest(app)
                    .patch('/api/elements/1')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(validRequest)
                    .expect(201)
                    .then(res => {
                        expect(res.body.category).to.eql(validRequest.category)
                        expect(res.body.description).to.eql(validRequest.description)
                    })
            })
        })
        context('given XSS attack', () => {
            it('removes XSS attack', () => {
                return supertest(app)
                    .patch('/api/elements/1')
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(maliciousRequest)
                    .expect(201)
                    .then(res => {
                        expect(res.body.category).to.eql(sanitizedRequest.category)
                        expect(res.body.description).to.eql(sanitizedRequest.description)
                    })
            })
        })
    })
})