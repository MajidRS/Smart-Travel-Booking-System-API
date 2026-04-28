import AppError from '../utils/appError.js'

const handleCastErrorDB = (error) => {
  return new AppError(`Invalid ${error.path}: ${error.value}`, 400)
}

const handleDuplicateFieldsErrorDB = (error) => {
  const fieldName = error.errorResponse.errmsg.match(/"([^"]*)"/g)[0]
  return new AppError(
    `Duplicate field value ${fieldName}.Please use another value`,
    400
  )
}

const handleValidationErrorDB = (error) => {
  const message = Object.values(error.errors)
    .map((ele) => ele.message)
    .join('. ')
  return new AppError(`${message}`, 400)
}

const handleJsonWebTokenError = () => {
  return new AppError('Invalid token. Please log in again', 401)
}

const handleTokenExpiredError = () => {
  return new AppError('Your session has expired. Please log in again', 401)
}

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    })
  }
  console.error('ERROR 💥', err)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    message: err.message
  })
}

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      })
    }
    console.error('ERROR 💥', err)
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    })
  }
  if (err.isOperational) {
    console.log(err)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      message: err.message
    })
  }
  console.error('ERROR 💥', err)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    message: 'Please try again later.'
  })
}

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error = err
    if (err.name === 'CastError') error = handleCastErrorDB(err)
    if (err.code === 11000) error = handleDuplicateFieldsErrorDB(err)
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err)
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError()
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError()
    sendErrorProd(error, req, res)
  }
}

export default globalErrorHandler
