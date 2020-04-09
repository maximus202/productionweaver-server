/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
const express = require('express');
const xss = require('xss');
const ElementsService = require('./elements-service');
const ScenesService = require('../scenes/scenes-service');
const { requireAuth } = require('../middleware/jwt-auth');

const jsonParser = express.json();
const elementsRouter = express.Router();

const serializeElements = (element) => ({
  id: element.id,
  category: xss(element.category),
  description: xss(element.description),
  date_created: element.date_created,
  scene_id: xss(element.scene_id),
});

elementsRouter
  .route('/')
  .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { user_id } = req;
    ElementsService.getAllElements(knexInstance, user_id)
      .then((elements) => {
        if (elements.length === 0) {
          res
            .status(404)
            .json({
              error: {
                message: 'no elements found',
              },
            });
        }
        res
          .status(200)
          .json(elements.map(serializeElements));
      })
      .catch(next);
  });

elementsRouter
  .route('/:element_id')
  .all(requireAuth)
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { element_id } = req.params;
    const { user_id } = req;
    ElementsService.getById(knexInstance, element_id, user_id)
      .then((element) => {
        if (element.length === 0) {
          return res
            .status(404)
            .json({
              error: {
                message: 'element not found',
              },
            });
        }
        res.element = element;
        return next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(res.element.map(serializeElements));
  })
  .patch(jsonParser, (req, res, next) => {
    const { category, description } = req.body;
    const { element_id } = req.params;
    const updateElement = { category, description };
    const { user_id } = req;
    const knexInstance = req.app.get('db');

    // check all inputs are in request body
    for (const [key, value] of Object.entries(updateElement)) {
      if (value == null) {
        return res
          .status(400)
          .json({
            error: {
              message: 'missing input in the request body',
            },

          })
          .catch(next);
      }
    }

    ElementsService.updateElement(knexInstance, updateElement, element_id, user_id)
      .then((element) => res
        .status(201)
        .json(serializeElements(element)))
      .catch(next);
  });

elementsRouter
  .route('/scene/:scene_id')
  .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { user_id } = req;
    const { scene_id } = req.params;
    ElementsService.getByScene(knexInstance, user_id, scene_id)
      .then((elements) => {
        res
          .status(200)
          .json(elements.map(serializeElements));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { category, description } = req.body;
    const { scene_id } = req.params;
    const owner = req.user_id;
    const newElement = {
      category, description, scene_id, owner,
    };
    const knexInstance = req.app.get('db');

    // check all inputs are in request body
    for (const [key, value] of Object.entries(newElement)) {
      if (value == null) {
        res
          .status(400)
          .json({
            error: {
              message: 'missing input in the request body',
            },

          })
          .catch(next);
      }
    }

    // check scene_id is valid
    ScenesService.getById(knexInstance, owner, scene_id)
      .then((row) => {
        if (row == null) {
          res
            .status(400)
            .json({ error: { message: 'service_id is not valid' } });
        }
      })
      .catch(next);

    ElementsService.insertElement(knexInstance, newElement)
      .then((Element) => res
        .status(201)
        .json(serializeElements(Element)))
      .catch(next);
  });

elementsRouter
  .route('/:scene_id')
  .all(requireAuth)
  .post(jsonParser, (req, res, next) => {
    const { category, description } = req.body;
    const { scene_id } = req.params;
    const owner = req.user_id;
    const newElement = {
      category, description, scene_id, owner,
    };
    const knexInstance = req.app.get('db');

    // check all inputs are in request body
    for (const [key, value] of Object.entries(newElement)) {
      if (value == null) {
        return res
          .status(400)
          .json({
            error: {
              message: 'missing input in the request body',
            },

          })
          .catch(next);
      }
    }

    // check scene_id is valid
    ScenesService.getById(knexInstance, scene_id)
      .then((row) => {
        if (row == null) {
          return res
            .status(400)
            .json({ error: { message: 'service_id is not valid' } });
        }
      })
      .catch(next);

    ElementsService.insertElement(knexInstance, newElement)
      .then((element) => {
        res
          .status(201)
          .json(serializeElements(element));
      })
      .catch(next);
  });

module.exports = elementsRouter;
