import Stripe from 'stripe'
import Tour from '../models/tourModel.js'
import User from '../models/userModel.js'
import Booking from '../models/bookingModel.js'
import catchAsync from '../utils/catchAsync.js'
import * as factory from '../controllers/factoryController.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours/?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}?alert=booking`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}.jpg`
            ]
          },
          unit_amount: tour.price * 100,
          currency: 'usd'
        },
        quantity: 1
      }
    ]
  })

  res.status(200).json({
    status: 'success',
    session
  })
})

const createBookingCheckout = catchAsync(async (session) => {
  const tour = session.client_reference_id
  const user = await User.findOne({ email: session.customer_email }).id
  const price = session.line_items[0].price_data.unit_amount / 100
  const booking = await Booking.create({ tour, user, price })
})

const webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    res.status(400).send(`webhook error:${error.message}`)
  }
  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object)
  }
  res.status(200).json({ received: true })
}

const createBooking = factory.createOne(Booking)
const getBooking = factory.getOne(Booking)
const getAllBookings = factory.getAll(Booking)
const updateBooking = factory.updateOne(Booking)
const deleteBooking = factory.deleteOne(Booking)

export {
  getCheckoutSession,
  webhookCheckout,
  createBooking,
  getBooking,
  getAllBookings,
  updateBooking,
  deleteBooking
}
