import multer from 'multer'
import sharp from 'sharp'
import { randomUUID } from 'crypto'
import Tour from '../models/tourModel.js'
import AppError from '../utils/appError.js'
import catchAsync from '../utils/catchAsync.js'
import * as factory from './factoryController.js'

const getAllTours = factory.getAll(Tour)
const getTour = factory.getOne(Tour, { path: 'reviews' })
const createTour = factory.createOne(Tour)
const updateTour = factory.updateOne(Tour)
const deleteTour = factory.deleteOne(Tour)

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|png|jpg|webp|gif/
    const isValid =
      allowed.test(file.mimetype) &&
      allowed.test(file.originalname.split('.')[1].toLowerCase())
    isValid ? cb(null, true) : cb(new AppError('Images only!', 400), false)
  }
})

const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
])

const resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next()
  req.body.imageCover = `tour-${req.params.id}-${randomUUID()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 100 })
    .toFile(`public/img/tours/${req.body.imageCover}`)
  req.body.images = []
  await Promise.all(
    req.files.images.map(async (file, index) => {
      const imageFileName = `tour-${req.params.id}-${randomUUID()}-${index + 1}.jpeg`
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 100 })
        .toFile(`public/img/tours/${imageFileName}`)
      req.body.images.push(imageFileName)
    })
  )
  next()
})

const aliasTopTours = (req, res, next) => {
  const aliasQuery = {}
  req.aliasQuery = aliasQuery
  aliasQuery.limit = '5'
  aliasQuery.sort = '-ratingsAverage,price'
  aliasQuery.fields = 'name,ratingsAverage,price,duration,difficulty'
  next()
}

const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        count: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { minPrice: 1 }
    }
  ])
  res.status(200).json({
    status: 'success',
    data: {
      data: stats
    }
  })
})

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        count: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        count: -1
      }
    },
    {
      $limit: 12
    }
  ])
  res.status(200).json({
    status: 'success',
    data: {
      data: plan
    }
  })
})

const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latitudeLongitude, unit } = req.params
  let [latitude, longitude] = latitudeLongitude.split(',')
  latitude = parseFloat(latitude)
  longitude = parseFloat(longitude)
  if (!latitude || !longitude) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format latitude,longitude',
        400
      )
    )
  }
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] }
    }
  }).select('name')
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours
    }
  })
})

const getDistances = catchAsync(async (req, res, next) => {
  const { latitudeLongitude, unit } = req.params
  const [latitude, longitude] = latitudeLongitude.split(',')

  if (!latitude || !longitude) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format latitude,longitude',
        400
      )
    )
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude * 1, latitude * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        name: 1,
        distance: 1
      }
    }
  ])
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })
})

export {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  uploadTourImages,
  resizeTourImages,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances
}
