/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
const path = require('path');
const express = require('express');
const xss = require('xss');
const ProductionsService = require('./productions-service');
const { requireAuth } = require('../middleware/jwt-auth');

const productionsRouter = express.Router();
const jsonParser = express.json();

const serializeProduction = (production) => ({
  id: production.id,
  production_title: xss(production.production_title),
  date_created: production.date_created,
  owner: production.owner,
});

productionsRouter
  .route('/')
  .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { user_id } = req;
    ProductionsService.getAllProductions(knexInstance, user_id)
      .then((productions) => {
        if (productions.length === 0) {
          res.status(404).json({ error: { message: 'No productions found.' } });
        }
        res.json(productions.map(serializeProduction));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { production_title } = req.body;
    const owner = req.user_id;
    const newProduction = { production_title, owner };
    for (const [key, value] of Object.entries(newProduction)) {
      if (value == null) {
        return res.status(400).json({
          error: {
            message: `${key} missing in request body`,
          },
        });
      }
    }

    const knexInstance = req.app.get('db');
    ProductionsService.insertProduction(knexInstance, newProduction)
      .then((production) => res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${production.id}`))
        .json(serializeProduction(production)))
      .catch(next);
  });

productionsRouter
  .route('/:production_id')
  .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { user_id } = req;
    const { production_id } = req.params;
    ProductionsService.getById(knexInstance, user_id, production_id)
      .then((row) => {
        if (row == null) {
          return res
            .status(404)
            .json({ error: { message: 'Production not found.' } });
        }
        res.json(serializeProduction(row));
      })
      .catch(next);
  });

module.exports = productionsRouter;
