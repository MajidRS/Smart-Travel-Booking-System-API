import mongoose from 'mongoose'
import slugify from 'slugify'

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxLength: [30, 'A tour name must have less or equal then 30 characters'],
      minLength: [10, 'A tour name must have more or equal then 10 characters']
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maxGroupSize'],
      default: 10
    },
    difficulty: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must be have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must be have a imageCover']
    },
    images: [String],
    startDates: {
      type: [Date],
      required: [true, 'A tour must be have a startDates']
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

tourSchema.index({ price: 1, ratingsAverage: -1 })

tourSchema.index({ slug: 1 })

tourSchema.index({ startLocation: '2dsphere' })

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})

tourSchema.pre('save', function () {
  this.slug = slugify(this.name, { lower: true })
})

tourSchema.pre(/^find/, function () {
  this.find({ secretTour: { $ne: true } })
  this.start = Date.now()
})

tourSchema.post(/^find/, function () {
  console.log(`Query took ${Date.now() - this.start} milliseconds`)
})

tourSchema.pre('aggregate', function () {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
})

const Tour = mongoose.model('Tour', tourSchema)

export default Tour
