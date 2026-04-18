import express from 'express'

import { configDotenv } from 'dotenv'
configDotenv({ path: './config.env' })

import morgan from 'morgan'
import qs from 'qs'
import path from 'path'
import { fileURLToPath } from 'url'

import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import hpp from 'hpp'
import xssSanitize from 'xss-sanitize'
import mongoSanitize from '@exortek/express-mongo-sanitize'

import AppError from './utils/appError.js'
import globalErrorHandler from './controllers/errorController.js'
import tourRouter from './routes/tourRoute.js'
import userRouter from './routes/userRoute.js'

const fileName = fileURLToPath(import.meta.url)
const dirName = path.dirname(fileName)
const staticFilePath = path.join(dirName, 'public')

const app = express()

app.use(helmet())

const limiter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, try again in an hour!'
  }
})

app.use(limiter)

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))

app.use(
  mongoSanitize({
    replaceWith: '_'
  })
)
app.use(xssSanitize())

app.use(hpp())

app.set('query parser', (str) => {
  return qs.parse(str, {
    allowPrototypes: false,
    depth: 5,
    parameterLimit: 100
  })
})

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(express.static(staticFilePath))

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

app.all(/.*/, (req, res, next) => {
  const error = new AppError(
    `Can't find this ${req.originalUrl} on this server`,
    404
  )
  next(error)
})

app.use(globalErrorHandler)

export default app
