import { promisify } from 'util'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/userModel.js'
import catchAsync from '../utils/catchAsync.js'
import AppError from '../utils/appError.js'
import sendEmail from '../utils/email.js'

const createSendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: 'strict'
  }

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

  res.cookie('jwt', token, cookieOptions)

  res.status(statusCode).json({
    status: 'success',
    data: {
      token,
      user
    }
  })
}

const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  })
  newUser.password = undefined
  createSendToken(newUser, 201, res)
})

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400))
  }

  const user = await User.findOne({ email }).select('+password')

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401))
  }
  createSendToken(user, 200, res)
})

const protect = catchAsync(async (req, res, next) => {
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) {
    return next(
      new AppError(
        'You are not logged in. Please log in to access this resource',
        401
      )
    )
  }
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  const user = await User.findById(decode.id)
  if (!user) {
    return next(
      new AppError('The user belonging to this token no longer exists', 401)
    )
  }
  if (user.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    )
  }
  req.user = user
  next()
})

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      )
    }
    next()
  }
}

const forgotPassword = catchAsync(async (req, res, next) => {
  const email = req.body.email
  if (!email) {
    return next(new AppError('Please provide your email', 400))
  }
  const user = await User.findOne({ email })
  if (!user) {
    return next(new AppError('User not found', 404))
  }
  const resetToken = user.generatePasswordResetToken()
  await user.save({ validateBeforeSave: false })

  const resetUrl = `${process.env.RESET_URL}/${resetToken}`

  const message = `Hello ${user.name || 'User'}, You requested to reset your password.
  Please click the link below to set a new password:
  Reset Password Link: ${resetUrl}
  This link is valid for 10 minutes. If you did not request a password reset, please ignore this email.
  Thank you,
  Your App Team `

  const mailOptions = {
    to: user.email,
    subject: 'Password Reset Request',
    message
  }

  try {
    await sendEmail(mailOptions)
    res.status(200).json({
      status: 'success',
      message: 'resetToken sent to email'
    })
  } catch (error) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500
      )
    )
  }
})

const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400))
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()
  createSendToken(user, 200, res)
})

const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401))
  }
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()
  createSendToken(user, 200, res)
})

export {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword
}
