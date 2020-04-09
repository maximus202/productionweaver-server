/* eslint-disable camelcase */
/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
const { expect } = require('chai');
const knex = require('knex');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Elements endpoints', () => {
  let db;

  const testUsers = [
    {
      id: 1,
      first_name: 'Martin',
      last_name: 'Scorsese',
      email: 'mscorsese@studio.com',
      password: '$2y$10$/tEjnUkJE3WP.eOIWzj9.usxxas8rJnaW4DWOmdM58jhm.waQzuTa',
      date_created: '2029-01-22T16:28:32.615Z',
    },
    {
      id: 2,
      first_name: 'Alfred',
      last_name: 'Hitchcock',
      email: 'ahitchcock@studio.com',
      password: '$2y$12$jaAyDNT.oD1UXcyckL2Zsumq6VEdP5.3lMgKyVnJjKmtNTBlxFKqO',
      date_created: '2001-01-22T16:28:32.615Z',
    },
    {
      id: 3,
      first_name: 'Ridley',
      last_name: 'Scott',
      email: 'rscott@studio.com',
      password: '$2y$12$gRoOtIsv0fwtqsIKsfmcD.jnF9jcctpN2IyLezyiPsPl2pDNdEO9W',
      date_created: '2001-01-28T16:28:32.615Z',
    },
  ];

  const testProductions = [
    {
      id: 1,
      production_title: 'Parasite',
      date_created: '2029-01-22T16:28:32.615Z',
      owner: 1,
    },
    {
      id: 2,
      production_title: 'Midsommar',
      date_created: '2011-01-22T16:28:32.615Z',
      owner: 2,
    },
    {
      id: 3,
      production_title: 'Avengers: Endgame',
      date_created: '2009-01-22T16:28:32.615Z',
      owner: 3,
    },
  ];

  const testScenes = [
    {
      id: 1,
      scene_script_number: 1,
      setting: 'Ext.',
      location: 'Jungle Road',
      time_of_day: 'Day',
      short_summary: 'opening',
      date_created: '1986-01-22T16:28:32.615Z',
      production_id: '1',
      owner: 1,
    },
    {
      id: 2,
      scene_script_number: 1,
      setting: 'Ext.',
      location: 'The Beach',
      time_of_day: 'Day',
      short_summary: 'Family arrives at beach.',
      date_created: '1989-01-22T16:28:32.615Z',
      production_id: '1',
      owner: 1,
    },
    {
      id: 3,
      scene_script_number: 1,
      setting: 'Ext.',
      location: 'Far down the beach',
      time_of_day: 'Day',
      short_summary: 'Tina explores the jungle and gets bitten by a strange lizard',
      date_created: '1989-01-22T16:28:32.615Z',
      production_id: '1',
      owner: 1,
    },
  ];

  const testElements = [
    {
      id: 1,
      category: 'Props',
      description: 'silverware',
      date_created: '2001-01-02T16:28:32.615Z',
      scene_id: 1,
      owner: 1,
    },
    {
      id: 2,
      category: 'Cast',
      description: 'Bob',
      date_created: '2009-01-02T16:28:32.615Z',
      scene_id: 1,
      owner: 1,
    },
    {
      id: 3,
      category: 'Wardrobe',
      description: 'Bob\'s suit',
      date_created: '2001-01-03T16:28:32.615Z',
      scene_id: 1,
      owner: 1,
    },
  ];

  maliciousElement = {
    id: 1,
    category: 'Wardrobe',
    description: 'Malicious first name <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    date_created: '2001-01-03T16:28:32.615Z',
    scene_id: 1,
    owner: 1,
  };

  maliciousElementSanitized = {
    id: 1,
    category: 'Wardrobe',
    description: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
    date_created: '2001-01-03T16:28:32.615Z',
    scene_id: 1,
    owner: 1,
  };

  requestWithMissingCategory = {
    description: 'Here is a description',
  };

  requestWithMissingDescription = {
    category: 'Wardrobe',
  };

  validRequest = {
    category: 'Cast',
    description: 'New element',
  };

  maliciousRequest = {
    category: 'Cast',
    description: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
  };

  sanitizedRequest = {
    category: 'Cast',
    description: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
  };

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  // Remove data from users table before all tests in this file.
  before('clean the tables before all tests', () => helpers.cleanTables(db));

  // Remove data from users table after each test in this block
  afterEach('clean the tables after each test', () => helpers.cleanTables(db));

  function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ id: user.id }, secret, { subject: user.email, algorithm: 'HS256' });
    return `bearer ${token}`;
  }

  describe('GET /api/elements', () => {
    context('given elements do not exist', () => {
      beforeEach('insert users', () => db
        .insert(testUsers)
        .into('productionweaver_users'));
      beforeEach('insert productions', () => db
        .insert(testProductions)
        .into('productionweaver_productions'));
      beforeEach('insert scenes', () => db
        .insert(testScenes)
        .into('productionweaver_scenes'));
      it('responds with 404 error and message', () => supertest(app)
        .get('/api/elements/')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .expect(404, {
          error: {
            message: 'no elements found',
          },
        }));
    });
    context('given elements exist', () => {
      beforeEach('insert users', () => db
        .insert(testUsers)
        .into('productionweaver_users'));
      beforeEach('insert productions', () => db
        .insert(testProductions)
        .into('productionweaver_productions'));
      beforeEach('insert scenes', () => db
        .insert(testScenes)
        .into('productionweaver_scenes'));
      beforeEach('insert elements', () => db
        .insert(testElements)
        .into('productionweaver_elements'));
      it('responds with 200 and elements', () => supertest(app)
        .get('/api/elements/')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {
          expect(res.body.id).to.eql(testElements.id);
          expect(res.body.category).to.eql(testElements.category);
          expect(res.body.description).to.eql(testElements.description);
          expect(res.body.date_created).to.eql(testElements.date_created);
          expect(res.body.production_id).to.eql(testElements.production_id);
          expect(res.body.scene_id).to.eql(testElements.scene_id);
        }));
    });
    context('given xss attack', () => {
      beforeEach('insert users', () => db
        .insert(testUsers)
        .into('productionweaver_users'));
      beforeEach('insert productions', () => db
        .insert(testProductions)
        .into('productionweaver_productions'));
      beforeEach('insert scenes', () => db
        .insert(testScenes)
        .into('productionweaver_scenes'));
      beforeEach('insert elements', () => db
        .insert(maliciousElement)
        .into('productionweaver_elements'));
      it('removes xss attack', () => supertest(app)
        .get('/api/elements/')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .expect(200)
        .then((res) => {
          expect(res.body[0].description).to.eql(maliciousElementSanitized.description);
        }));
    });
  });

  describe('GET /api/elements/:element_id', () => {
    beforeEach('insert users', () => db
      .insert(testUsers)
      .into('productionweaver_users'));
    beforeEach('insert productions', () => db
      .insert(testProductions)
      .into('productionweaver_productions'));
    beforeEach('insert scenes', () => db
      .insert(testScenes)
      .into('productionweaver_scenes'));
    beforeEach('insert elements', () => db
      .insert(testElements)
      .into('productionweaver_elements'));

    context('element_id is invalid', () => {
      it('responds with 404 and error', () => {
        const element_id = 99;
        return supertest(app)
          .get(`/api/elements/${element_id}`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(404);
      });
    });
    context('element_id is valid', () => {
      it('responds with 200 and element', () => {
        const element_id = 1;
        return supertest(app)
          .get(`/api/elements/${element_id}`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(200)
          .then((res) => {
            expect(res.body.id).to.eql(testElements.id);
            expect(res.body.category).to.eql(testElements.category);
            expect(res.body.description).to.eql(testElements.description);
            expect(res.body.date_created).to.eql(testElements.date_created);
            expect(res.body.production_id).to.eql(testElements.production_id);
            expect(res.body.scene_id).to.eql(testElements.scene_id);
          });
      });
    });
  });

  describe('PATCH /api/elements', () => {
    beforeEach('insert users', () => db
      .insert(testUsers)
      .into('productionweaver_users'));
    beforeEach('insert productions', () => db
      .insert(testProductions)
      .into('productionweaver_productions'));
    beforeEach('insert scenes', () => db
      .insert(testScenes)
      .into('productionweaver_scenes'));
    beforeEach('insert elements', () => db
      .insert(testElements)
      .into('productionweaver_elements'));

    context('given missing inputs in the request body', () => {
      it('responds with 400 and a message when Category is missing', () => supertest(app)
        .patch('/api/elements/1')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(requestWithMissingCategory)
        .expect(400, { error: { message: 'missing input in the request body' } }));
      it('responds with 400 and a message when Description is missing', () => supertest(app)
        .patch('/api/elements/1')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(requestWithMissingDescription)
        .expect(400, { error: { message: 'missing input in the request body' } }));
    });
    context('given element_id is invalid', () => {
      it('responds with 400 and a message', () => supertest(app)
        .patch('/api/elements/9999')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(validRequest)
        .expect(404, { error: { message: 'element not found' } }));
    });
    context('given valid request', () => {
      it('responds with 201 with updated element', () => supertest(app)
        .patch('/api/elements/1')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(validRequest)
        .expect(201)
        .then((res) => {
          expect(res.body.category).to.eql(validRequest.category);
          expect(res.body.description).to.eql(validRequest.description);
        }));
    });
    context('given XSS attack', () => {
      it('removes XSS attack', () => supertest(app)
        .patch('/api/elements/1')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(maliciousRequest)
        .expect(201)
        .then((res) => {
          expect(res.body.category).to.eql(sanitizedRequest.category);
          expect(res.body.description).to.eql(sanitizedRequest.description);
        }));
    });
  });
});
