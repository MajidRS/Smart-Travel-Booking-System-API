import Review from '../models/reviewModel.js'
import * as factory from './factoryController.js'

const setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId
  if (!req.body.user) req.body.user = req.user._id
  next()
}

const getAllReviews = factory.getAll(Review)
const getReview = factory.getOne(Review)
const createReview = factory.createOne(Review)
const updateReview = factory.updateOne(Review)
const deleteReview = factory.deleteOne(Review)

export {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  setTourUserIds
}
