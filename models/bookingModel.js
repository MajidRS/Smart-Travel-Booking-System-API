import mongoose from 'mongoose'

const { Schema, model } = mongoose

const bookingSchema = new Schema(
  {
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking must belong to a tour']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user']
    },
    price: {
      type: Number,
      required: [true, 'Booking must have a price']
    },
    paid: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

bookingSchema.pre(/^find/, function () {
  this.populate({
    path: 'tour',
    select: 'name'
  }).populate('user')
})

const Booking = model('Booking', bookingSchema)

export default Booking
