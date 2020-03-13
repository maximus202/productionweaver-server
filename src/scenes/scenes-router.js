const path = require('path')
const express = require('express')
const xss = require('xss')
const ScenesService = require('../scenes/scenes-service')

const scenesRouter = express.Router()
const jsonRouter = express.json()

serializeScene = scene => ({
    id: scene.id,
    setting: xss(scene.setting),
    location: xss(scene.location),
    time_of_day: xss(scene.time_of_day),
    short_summary: xss(scene.short_summary),
    date_created: scene.date_created,
    production_id: scene.production_id
})

scenesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        ScenesService.getAllScenes(knexInstance)
            .then(scenes => {
                if (scenes.length == 0) {
                    res.status(404).json({ error: { message: 'No scenes found.' } })
                }
                res.status(200).json(scenes.map(serializeScene))
            })
    })

module.exports = scenesRouter