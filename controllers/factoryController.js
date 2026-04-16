import catchAsync from '../utils/catchAsync.js'
import AppError from '../utils/appError.js'
import APIFeatures from '../utils/apiFeatures.js'

const getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Model.find(), req.query, req.aliasQuery)
      .filter()
      .sort()
      .selectFields()
      .pagination()
    const docs = await features.query
    res.status(200).json({
      message: 'success',
      result: docs.length,
      data: {
        data: docs
      }
    })
  })

const getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    const doc = await query
    if (!doc) {
      return next(new AppError('No document found with that ID', 404))
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    })
  })

const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body)
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc
      }
    })
  })

const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true
    })
    if (!newDoc) {
      return next(new AppError('No document found with that ID', 404))
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: newDoc
      }
    })
  })

const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id)
    if (!doc) {
      return next(new AppError('No document found with that ID', 404))
    }
    res.status(204).json({
      status: 'success',
      data: {
        data: null
      }
    })
  })

export { getAll, getOne, createOne, updateOne, deleteOne }
