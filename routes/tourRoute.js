import express from 'express'

import { paramSanitizeHandler } from '@exortek/express-mongo-sanitize'
import xssSanitize from 'xss-sanitize'

import * as tourController from '../controllers/tourController.js'
import * as authController from '../controllers/authController.js'

const router = express.Router()

router.param('id', paramSanitizeHandler(), xssSanitize.paramSanitize())

router.route('/tours-stats').get(tourController.getTourStats)

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours)

router
  .route('/tours-within/:distance/center/:latitudeLongitude/unit/:unit')
  .get(tourController.getToursWithin)

router
  .route('/distances/:latitudeLongitude/unit/:unit')
  .get(tourController.getDistances)

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  )

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  )

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  )

export default router
