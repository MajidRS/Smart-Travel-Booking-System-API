import nodemailer from 'nodemailer'
import pug from 'pug'
import { fileURLToPath } from 'url'
import path from 'path'
import { htmlToText } from 'html-to-text'

const fileName = fileURLToPath(import.meta.url)
const dirName = path.dirname(fileName)
class Email {
  constructor(user, url) {
    this.from = process.env.EMAIL_FROM
    this.to = user.email
    this.firstName = user.name.split(' ')[0]
    this.url = url
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      })
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }

  async send(template, subject) {
    const html = pug.renderFile(
      path.join(dirName, '..', 'views', 'emails', `${template}.pug`),
      {
        firstName: this.firstName,
        url: this.url,
        subject
      }
    )

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html)
    }
    console.log('Sending email to:', this.to);
    console.log('Transport ready:', this.newTransport());
    await this.newTransport().sendMail(mailOptions)
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the App family ):')
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 min)'
    )
  }
}

export default Email
