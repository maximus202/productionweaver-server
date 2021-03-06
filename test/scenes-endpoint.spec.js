/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
const { expect } = require('chai');
const knex = require('knex');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('scenes endpoint', () => {
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
      scene_script_number: '1',
      setting: 'Ext.',
      location: 'Jungle Road',
      time_of_day: 'Day',
      short_summary: 'opening',
      date_created: '1986-01-22T16:28:32.615Z',
      production_id: '1',
      owner: '1',
    },
    {
      id: 2,
      scene_script_number: '1',
      setting: 'Ext.',
      location: 'The Beach',
      time_of_day: 'Day',
      short_summary: 'Family arrives at beach.',
      date_created: '1989-01-22T16:28:32.615Z',
      production_id: '1',
      owner: '1',
    },
    {
      id: 3,
      scene_script_number: '1',
      setting: 'Ext.',
      location: 'Far down the beach',
      time_of_day: 'Day',
      short_summary: 'Tina explores the jungle and gets bitten by a strange lizard',
      date_created: '1989-01-22T16:28:32.615Z',
      production_id: '1',
      owner: '1',
    },
  ];

  const maliciousScene = {
    id: 1,
    scene_script_number: 1,
    setting: 'Ext.',
    location: 'Jungle Road',
    time_of_day: 'Day',
    short_summary: 'Malicious first name <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    date_created: '1986-01-22T16:28:32.615Z',
    production_id: 1,
    owner: 1,
  };

  const sanitizedScene = {
    id: 1,
    scene_script_number: 1,
    setting: 'Ext.',
    location: 'Jungle Road',
    time_of_day: 'Day',
    short_summary: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
    date_created: '1986-01-22T16:28:32.615Z',
    production_id: 1,
    owner: 1,
  };

  const sceneWithoutSetting = {
    location: 'Jungle Road',
    time_of_day: 'Day',
    short_summary: 'summary',
  };

  const sceneWithoutLocation = {
    setting: 'Ext.',
    time_of_day: 'Day',
    short_summary: 'summary',
  };

  const sceneWithoutTimeOfDay = {
    setting: 'Ext.',
    location: 'Jungle Road',
    short_summary: 'summary',
  };

  const sceneWithoutSummary = {
    setting: 'Ext.',
    location: 'Jungle Road',
    time_of_day: 'Day',
  };

  const insertScene = {
    scene_script_number: 1,
    setting: 'Ext.',
    location: 'Jungle Road',
    time_of_day: 'Day',
    short_summary: 'summary',
    production_id: 1,
  };

  const insertMaliciousScene = {
    scene_script_number: 1,
    setting: 'Ext.',
    location: 'Jungle Road',
    time_of_day: 'Day',
    short_summary: 'Malicious first name <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    production_id: 1,
  };

  const sanitizedInsertedScene = {
    setting: 'Ext.',
    scene_script_number: 1,
    location: 'Jungle Road',
    time_of_day: 'Day',
    short_summary: 'Malicious first name &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
    production_id: 1,
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

  describe('GET /api/scenes', () => {
    context('given scenes do not exist', () => {
      beforeEach('insert users', () => db
        .into('productionweaver_users')
        .insert(testUsers));
      it('responds with 400 and message', () => supertest(app)
        .get('/api/scenes/')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .expect(400, { error: { message: 'No scenes found.' } }));
    });

    context('given scenes exist', () => {
      beforeEach('insert users', () => db
        .into('productionweaver_users')
        .insert(testUsers));
      beforeEach('insert productions', () => db
        .into('productionweaver_productions')
        .insert(testProductions));
      beforeEach('insert scenes', () => db
        .into('productionweaver_scenes')
        .insert(testScenes));
      it('responds with 200 and list of scenes', () => supertest(app)
        .get('/api/scenes')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .expect(200));
    });

    context('given an XSS attack', () => {
      beforeEach('insert users', () => db
        .into('productionweaver_users')
        .insert(testUsers));
      beforeEach('insert productions', () => db
        .into('productionweaver_productions')
        .insert(testProductions));
      beforeEach('insert malicious scene', () => db
        .into('productionweaver_scenes')
        .insert(maliciousScene));
      it('removes XSS attack', () => supertest(app)
        .get('/api/scenes')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .expect(200)
        .expect((res) => {
          expect(res.body[0].short_summary).to.eql(sanitizedScene.short_summary);
        }));
    });
  });

  describe('POST /api/scenes/:production_id', () => {
    beforeEach('insert testUsers', () => db
      .insert(testUsers)
      .into('productionweaver_users'));
    beforeEach('insert testProductions', () => db
      .insert(testProductions)
      .into('productionweaver_productions'));
    context('given inputs are missing', () => {
      it('responds with 400 error and message when setting is missing', () => supertest(app)
        .post('/api/scenes/1')
        .set('Authorization', makeAuthHeader(testUsers[1]))
        .send(sceneWithoutSetting)
        .expect(400, { error: { message: 'missing input in the request body' } }));
      it('responds with 400 error and message when location is missing', () => supertest(app)
        .post('/api/scenes/1')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(sceneWithoutLocation)
        .expect(400, { error: { message: 'missing input in the request body' } }));
      it('responds with 400 error and message when time of day is missing', () => supertest(app)
        .post('/api/scenes/1')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(sceneWithoutTimeOfDay)
        .expect(400, { error: { message: 'missing input in the request body' } }));
      it('responds with 400 error and message when short summary is missing', () => supertest(app)
        .post('/api/scenes/1')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(sceneWithoutSummary)
        .expect(400, { error: { message: 'missing input in the request body' } }));
    });
    context('given production_id is invalid', () => {
      it('responds with 400 error and message when production_id is missing', () => supertest(app)
        .post('/api/scenes/9999')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(insertScene)
        .expect(400, { error: { message: 'production_id or owner is not valid' } }));
    });
    context('given valid inputs', () => {
      it('responds with 200 and new scene', () => supertest(app)
        .post('/api/scenes/1')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(insertScene)
        .expect(201)
        .then((res) => {
          expect(res.body.location).to.eql(insertScene.location);
          expect(res.body.setting).to.eql(insertScene.setting);
          expect(res.body.short_summary).to.eql(insertScene.short_summary);
          expect(res.body.time_of_day).to.eql(insertScene.time_of_day);
        }));
    });
    context('given XSS attack', () => {
      it('removes xss attack', () => supertest(app)
        .post('/api/scenes/1')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(insertMaliciousScene)
        .expect(201)
        .then((res) => {
          expect(res.body.setting).to.eql(sanitizedInsertedScene.setting);
          expect(res.body.location).to.eql(sanitizedInsertedScene.location);
          expect(res.body.time_of_day).to.eql(sanitizedInsertedScene.time_of_day);
          expect(res.body.short_summary).to.eql(sanitizedInsertedScene.short_summary);
        }));
    });
  });
});
