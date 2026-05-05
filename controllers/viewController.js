import { configDotenv } from 'dotenv'
configDotenv({ path: './config.env' })
import Tour from '../models/tourModel.js'
import Booking from '../models/bookingModel.js'
import catchAsync from '../utils/catchAsync.js'
import AppError from '../utils/appError.js'

const getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find()
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  })
})

const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user'
  })
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404))
  }
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
    mapboxToken: process.env.MAP_BOX_ACCESS_TOKEN
  })
})

const getLogin = (req, res) => {
  res.status(200).render('login', {
    title: 'Login into your account'
  })
}

const getAccount = async (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  })
}

const getMyTours = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
  const tourIds = bookings.map((booking) => booking.tour)
  const tours = await Tour.find({ _id: { $in: tourIds } })
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  })
})

export { getOverview, getTour, getLogin, getAccount, getMyTours }
