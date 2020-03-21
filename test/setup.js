process.env.TZ = 'UTC'
require('dotenv').config()
const { expect } = require('chai')
const supertest = require('supertest')
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.JWT_EXPIRY = '3m'

global.expect = expect
global.supertest = supertest