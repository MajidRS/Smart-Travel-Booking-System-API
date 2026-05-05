import validator from 'validator'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const { Schema, model } = mongoose

const userSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    validate: [validator.isEmail, 'Please provide a valid email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (value) {
        return this.password === value
      },
      message: 'Password confirmation does not match'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'lead-guide', 'guide', 'user'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
})

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
  this.passwordConfirm = undefined
})

userSchema.pre('save', function () {
  if (!this.isModified('password') || this.isNew) return
  this.passwordChangedAt = Date.now() - 1000
})

userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } })
})

userSchema.methods.correctPassword = async (currentPassword, userPassword) => {
  return await bcrypt.compare(currentPassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changePasswordTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    )
    return jwtTimestamp < changePasswordTimestamp
  }
  return false
}

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000
  return resetToken
}

const User = model('User', userSchema)

export default User
