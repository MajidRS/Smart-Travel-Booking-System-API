import express from 'express'

import { configDotenv } from 'dotenv'
configDotenv({ path: './config.env' })

import morgan from 'morgan'
import qs from 'qs'
import path from 'path'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'

import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import hpp from 'hpp'
import xssSanitize from 'xss-sanitize'
import mongoSanitize from '@exortek/express-mongo-sanitize'

import AppError from './utils/appError.js'
import globalErrorHandler from './controllers/errorController.js'
import tourRouter from './routes/tourRoute.js'
import userRouter from './routes/userRoute.js'
import reviewRouter from './routes/reviewRoute.js'
import viewRouter from './routes/viewRoute.js'

const fileName = fileURLToPath(import.meta.url)
const dirName = path.dirname(fileName)
const staticFilePath = path.join(dirName, 'public')
const viewsFilePath = path.join(dirName, 'views')

const app = express()

app.use(express.static(staticFilePath))

app.set('view engine', 'pug')
app.set('views', viewsFilePath)

app.use(helmet())

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://api.mapbox.com',
        'blob:'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://api.mapbox.com',
        'https://fonts.googleapis.com'
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      workerSrc: ["'self'", 'blob:'],
      connectSrc: [
        "'self'",
        'http://localhost:3000',
        'https://api.mapbox.com',
        'https://events.mapbox.com'
      ],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://api.mapbox.com']
    }
  })
)

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
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

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

app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.all(/.*/, (req, res, next) => {
  const error = new AppError(
    `Can't find this ${req.originalUrl} on this server`,
    404
  )
  next(error)
})

app.use(globalErrorHandler)

export default app
