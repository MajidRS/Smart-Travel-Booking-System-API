import express from 'express'
import { configDotenv } from 'dotenv'
configDotenv({ path: './config.env' })
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

import AppError from './utils/appError.js'
import globalErrorHandler from './controllers/errorController.js'
import tourRouter from './routes/tourRoute.js'

const fileName = fileURLToPath(import.meta.url)
const dirName = path.dirname(fileName)
const staticFilePath = path.join(dirName, 'public')

const app = express()

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(express.static(staticFilePath))

app.use('/api/v1/tours', tourRouter)

app.all(/.*/, (req, res, next) => {
  const error = new AppError(
    `Can't find this ${req.originalUrl} on this server`,
    404
  )
  next(error)
})

app.use(globalErrorHandler)

export default app
