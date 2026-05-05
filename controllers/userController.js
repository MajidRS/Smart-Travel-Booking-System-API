import multer from 'multer'
import sharp from 'sharp'
import { randomUUID } from 'crypto'

import User from '../models/userModel.js'
import catchAsync from '../utils/catchAsync.js'
import * as factory from './factoryController.js'
import AppError from '../utils/appError.js'

const getAllUsers = factory.getAll(User)
const getUser = factory.getOne(User)
const updateUser = factory.updateOne(User)
const deleteUser = factory.deleteOne(User)

const createUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signup instead'
  })
}

const filterObj = (obj) => {
  const allowFields = ['name', 'email', 'photo']
  let result = Object.keys(obj)
    .filter((key) => allowFields.includes(key))
    .reduce((acc, currentKey) => {
      acc[currentKey] = obj[currentKey]
      return acc
    }, {})
  return result
}

const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/
    const isValid =
      allowed.test(file.mimetype) &&
      allowed.test(file.originalname.split('.')[1].toLowerCase())
    isValid ? cb(null, true) : cb(new AppError('Images only!', 400), false)
  }
})

const uploadUserPhoto = upload.single('photo')

const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next()
  req.file.filename = `user-${randomUUID()}.jpeg`
  await sharp(req.file.buffer)
    .resize(128, 128)
    .toFormat('jpeg')
    .jpeg({ quality: 100 })
    .toFile(`public/img/users/${req.file.filename}`)
  next()
})

const updateMe = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body)
  if (req.file) filteredBody.photo = req.file.filename
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    returnDocument: 'after',
    runValidators: true
  })
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
})

const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })
  res.status(204).json({
    status: 'success',
    data: null
  })
})

const getMe = (req, res, next) => {
  req.params.id = req.user._id
  next()
}

export {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  uploadUserPhoto,
  resizeUserPhoto,
  deleteMe,
  getMe
}
