import mongoose from 'mongoose'
import Tour from './tourModel.js'

const { Schema, model } = mongoose

const reviewSchema = new Schema(
  {
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function () {
  if (!this.getOptions().tourIdOnly) {
    this.populate({
      path: 'tour',
      select: 'name',
      options: { skipGuides: true }
    })
  }
  this.populate({
    path: 'user',
    select: 'name photo'
  })
})

reviewSchema.statics.calcRatingsAverage = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ])
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    })
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    })
  }
}

reviewSchema.post('save', function () {
  this.constructor.calcRatingsAverage(this.tour)
})

reviewSchema.pre(/^findOneAnd/, async function () {
  this.review = await this.model.findOne(this.getQuery())
})

reviewSchema.post(/^findOneAnd/, async function () {
  await this.review.constructor.calcRatingsAverage(this.review.tour._id)
})

const Review = model('Review', reviewSchema)

export default Review
