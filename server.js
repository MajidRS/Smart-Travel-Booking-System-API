import mongoose from 'mongoose'

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION 💥 shutting down...')
  console.log(err.name, err.message)
  process.exit(1)
})

import app from './app.js'

const DB = process.env.DATABASE

mongoose.connect(DB).then(() => console.log('DB connection successfully'))

const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => console.log(`App Running On ${PORT}`))

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION 💥 shutting down...')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})
