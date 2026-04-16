import AppError from '../utils/appError.js'

const handelCastErrorDB = (error) => {
  return new AppError(`Invalid ${error.path}: ${error.value}`, 400)
}

const handelDuplicateFieldsErrorDB = (error) => {
  const fieldName = error.errorResponse.errmsg.match(/"([^"]*)"/g)[0]
  return new AppError(
    `Duplicate filed value ${fieldName}.Please use another value`,
    400
  )
}

const handelValidationErrorDB = (error) => {
  const message = Object.values(error.errors)
    .map((ele) => ele.message)
    .join('. ')
  return new AppError(`${message}`, 400)
}

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  })
}

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  } else {
    console.log('ERROR 💥', err)
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong'
    })
  }
}

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error
    if (err.name === 'CastError') error = handelCastErrorDB(err)
    if (err.code === 11000) error = handelDuplicateFieldsErrorDB(err)
    if (err.name === 'ValidationError') error = handelValidationErrorDB(err)
    error = Object.keys(error).length === 0 ? err : error
    sendErrorProd(error, res)
  }
}

export default globalErrorHandler
